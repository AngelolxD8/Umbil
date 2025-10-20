// src/app/api/ask/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
// FIX 1: Import StreamingTextResponse from 'ai/rsc' because we are in a Route Handler 
// and want to use the StreamingTextResponse utility.
import { OpenAIStream, StreamingTextResponse } from 'ai';

// IMPORTANT: Set the runtime to 'edge' for optimal streaming performance on Vercel.
export const runtime = 'edge'; 

// Define a type for a message received from the client
type ClientMessage = {
  // FIX 2: Added "system" to the role type definition
  role: "system" | "user" | "assistant";
  content: string;
};

// Updated TONE_PROMPTS - kept identical to the last version for consistency.
const TONE_PROMPTS: Record<string, string> = {
  conversational:
    "You are Umbil — a friendly, concise clinical assistant for UK doctors. Use UK English spelling and phrasing. For all clinical questions, provide highly concise, structured, and evidence-focused guidance. Reference trusted sources such as NICE, SIGN, CKS and BNF concisely where relevant. For non-clinical queries, use a conversational style. Start with a very short, conversational one-line overview. Follow with structured, evidence-based guidance (bullets or short paragraphs). Conclude with a clear, relevant follow-up suggestion.",
  formal:
    "You are Umbil — a formal and precise clinical summariser for UK doctors. Use UK English spelling and phrasing. For all clinical questions, provide highly concise, structured, and evidence-focused guidance. Reference trusted sources such as NICE, SIGN, CKS and BNF concisely where relevant. Avoid chattiness. End with a short signpost for further reading. For non-clinical questions, provide direct and factual answers.",
  reflective:
    "You are Umbil — a supportive clinical coach for UK doctors. Use UK English spelling and phrasing. For clinical questions, provide highly concise, evidence-based guidance based on trusted UK sources like NICE, SIGN, CKS and BNF, and close with a fitting suggestion for a similar, relevant follow-up question or related action. Use a warm, mentoring tone. For non-clinical queries, you may respond in a broader, more conversational style."
};

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { messages, profile, tone: toneRaw } = await req.json();

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
    
    const basePrompt = TONE_PROMPTS[tone] ?? TONE_PROMPTS.conversational;

    let personalizedPrompt = basePrompt;
    if (profile?.full_name) {
      const name = profile.full_name;
      const grade = profile.grade || "a doctor";
      personalizedPrompt = `You are Umbil, a personalized clinical assistant for ${name}, a ${grade}. ${basePrompt}`;
    }
    
    // Prepare messages array: System prompt + Conversation History
    // Now correctly typed as ClientMessage which includes 'system'
    const systemMessage: ClientMessage = { role: "system", content: personalizedPrompt };
    const fullMessages = [systemMessage, ...messages];

    // 1. Ask OpenAI for a streaming chat completion
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: fullMessages as any,
      max_tokens: 800, 
      stream: true, 
    });

    // 2. Convert the response into a friendly text-stream
    const stream = OpenAIStream(response);

    // 3. Respond with the stream
    return new StreamingTextResponse(stream);

  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    
    if (error.status === 429) {
        return NextResponse.json(
            { error: "Umbil’s taking a short pause to catch up with demand. Please check back later — your lifeline will be ready soon." },
            { status: 429 }
        );
    }

    const msg = error.message || "Sorry, an unexpected error occurred. Please try again.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}