// src/app/api/generate-reflection/route.ts
import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { createTogetherAI } from "@ai-sdk/togetherai";

// ---------- Config ----------
const API_KEY = process.env.TOGETHER_API_KEY!;
const MODEL_SLUG = "openai/gpt-oss-120b"; 

// Together AI client
const together = createTogetherAI({
  apiKey: API_KEY,
});

// The prompt you provided - NOW ASKS FOR TAGS
const REFLECTION_PROMPT = `
You are Umbil, a UK clinical reflection assistant.
Using the user’s question and the AI’s answer, generate a GMC-compliant reflective prompt.

Respond ONLY with plain text. DO NOT use markdown (like ** or *).

Include 4 short sections:
Key learning
Application
Next steps
GMC domains: Briefly explain how this learning links to one or two domains (e.g., 'Links to Knowledge, Skills & Performance by...').

Keep it concise and professional.

After the reflection, add a separator '---TAGS---' on a new line, followed by a JSON string array of 5-7 relevant clinical keywords.
Example:
[...reflection text...]

---TAGS---
["atopic eczema", "topical steroids", "NICE guidelines", "emollients", "paediatrics"]
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

Generate the reflection and tags now:
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