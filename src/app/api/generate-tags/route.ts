// src/app/api/generate-tags/route.ts
import { NextRequest, NextResponse } from "next/server";
// We use generateText for a simple JSON response, not streamText
import { generateText } from "ai"; 
import { createTogetherAI } from "@ai-sdk/togetherai";

// ---------- Config ----------
const API_KEY = process.env.TOGETHER_API_KEY!;
// Using Mixtral again as it's fast and good with JSON.
const MODEL_SLUG = "mistralai/Mixtral-8x7B-Instruct-v0.1";

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

    // --- THIS IS THE FIX ---
    // We are changing from a single 'prompt' string to the 'messages' array.
    // This is more robust and what chat models expect.
    const { text } = await generateText({
      model: together(MODEL_SLUG),
      // Use 'system' for the main instruction and 'user' for the content
      messages: [
        { role: "system", content: TAG_PROMPT },
        { 
          role: "user", 
          content: `QUESTION: ${question}\n\nANSWER: ${answer}\n\nJSON Array:` 
        }
      ],
      temperature: 0.1,
      maxOutputTokens: 200,
    });
    // --- END OF FIX ---

    // Clean up the response to ensure it's valid JSON
    const cleanedText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    // Add a safety check before parsing
    if (!cleanedText.startsWith("[") || !cleanedText.endsWith("]")) {
        console.error("[Umbil] Tag API Error: AI did not return a valid JSON array. Output:", cleanedText);
        throw new Error("AI did not return a valid JSON array.");
    }

    const tags = JSON.parse(cleanedText);
    return NextResponse.json({ tags });

  } catch (err: unknown) {
    console.error("[Umbil] Tag API Error:", (err as Error).message);
    // Return an empty array on error so the UI doesn't break
    return NextResponse.json({ tags: [] }, { status: 500 });
  }
}