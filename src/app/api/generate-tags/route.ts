// src/app/api/generate-reflection/route.ts
import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { createTogetherAI } from "@ai-sdk/togetherai";

// ---------- Config ----------
const API_KEY = process.env.TOGETHER_API_KEY!;
const MODEL_SLUG = "mistralai/Mixtral-8x7B-Instruct-v0.1"; // Good model for generation
// const MODEL_SLUG = "openai/gpt-oss-120b"; // You can also use this one

// Together AI client
const together = createTogetherAI({
  apiKey: API_KEY,
});

// The prompt you provided
const REFLECTION_PROMPT = `
You are Umbil, a UK clinical reflection assistant.

Using the user’s question and the AI’s answer, generate a GMC-compliant reflective prompt for CPD/ePortfolio use.

Include 4 short sections:
Key learning
Application
Next steps
GMC domains

Keep it concise, professional, and UK-based.
`;

// Set the runtime to edge
export const runtime = 'edge';

// ---------- Route Handler ----------
export async function POST(req: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: "TOGETHER_API_KEY not set" },
      { status: 500 }
    );
  }

  try {
    const { question, answer } = await req.json();

    if (!question || !answer) {
      return NextResponse.json(
        { error: "Missing question or answer" },
        { status: 400 }
      );
    }

    // Construct the final prompt for the AI
    const finalPrompt = `
${REFLECTION_PROMPT}

---
USER QUESTION:
${question}

AI ANSWER:
${answer}
---

Generate the reflection now:
`;

    // --- Streaming Call ---
    const result = await streamText({
      model: together(MODEL_SLUG),
      messages: [{ role: "user", content: finalPrompt }],
      temperature: 0.3,
      maxOutputTokens: 1024,
    });

    return result.toTextStreamResponse();

  } catch (err: unknown) {
    console.error("[Umbil] Reflection API Error:", err);
    const msg = (err as Error).message || "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}