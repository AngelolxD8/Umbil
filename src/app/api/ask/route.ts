// src/app/api/ask/route.ts
import { NextRequest, NextResponse } from "next/server";

// ---------- Types ----------
type OpenAIResponse = {
  choices: Array<{ message: { content: string } }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

type ClientMessage = { role: "user" | "assistant"; content: string };

// ---------- Config ----------
const TOGETHER_API_BASE_URL = "https://api.together.xyz/v1";
const CHAT_API_URL = `${TOGETHER_API_BASE_URL}/chat/completions`;
const MODEL_SLUG = "openai/gpt-oss-120b";
const API_KEY = process.env.TOGETHER_API_KEY;

// ---------- Cache ----------
const cache = new Map<string, string>();

// ---------- Helpers ----------
function sanitizeQuery(q: string) {
  return q
    .replace(/\b(john|jane|smith|mr\.|ms\.|mrs\.)\s+\w+/gi, "patient")
    .replace(/\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/g, "a specific date")
    .replace(/\b\d{6,10}\b/g, "a long identifier number")
    .replace(
      /\b(\d{1,3})\s+year\s+old\s+(male|female|woman|man|patient)\b/gi,
      "$1-year-old patient"
    );
}

// REMOVED: The unnecessary cleanCutoff function that caused truncation when the AI hit the token limit.

// ---------- Prompts ----------
const CORE_INSTRUCTIONS =
  "You are Umbil, a concise UK clinical assistant. Use NICE, SIGN, CKS, BNF, NHS, GOV.UK, RCGP, BMJ Best Practice, Resus Council UK, TOXBASE (cite only). " +
  "Do not output names or PHI. Use plain lists (no tables). Keep within about 400 tokens and finish naturally. If the response hits the token limit, it may stop mid-sentence.";

const TONE_PROMPTS: Record<string, string> = {
  conversational:
    "Be clear, friendly, and very concise. End with one helpful follow-up question.",
  formal:
    "Write in professional clinical style and close with a one-line signpost for further reading.",
  reflective:
    "Use a warm mentoring tone and end with one related reflective question.",
};

// ---------- Route ----------
export async function POST(req: NextRequest) {
  if (!API_KEY)
    return NextResponse.json(
      { error: "Server configuration error: TOGETHER_API_KEY not set." },
      { status: 500 }
    );

  try {
    const body: {
      messages?: ClientMessage[];
      profile?: { full_name?: string | null; grade?: string | null };
      tone?: string;
    } = await req.json();

    const { messages, profile, tone = "conversational" } = body;
    if (!messages?.length)
      return NextResponse.json({ error: "Missing messages" }, { status: 400 });

    const tonePrompt = TONE_PROMPTS[tone] ?? TONE_PROMPTS.conversational;
    const grade = profile?.grade ? ` User grade: ${profile.grade}.` : "";
    const systemPrompt = `${CORE_INSTRUCTIONS} ${grade} ${tonePrompt}`;

    const sanitizedMessages = messages.map((m) => ({
      ...m,
      content: m.role === "user" ? sanitizeQuery(m.content) : m.content,
    }));

    const cacheKey = JSON.stringify({
      model: MODEL_SLUG,
      systemPrompt,
      sanitizedMessages,
    });
    if (cache.has(cacheKey))
      return NextResponse.json({ answer: cache.get(cacheKey) });

    const fullMessages = [
      { role: "system", content: systemPrompt },
      ...sanitizedMessages,
    ];

    const r = await fetch(CHAT_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_SLUG,
        messages: fullMessages,
        // Using max_tokens of 500 as requested, forcing the AI to handle its own end-of-text naturally
        max_tokens: 500,
        temperature: 0.25,
        top_p: 0.8,
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      return NextResponse.json(
        { error: `Together API error: ${err}` },
        { status: r.status }
      );
    }

    const data: OpenAIResponse = await r.json();
    let answer = data.choices?.[0]?.message?.content ?? "";
    
    // The previous call to cleanCutoff(answer) is removed here.

    if (data.usage)
      console.log(
        `[UMBL-API] Tokens → total:${data.usage.total_tokens} prompt:${data.usage.prompt_tokens} completion:${data.usage.completion_tokens}`
      );

    cache.set(cacheKey, answer);
    return NextResponse.json({ answer });
  } catch (err: unknown) { // FIX 1: Corrected type from 'any' to 'unknown' to fix ESLint error
    const errorMessage = (err as { message?: string })?.message ?? "Server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}