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
    const body: { question?: unknown; tone?: unknown } = await req.json();
    const question: unknown = body?.question;
    const toneRaw: unknown = body?.tone;
    const tone =
      typeof toneRaw === "string" &&
      ["conversational", "formal", "reflective"].includes(toneRaw)
        ? toneRaw
        : "conversational";

    if (typeof question !== "string" || !question.trim()) {
      return NextResponse.json(
        { error: "Missing 'question' string" },
        { status: 400 }
      );
    }

    // Build system prompt from chosen tone
    const systemPrompt = TONE_PROMPTS[tone] ?? TONE_PROMPTS.conversational;

    // A compact few-shot example to model structure & tone
    const fewShotUser = "Example: Would you start a statin on a 55-year-old smoker?";
    const fewShotAssistant =
      "Good question — it depends mainly on cardiovascular risk. For a 55-year-old smoker, use QRISK3 to estimate 10-year CVD risk. If risk is above the usual treatment threshold (per NICE), consider starting a statin after discussing benefits/risks and shared decision-making.\n\n• Assess QRISK3 and address modifiable factors\n• Consider atorvastatin as per NICE guidance\n\nReflective prompt: How would you discuss absolute risk reduction with this patient?";

    // Call OpenAI Responses API (matches your original approach)
    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        // The Responses API can accept an "input" array with message-like objects.
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: fewShotUser },
          { role: "assistant", content: fewShotAssistant },
          { role: "user", content: String(question) },
        ],
        // Keep token limits reasonable for clinical answers
        max_output_tokens: 800,
      }),
    });

    if (!r.ok) {
      const text = await r.text();
      return NextResponse.json({ error: text }, { status: r.status });
    }

    const data: ResponsesAPI = await r.json();
    const text =
      data.output_text ??
      data.output?.[0]?.content?.[0]?.text ??
      JSON.stringify(data);

    return NextResponse.json({ answer: String(text) });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
