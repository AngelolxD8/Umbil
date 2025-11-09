// src/app/api/generate-tags/route.ts
import { NextRequest, NextResponse } from "next/server";
// We use generateText for a simple JSON response, not streamText
import { generateText } from "ai"; 
import { createTogetherAI } from "@ai-sdk/togetherai";

// ---------- Config ----------
const API_KEY = process.env.TOGETHER_API_KEY!;
const MODEL_SLUG = "openai/gpt-oss-120b";

// Together AI client
const together = createTogetherAI({
  apiKey: API_KEY,
});

const TAG_PROMPT = `
You are a clinical keyword extractor.
Analyze the following clinical question and answer.
Extract 5-7 relevant clinical keywords or concepts.

RULES:
- Respond ONLY with a valid JSON array of strings.
- Example: ["hypertension", "NICE guidelines", "ACE inhibitors", "CKD"]
- DO NOT include any other text, markdown, or explanations. Just the JSON array.
`;

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

    const finalPrompt = `
${TAG_PROMPT}

---
QUESTION:
${question}

ANSWER:
${answer}
---

JSON Array:
`;

    const { text } = await generateText({
      model: together(MODEL_SLUG),
      prompt: finalPrompt,
      temperature: 0.1,
      maxOutputTokens: 200,
    });

    // Clean up the response to ensure it's valid JSON
    // The AI might sometimes add backticks or "json"
    const cleanedText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    // Parse the string to get the array
    const tags = JSON.parse(cleanedText);

    return NextResponse.json({ tags });

  } catch (err: unknown) {
    // FIX: Removed '(err as any)' to pass linting and removed unused 'msg' variable.
    console.error("[Umbil] Tag API Error:", (err as Error).message);
    
    // Return an empty array on error so the UI doesn't break
    return NextResponse.json({ tags: [] }, { status: 500 });
  }
}