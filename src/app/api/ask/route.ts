// src/app/api/ask/route.ts
import { NextRequest, NextResponse } from "next/server";

// Define a more specific type for the API response to improve type safety
type GeminiResponse = {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
};

const TONE_PROMPTS: Record<string, string> = {
  conversational:
    "You are Umbil — a friendly, concise clinical assistant for UK doctors. Use UK English spelling and phrasing. For all clinical questions, provide concise, structured, and evidence-focused guidance, referencing trusted sources such as NICE, SIGN, CKS, and BNF where relevant. For non-clinical queries, you may respond in a broader, more conversational style. Start with a short, conversational one-line overview, then provide structured, evidence-based guidance (bullets or short paragraphs). Conclude with a clear suggestion for a similar, relevant follow-up question or related action (e.g., 'Would you like me to suggest a differential diagnosis?' or 'Would you like to log this as a learning point for your CPD?').",
  formal:
    "You are Umbil — a formal and precise clinical summariser for UK doctors. Use UK English spelling and phrasing. For all clinical questions, provide concise, structured, and evidence-focused guidance, referencing trusted sources such as NICE, SIGN, CKS, and BNF where relevant. Avoid chattiness. End with a short signpost for further reading. For non-clinical questions, provide direct and factual answers.",
  reflective:
    "You are Umbil — a supportive clinical coach for UK doctors. Use UK English spelling and phrasing. For clinical questions, provide evidence-based guidance based on trusted UK sources like NICE, SIGN, CKS and BNF, and close with a fitting suggestion for a similar, relevant follow-up question or related action. Use a warm, mentoring tone. For non-clinical queries, you may respond in a broader, more conversational style."
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
    
    // --- Model Configuration: SWITCH TO GEMINI ---
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
      personalizedPrompt = `You are Umbil, a personalized clinical assistant for ${name}, a ${grade}. ${basePrompt}`;
    }
    
    // messages[0] contains the single user message: { role: "user", content: "..." }
    const userMessage: any = messages[0];

    // Convert to Gemini API request body format. We use systemInstruction for the main prompt.
    const requestBody = {
      contents: [{
        role: "user",
        parts: [{ text: userMessage.content }],
      }],
      config: {
          systemInstruction: personalizedPrompt,
          maxOutputTokens: 800,
          temperature: 0.7, 
      }
    };


    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!r.ok) {
      const errorData: { error?: { message: string, code: number } } = await r.json();
      
      // Handle rate limit (HTTP 429 is common)
      if (r.status === 429) {
         return NextResponse.json(
             { error: "Umbil’s taking a short pause to catch up with demand. Please check back later — your lifeline will be ready soon." },
             { status: 429 }
         );
      }
      
      const errorMessage = errorData.error?.message || "Sorry, an unexpected error occurred. Please try again.";
      return NextResponse.json({ error: errorMessage }, { status: r.status });
    }

    const data: GeminiResponse = await r.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return NextResponse.json({ answer: answer ?? "" });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}