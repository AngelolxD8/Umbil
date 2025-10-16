// src/app/api/ask/route.ts
import { NextRequest, NextResponse } from "next/server";

// Define a more specific type for the API response to improve type safety
type OpenAIResponse = {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
};

const TONE_PROMPTS: Record<string, string> = {
  conversational:
    "You are Umbil — a friendly, concise clinical assistant for UK doctors. Use UK English spelling and phrasing. For clinical questions, prefer trusted sources like NICE, SIGN, CKS and BNF where relevant. You can also answer non-clinical questions, but maintain a helpful and professional tone. Start with a short, conversational one-line overview, then provide structured, evidence-based guidance (bullets or short paragraphs). Conclude with a fitting question to encourage reflective thinking and support CPD (e.g., 'How might you discuss this with the patient?' or 'Would you like to log this as a learning point for your CPD?'). Keep language clear and clinician-friendly.",
  formal:
    "You are Umbil — a formal and precise clinical summariser for UK doctors. Use UK English spelling and phrasing. For all clinical questions, provide concise, structured, and evidence-focused guidance, referencing trusted sources such as NICE, SIGN, CKS, and BNF where relevant. Avoid chattiness. End with a short signpost for further reading. For non-clinical questions, provide direct and factual answers.",
  reflective:
    "You are Umbil — a supportive clinical coach for UK doctors. Use UK English spelling and phrasing. For clinical questions, provide evidence-based guidance based on trusted UK sources like NICE, SIGN, CKS and BNF, and close with reflective questions and prompts to encourage learning and CPD. Use a warm, mentoring tone. For non-clinical queries, you may respond in a broader, more conversational style."
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
    
    // START of new architectural approach
    // With a full solution, this is where you would:
    // 1. Check a cache for a pre-computed response.
    // 2. If a cache miss, use the user's message to retrieve relevant context from a database.
    // 3. Construct a more targeted system prompt and add the retrieved context.
    // For now, we'll just send the last message to the model.

    const basePrompt = TONE_PROMPTS[tone] ?? TONE_PROMPTS.conversational;

    let personalizedPrompt = basePrompt;
    if (profile?.full_name) {
      const name = profile.full_name;
      const grade = profile.grade || "a doctor";
      personalizedPrompt = `You are Umbil, a personalized clinical assistant for ${name}, a ${grade}. ${basePrompt}`;
    }

    const fullMessages = [{ role: "system", content: personalizedPrompt }, messages[0]];

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
    // END of new architectural approach

    if (!r.ok) {
      const errorData = await r.json();
      
      if (errorData.error?.code === "rate_limit_exceeded" || r.status === 429) {
         return NextResponse.json(
             { error: "Umbil’s taking a short pause to catch up with demand. Please check back later — your lifeline will be ready soon." },
             { status: 429 }
         );
      }
      
      return NextResponse.json({ error: "Sorry, an unexpected error occurred. Please try again." }, { status: r.status });
    }

    const data: OpenAIResponse = await r.json();
    const answer = data.choices?.[0]?.message?.content;

    return NextResponse.json({ answer: answer ?? "" });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}