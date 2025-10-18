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
  // Roles MUST be 'user' or 'model' for chat history in contents
  role: "user" | "model"; 
  content: string;
};

const TONE_PROMPTS: Record<string, string> = {
  // Concise prompts (kept short to avoid payload limits)
  conversational:
    "You are Umbil, a concise clinical assistant for UK doctors. Use UK English spelling. Provide structured, evidence-based guidance, referencing NICE, SIGN, CKS, or BNF where relevant. For non-clinical queries, be conversational. Conclude with a suggestion for a relevant follow-up question or action (e.g., CPD logging).",
  formal:
    "You are Umbil, a formal and precise clinical summariser for UK doctors. Use UK English spelling. Provide concise, structured, evidence-focused guidance, referencing NICE, SIGN, CKS, or BNF. Avoid chattiness. End with a short signpost for further reading.",
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
      // Concatenate personalization. Keeping it short is best practice for system instructions.
      personalizedPrompt = `Personalized for ${name}, a ${grade}. ${basePrompt}`;
    }
    
    // --- FIX 1: Correctly map client messages to the required API content structure ---
    const contents = (messages as ClientMessage[]).map((message) => ({
      role: message.role, // Must be 'user' or 'model'
      parts: [{ text: message.content }], // Must be wrapped in 'parts'
    }));

    // --- FIX 2: Use the model's preferred system instruction format (plain string, wrapped for safety) ---
    // The previous attempt to use 'author' or the wrong object structure caused the error.
    // We will use a top-level field `systemInstruction` with the plain text, 
    // which is the documented method and should eliminate the "Content" object error.
    
    // If the top-level string `systemInstruction` property is *still* rejected, 
    // it means the service is expecting it inside the first 'user' message as a special token,
    // which is bad practice and unnecessary for Gemini. Let's stick to the cleanest documented approach first.
    
    const requestBody = {
      // 1. System Instruction as a plain text string
      systemInstruction: personalizedPrompt, 
      
      // 2. Contents array now contains the entire conversation history in the correct role/parts format
      contents: contents,

      // 3. generationConfig now ONLY contains model parameters
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