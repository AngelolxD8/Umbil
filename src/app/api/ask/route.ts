// src/app/api/ask/route.ts
import { NextRequest, NextResponse } from "next/server";

// Define a more specific type for the API response to improve type safety
type OpenAIResponse = {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  // Added usage type for token logging
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

// Define a type for a message received from the client
type ClientMessage = {
  role: "user" | "assistant";
  content: string;
};

// Conceptual In-Memory Cache (Non-persistent across lambda cold starts, but catches immediate repeats)
const cache = new Map<string, string>();

// Updated TONE_PROMPTS for Tighter Prompt (Added "highly concise")
const TONE_PROMPTS: Record<string, string> = {
  conversational:
    "You are Umbil — a friendly, concise clinical assistant for UK doctors. Use UK English spelling and phrasing. For all clinical questions, provide highly concise, structured, and evidence-focused guidance. Reference trusted sources such as NICE, SIGN, CKS and BNF concisely where relevant. For non-clinical queries, use a conversational style. Start with a very short, conversational one-line overview. Follow with structured, evidence-based guidance (bullets or short paragraphs). Conclude with a clear, relevant follow-up suggestion.",
  formal:
    "You are Umbil — a formal and precise clinical summariser for UK doctors. Use UK English spelling and phrasing. For all clinical questions, provide highly concise, structured, and evidence-focused guidance. Reference trusted sources such as NICE, SIGN, CKS and BNF concisely where relevant. Avoid chattiness. End with a short signpost for further reading. For non-clinical questions, provide direct and factual answers.",
  reflective:
    "You are Umbil — a supportive clinical coach for UK doctors. Use UK English spelling and phrasing. For clinical questions, provide highly concise, evidence-based guidance based on trusted UK sources like NICE, SIGN, CKS and BNF, and close with a fitting suggestion for a similar, relevant follow-up question or related action. Use a warm, mentoring tone. For non-clinical queries, you may respond in a broader, more conversational style."
};

export async function POST(req: NextRequest) {
  try {
    const body: { messages?: ClientMessage[]; profile?: { full_name?: string | null; grade?: string | null }; tone?: unknown } = await req.json();
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
    
    const basePrompt = TONE_PROMPTS[tone] ?? TONE_PROMPTS.conversational;

    let personalizedPrompt = basePrompt;
    if (profile?.full_name) {
      const name = profile.full_name;
      const grade = profile.grade || "a doctor";
      personalizedPrompt = `You are Umbil, a personalized clinical assistant for ${name}, a ${grade}. ${basePrompt}`;
    }

    // 1. Construct Cache Key from the full request (messages and personalized prompt)
    const cacheKey = JSON.stringify({ messages, personalizedPrompt });

    // 2. Check Cache
    if (cache.has(cacheKey)) {
        // Cache Hit: Respond instantly without calling OpenAI
        console.log(`[UMBL-API] Cache HIT!`);
        // Log Cache usage as 0 tokens, as requested
        console.log(`[UMBL-API] Tokens Used: Total: 0, (Cache Hit)`);
        return NextResponse.json({ answer: cache.get(cacheKey) ?? "" });
    }

    // Prepare messages array: System prompt + Conversation History
    const systemMessage = { role: "system", content: personalizedPrompt };
    const fullMessages = [systemMessage, ...messages];

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: fullMessages,
        max_tokens: 800,
      }),
    });

    if (!r.ok) {
      const errorData = await r.json();
      
      if (errorData.error?.code === "rate_limit_exceeded" || r.status === 429) {
         return NextResponse.json(
             { error: "Umbil’s taking a short pause to catch up with demand. Please check back later — your lifeline will be ready soon." },
             { status: 429 }
         );
      }
      
      return NextResponse.json({ error: errorData.error?.message || "Sorry, an unexpected error occurred. Please try again." }, { status: r.status });
    }

    const data: OpenAIResponse = await r.json();
    const answer = data.choices?.[0]?.message?.content;
    
    // START: Token Logging Implementation
    if (data.usage) {
        console.log(`[UMBL-API] Tokens Used: Total: ${data.usage.total_tokens}, Prompt: ${data.usage.prompt_tokens}, Completion: ${data.usage.completion_tokens}`);
    } else {
        console.log(`[UMBL-API] Tokens Used: Usage information not available in response.`);
    }
    // END: Token Logging Implementation

    // 3. Set Cache
    if (answer) {
        cache.set(cacheKey, answer);
    }

    return NextResponse.json({ answer: answer ?? "" });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}