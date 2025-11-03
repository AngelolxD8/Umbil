// src/app/api/ask/route.ts
import { NextRequest, NextResponse } from "next/server";

type OpenAIResponse = {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

type ClientMessage = {
  role: "user" | "assistant";
  content: string;
};

// --- Together AI GPT-OSS Config ---
const TOGETHER_API_BASE_URL = "https://api.together.xyz/v1";
const CHAT_API_URL = `${TOGETHER_API_BASE_URL}/chat/completions`;
const API_KEY = process.env.TOGETHER_API_KEY;
const MODEL_SLUG = "openai/gpt-oss-120b";

// --- In-Memory Cache (temporary) ---
const cache = new Map<string, string>();

// --- Sanitization ---
function sanitizeQuery(query: string): string {
  let sanitized = query;
  sanitized = sanitized.replace(/\b(john|jane|smith|doctore|nurse|patient\s+x|mr\.|ms\.|mrs\.)\s+\w+/gi, "patient");
  sanitized = sanitized.replace(/\b(john|jane|smith|david|sarah|patient\s+x|mr\.|ms\.|mrs\.)\b/gi, "patient");
  sanitized = sanitized.replace(/\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/g, "a specific date");
  sanitized = sanitized.replace(/\b\d{6,10}\b/g, "a long identifier number");
  sanitized = sanitized.replace(/\b(\d{1,3})\s+year\s+old\s+(male|female|woman|man|patient)\b/gi, "$1-year-old patient");
  return sanitized;
}

// --- Core instructions (with soft limit tag) ---
const CORE_INSTRUCTIONS =
  "You are Umbil, a concise clinical assistant for UK professionals. Use UK English. " +
  "Provide structured, evidence-based guidance using NICE, SIGN, CKS, BNF, NHS, GOV.UK, RCGP, BMJ Best Practice, Resus Council UK, TOXBASE (cite only). " +
  "Do not include names, identifiers, or PHI. Avoid markdown tables. Keep within 400–500 tokens. " +
  "End every valid response with the marker '---END---' so truncation can be detected.";

// --- Tone prompts ---
const TONE_PROMPTS: Record<string, string> = {
  conversational:
    "Be extremely concise and friendly. End with a short follow-up question separated by a horizontal rule ('---').",
  formal:
    "Be clinical and structured. End with a short signpost for further reading and '---END---'.",
  reflective:
    "Use a mentoring tone and finish with one actionable follow-up prompt, then '---END---'.",
};

// --- Helper: Trim incomplete endings ---
function cleanCutoff(text: string): string {
  if (!text) return "";
  // Trim after the explicit END marker if found
  const markerIndex = text.indexOf("---END---");
  if (markerIndex !== -1) {
    return text.slice(0, markerIndex).trim();
  }
  // Otherwise trim to the last full sentence or newline
  const idx = Math.max(text.lastIndexOf(". "), text.lastIndexOf("\n"));
  return idx > 0 ? text.slice(0, idx + 1).trim() : text.trim();
}

export async function POST(req: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: "Server configuration error: TOGETHER_API_KEY is not set." },
      { status: 500 }
    );
  }

  try {
    const body: {
      messages?: ClientMessage[];
      profile?: { full_name?: string | null; grade?: string | null };
      tone?: unknown;
    } = await req.json();

    const { messages, profile, tone: toneRaw } = body;

    const tone =
      typeof toneRaw === "string" &&
      ["conversational", "formal", "reflective"].includes(toneRaw)
        ? toneRaw
        : "conversational";

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Missing 'messages' array" }, { status: 400 });
    }

    const baseToneInstruction = TONE_PROMPTS[tone] ?? TONE_PROMPTS.conversational;
    const gradeContext = profile?.grade ? ` The user's grade is ${profile.grade}.` : "";
    const systemPromptContent = `${CORE_INSTRUCTIONS}${gradeContext} ${baseToneInstruction}`;

    const sanitizedMessages: ClientMessage[] = messages.map((msg) => ({
      ...msg,
      content: msg.role === "user" ? sanitizeQuery(msg.content) : msg.content,
    }));

    const cacheKey = JSON.stringify({
      messages: sanitizedMessages,
      systemPromptContent,
      model: MODEL_SLUG,
    });

    if (cache.has(cacheKey)) {
      console.log(`[UMBL-API] Cache HIT`);
      return NextResponse.json({ answer: cache.get(cacheKey) ?? "" });
    }

    const systemMessage = { role: "system", content: systemPromptContent };
    const fullMessages = [systemMessage, ...sanitizedMessages];

    const r = await fetch(CHAT_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_SLUG,
        messages: fullMessages,
        max_tokens: 500, // still capped
        temperature: 0.2,
        top_p: 0.8,
        stop: ["---END---", "\n\n", "\n- "], // prevents awkward cutoff
      }),
    });

    if (!r.ok) {
      const errorData = await r.json().catch(() => ({}));
      const errorMsg = errorData.error?.message || "Unexpected error from Together API";
      return NextResponse.json({ error: errorMsg }, { status: r.status });
    }

    const data: OpenAIResponse = await r.json();
    let answer = data.choices?.[0]?.message?.content ?? "";

    // --- Post-process cleanup ---
    answer = cleanCutoff(answer);

    if (data.usage) {
      console.log(
        `[UMBL-API] Tokens Used: total=${data.usage.total_tokens}, prompt=${data.usage.prompt_tokens}, completion=${data.usage.completion_tokens}`
      );
    } else {
      console.log(`[UMBL-API] Tokens Used: not reported`);
    }

    if (answer) {
      cache.set(cacheKey, answer);
    }

    return NextResponse.json({ answer });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
