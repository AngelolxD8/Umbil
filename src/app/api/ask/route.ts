// src/app/api/ask/route.ts
import { NextRequest, NextResponse } from "next/server";

// Define a type for a single message part
type ContentPart = { text: string };

// Define a type for the API response to improve type safety
type GeminiResponse = {
  candidates: Array<{
    content: {
      parts: ContentPart[];
    };
  }>;
};

// Define a type for a message received from the client
type ClientMessage = {
  role: "user" | "model";
  content: string;
};

const TONE_PROMPTS: Record<string, string> = {
  // --- MODIFIED: Concise Prompt for Conversational Tone ---
  conversational:
    "You are Umbil, a concise clinical assistant for UK doctors. Use UK English spelling. Provide structured, evidence-based guidance, referencing NICE, SIGN, CKS, or BNF where relevant. For non-clinical queries, be conversational. Conclude with a suggestion for a relevant follow-up question or action (e.g., CPD logging).",
  // --- MODIFIED: Concise Prompt for Formal Tone ---
  formal:
    "You are Umbil, a formal and precise clinical summariser for UK doctors. Use UK English spelling. Provide concise, structured, evidence-focused guidance, referencing NICE, SIGN, CKS, or BNF. Avoid chattiness. End with a short signpost for further reading.",
  // --- MODIFIED: Concise Prompt for Reflective Tone ---
  reflective:
    "You are Umbil, a supportive clinical coach for UK doctors. Use UK English spelling. Provide evidence-based guidance (NICE, SIGN, CKS, BNF) and close with a suggestion for a similar, relevant follow-up or reflective action. Use a warm, mentoring tone."
};


export async function POST(req: NextRequest) {
  try {
    const body: { messages?: unknown; profile?: { full_name?: string | null; grade?: string | null }; tone?: unknown } = await req.json();
    const { messages, profile, tone: toneRaw } = body;

    const tone =
      typeof toneRaw === "string" &&
      ["conversational", "formal", "reflective"].includes(toneRaw)
        ? toneRaw
        : "conversational";

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Missing 'messages' array" },
        { status: 400 }
      );
    }
    
    // --- Model Configuration: SWITCH TO GEMINI 2.5 FLASH-LITE ---
    const GEMINI_MODEL = "gemini-2.5-flash-lite"; // Highest throughput for scaling
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY environment variable not set." },
        { status: 500 }
      );
    }

    const basePrompt = TONE_PROMPTS[tone] ?? TONE_PROMPTS.conversational;

    let personalizedPrompt = basePrompt;
    if (profile?.full_name) {
      const name = profile.full_name;
      const grade = profile.grade || "a doctor";
      // --- MODIFIED: Shorter personalization insertion ---
      personalizedPrompt = `Personalized for ${name}, a ${grade}. ${basePrompt}`;
    }
    
    // Map client messages to the API's expected content shape:
    // each message should include an "author" (system/user/assistant) and a "content" object with parts[]
    const contents = (messages as ClientMessage[]).map((message) => ({
      author: message.role === "user" ? "user" : "assistant",
      content: {
        parts: [{ text: message.content }],
      },
    }));

    // systemInstruction must be a Content object (not a plain string)
    const systemInstruction = {
      parts: [{ text: personalizedPrompt }],
    };

    const requestBody = {
      systemInstruction, // now an object with parts[]
      contents, // conversation messages
      generationConfig: {
        maxOutputTokens: 800,
        temperature: 0.7,
      },
    };

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!r.ok) {
      const errorData: { error?: { message: string; code?: number } } = await r.json();
      const detailedError = errorData.error?.message || `API Request Failed (Status: ${r.status})`;

      // Handle rate limit (HTTP 429 is common)
      if (r.status === 429) {
         return NextResponse.json(
             { error: "Umbil’s taking a short pause to catch up with demand. Please check back later — your lifeline will be ready soon." },
             { status: 429 }
         );
      }

      return NextResponse.json({ error: detailedError }, { status: r.status });
    }

    const data: GeminiResponse = await r.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    return NextResponse.json({ answer });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}