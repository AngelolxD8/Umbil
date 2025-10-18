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

export async function POST(req: NextRequest) {
  try {
    const body: ApiBody = await req.json();
    const { messages, profile, tone: toneRaw } = body;

    const tone =
      typeof toneRaw === "string" &&
      ["conversational", "formal", "reflective"].includes(toneRaw)
        ? toneRaw
        : "conversational";

    if (!Array.isArray(messages) || (messages as any[]).length === 0) {
      return NextResponse.json({ error: "Missing 'messages' array" }, { status: 400 });
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

    // personalization prefix (keep it short)
    const personalization =
      profile?.full_name ? `Personalized for ${profile.full_name}${profile.grade ? `, ${profile.grade}` : ""}. ` : "";

    const systemPrompt = `${personalization}${basePrompt}`;

    // Map client messages to API's expected messages array:
    const clientMessages = (messages as ClientMessage[]).map((m) => {
      // Map our 'model' role to 'assistant' in Google API terms
      const author = m.role === "user" ? "user" : "assistant";
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

    // Prepend system message
    const messagesForApi = [
      {
        author: "system",
        content: [
          {
            type: "text",
            text: systemPrompt
          }
        ]
      },
      // then conversation history
      ...clientMessages
    ];

    const requestBody = {
      // The `generateContent` endpoint expects messages-like content with authors & content.parts
      // Keep generation params simple and top-level where supported:
      messages: messagesForApi,
      // generationConfig may be accepted as nested; many examples accept simple top-level params too
      // but keeping them under generationConfig is safe
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
      // try to surface a helpful message from the API
      let errText = `API Request Failed (Status: ${r.status})`;
      try {
        const errJson = await r.json();
        errText = errJson.error?.message ?? JSON.stringify(errJson);
      } catch {
        // keep default errText
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

    // Response parsing: different API versions give slightly different shapes.
    // Try the common candidate/content.parts.* places, fallback to joined text from candidates.
    let answer = "";
    try {
      // Most common structure
      answer =
        data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || p).join("") ||
        data?.candidates?.[0]?.content?.text ||
        data?.candidates?.[0]?.content?.[0]?.text ||
        data?.outputText ||
        "";
    } catch {
      answer = JSON.stringify(data).slice(0, 1000); // fallback: include snippet
    }

    return NextResponse.json({ answer });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
