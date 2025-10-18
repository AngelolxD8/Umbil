// src/app/api/ask/route.ts
import { NextRequest, NextResponse } from "next/server";

type ClientMessage = {
  role: "user" | "model";
  content: string;
};

type ApiBody = {
  messages?: unknown;
  profile?: { full_name?: string | null; grade?: string | null };
  tone?: unknown;
};

type ApiMessageForGemini = {
  author: "system" | "user" | "assistant";
  content: Array<{ type: "text"; text: string }>;
};

export async function POST(req: NextRequest) {
  try {
    const body: ApiBody = await req.json();
    const { messages, profile, tone: toneRaw } = body;

    const tone =
      typeof toneRaw === "string" &&
      ["conversational", "formal", "reflective"].includes(toneRaw)
        ? toneRaw
        : "conversational";

    // Validate messages is an array of objects that at least have content string
    if (!Array.isArray(messages) || (messages as unknown[]).length === 0) {
      return NextResponse.json({ error: "Missing 'messages' array" }, { status: 400 });
    }

    // Narrow messages to ClientMessage[] where possible
    const messagesTyped = (messages as unknown[]).filter((m): m is ClientMessage => {
      return (
        typeof m === "object" &&
        m !== null &&
        ("role" in m) &&
        ("content" in m) &&
        (m as any).content !== undefined &&
        (typeof (m as any).content === "string") &&
        ((m as any).role === "user" || (m as any).role === "model")
      );
    });

    if (messagesTyped.length === 0) {
      return NextResponse.json({ error: "No valid messages found" }, { status: 400 });
    }

    const GEMINI_MODEL = "gemini-2.5-flash-lite";
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY environment variable not set." }, { status: 500 });
    }

    const TONE_PROMPTS: Record<string, string> = {
      conversational:
        "You are Umbil, a concise clinical assistant for UK doctors. Use UK English spelling. Provide structured, evidence-based guidance, referencing NICE, SIGN, CKS, or BNF where relevant. For non-clinical queries, be conversational. Conclude with a suggestion for a relevant follow-up question or action (e.g., CPD logging).",
      formal:
        "You are Umbil, a formal and precise clinical summariser for UK doctors. Use UK English spelling. Provide concise, structured, evidence-focused guidance, referencing NICE, SIGN, CKS, or BNF. Avoid chattiness. End with a short signpost for further reading.",
      reflective:
        "You are Umbil, a supportive clinical coach for UK doctors. Use UK English spelling. Provide evidence-based guidance (NICE, SIGN, CKS, BNF) and close with a suggestion for a similar, relevant follow-up or reflective action. Use a warm, mentoring tone."
    };

    const basePrompt = TONE_PROMPTS[tone] ?? TONE_PROMPTS.conversational;
    const personalization =
      profile?.full_name ? `Personalized for ${profile.full_name}${profile.grade ? `, ${profile.grade}` : ""}. ` : "";
    const systemPrompt = `${personalization}${basePrompt}`;

    const clientMessagesForApi: ApiMessageForGemini[] = messagesTyped.map((m) => {
      const author: ApiMessageForGemini["author"] = m.role === "user" ? "user" : "assistant";
      return {
        author,
        content: [
          {
            type: "text",
            text: m.content ?? ""
          }
        ]
      };
    });

    const messagesForApi: ApiMessageForGemini[] = [
      {
        author: "system",
        content: [
          {
            type: "text",
            text: systemPrompt
          }
        ]
      },
      ...clientMessagesForApi
    ];

    const requestBody = {
      messages: messagesForApi,
      generationConfig: {
        maxOutputTokens: 800,
        temperature: 0.7
      }
    };

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!r.ok) {
      let errText = `API Request Failed (Status: ${r.status})`;
      try {
        const errJson = await r.json();
        if (errJson && typeof errJson === "object" && "error" in errJson) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore - errJson typing is unknown from the API
          errText = (errJson as any).error?.message ?? JSON.stringify(errJson);
        } else {
          errText = JSON.stringify(errJson);
        }
      } catch {
        // keep default
      }

      if (r.status === 429) {
        return NextResponse.json(
          { error: "Umbil’s taking a short pause to catch up with demand. Please check back later." },
          { status: 429 }
        );
      }
      return NextResponse.json({ error: errText }, { status: r.status });
    }

    const data = await r.json();

    // Safely extract string output from several possible response shapes
    const answer = extractTextFromResponse(data);

    return NextResponse.json({ answer });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * Safely attempts to extract textual answer from the API response.
 * Avoids `any` by treating response as unknown and checking shapes.
 */
function extractTextFromResponse(response: unknown): string {
  // Typical structure: { candidates: [ { content: { parts: [ { text: "..." } ] } } ] }
  if (isObject(response)) {
    const maybeCandidates = (response as Record<string, unknown>)["candidates"];
    if (Array.isArray(maybeCandidates) && maybeCandidates.length > 0) {
      const first = maybeCandidates[0];
      if (isObject(first)) {
        const content = (first as Record<string, unknown>)["content"];
        if (isObject(content)) {
          const parts = content["parts"];
          if (Array.isArray(parts) && parts.length > 0) {
            // collect text fields from parts if present
            const texts: string[] = [];
            for (const p of parts) {
              if (isObject(p) && typeof p["text"] === "string") {
                texts.push(p["text"]);
              } else if (typeof p === "string") {
                texts.push(p);
              }
            }
            if (texts.length > 0) return texts.join("");
          }
          // fallback: content might have 'text' directly
          if (typeof content["text"] === "string") return content["text"];
        }
      }
    }

    // Another common shape: { outputText: "..." } or { answer: "..." }
    if (typeof (response as Record<string, unknown>)["outputText"] === "string") {
      return (response as Record<string, unknown>)["outputText"] as string;
    }
    if (typeof (response as Record<string, unknown>)["answer"] === "string") {
      return (response as Record<string, unknown>)["answer"] as string;
    }
  }

  // As a last resort, return a short JSON snippet (safe):
  try {
    const json = JSON.stringify(response);
    return json.length > 200 ? json.slice(0, 200) + "..." : json;
  } catch {
    return "";
  }
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
