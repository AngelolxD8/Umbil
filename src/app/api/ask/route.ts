// src/app/api/ask/route.ts
import { NextRequest, NextResponse } from "next/server";

type ResponsesAPI = {
  output_text?: string;
  output?: Array<{
    content?: Array<{ type?: string; text?: string }>;
  }>;
};

export async function POST(req: NextRequest) {
  try {
    const body: { question?: unknown } = await req.json();
    const question: unknown = body?.question;

    if (typeof question !== "string" || !question.trim()) {
      return NextResponse.json(
        { error: "Missing 'question' string" },
        { status: 400 }
      );
    }

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: [
          {
            role: "system",
            content:
              "You are a clinical assistant for UK doctors. Prefer NICE, SIGN, CKS, and BNF. Be concise, structured and practical.",
          },
          { role: "user", content: question },
        ],
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

    return NextResponse.json({ answer: text });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
