// src/app/api/ask/route.ts
import { NextRequest, NextResponse } from "next/server";

type ResponsesAPI = {
  output_text?: string;
  output?: Array<{
    content?: Array<{ type?: string; text?: string }>;
  }>;
};

const TONE_PROMPTS: Record<string, string> = {
  conversational:
    "You are Umbil — a friendly, concise clinical assistant for UK doctors. Prefer NICE, SIGN, CKS and BNF where relevant. Start with a short, conversational one-line overview, then provide structured, evidence-based guidance (bullets or short paragraphs). End with a short reflective prompt to support CPD (e.g. 'How might you discuss this with the patient?'). Keep language clear and clinician-friendly.",
  formal:
    "You are Umbil — a formal and precise clinical summariser for UK doctors. Prefer NICE, SIGN, CKS and BNF where relevant. Provide concise, structured, evidence-focused guidance. Avoid chattiness. End with a short signpost for further reading.",
  reflective:
    "You are Umbil — a supportive clinical coach for UK doctors. Prefer NICE, SIGN, CKS and BNF where relevant. Provide evidence-based guidance and close with reflective questions and prompts to encourage learning and CPD. Use a warm, mentoring tone."
};

export async function POST(req: NextRequest) {
  try {
    const body: { messages?: unknown; profile?: { full_name?: string | null; grade?: string | null }; tone?: unknown } = await req.json();
    const messages: unknown = body?.messages;
    const profile = body?.profile;
    const toneRaw: unknown = body?.tone;

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

    const fullMessages = [{ role: "system", content: personalizedPrompt }, ...messages];

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
      return NextResponse.json({ error: errorData.error.message || "Request to OpenAI failed" }, { status: r.status });
    }

    const data = await r.json();
    const answer = data.choices?.[0]?.message?.content;

    return NextResponse.json({ answer: String(answer) });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}