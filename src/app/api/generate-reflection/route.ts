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
    const { question, answer, userNotes, mode } = await req.json();

    if (!question || !answer) {
      return NextResponse.json(
        { error: "Missing question or answer" },
        { status: 400 }
      );
    }

    // --- 1. DEFINE PROMPTS BASED ON MODE ---
    let systemInstruction = "";
    let outputFormat = "";

    if (mode === 'personalise') {
      // MODE: PERSONALISE (TIDY UP ONLY)
      // We explicitly tell it NOT to use the headers.
      systemInstruction = `
      You are an expert Medical Editor. 
      The user has written rough clinical notes below.
      
      YOUR TASK:
      1. Tidy up the grammar, spelling, and flow.
      2. Make it sound professional and concise.
      3. **KEEP IT EXACT:** Do NOT add new facts, do NOT invent patients, and do NOT add sections like "Key Learning" or "Next Steps". Just give back the polished paragraphs.
      `;
      
      outputFormat = `
      Output the polished text directly.
      Then, on a new line, add '---TAGS---' followed by a JSON string array of 5-7 keywords.
      `;

    } else {
      // MODE: AUTO-GENERATE (FULL STRUCTURE)
      // This keeps the original helpful structure for generic learning.
      systemInstruction = `
      You are Umbil, a UK clinical reflection assistant.
      The user wants a GENERIC educational reflection based on the Q&A below.
      
      YOUR TASK:
      1. Write a reflective entry (I refreshed my knowledge on...).
      2. DO NOT invent a specific patient encounter.
      3. Focus on the clinical theory.
      `;

      outputFormat = `
      Structure your response into these 4 sections:
      1. Key learning
      2. Application
      3. Next steps
      4. GMC domains
      
      Then, on a new line, add '---TAGS---' followed by a JSON string array of 5-7 keywords.
      `;
    }

    // --- 2. CONSTRUCT FINAL PROMPT ---
    const finalPrompt = `
${systemInstruction}

---
CONTEXT (Background Info):
Question: ${question}
Answer: ${answer}

USER NOTES (Target Text):
"${userNotes ? userNotes : "(No notes provided)"}"
---

${outputFormat}
RESPOND ONLY WITH PLAIN TEXT (No Markdown).
`;

    // --- 3. STREAMING CALL ---
    const result = await streamText({
      model: together(MODEL_SLUG),
      messages: [{ role: "user", content: finalPrompt }],
      temperature: 0.2, // Keep strictly factual
      maxOutputTokens: 1024,
    });

    return result.toTextStreamResponse();

  } catch (err: unknown) {
    console.error("[Umbil] Reflection API Error:", err);
    const msg = (err as Error).message || "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}