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
    // 1. Get the new 'mode' parameter
    const { question, answer, userNotes, mode } = await req.json();

    if (!question || !answer) {
      return NextResponse.json(
        { error: "Missing question or answer" },
        { status: 400 }
      );
    }

    // 2. Define Mode-Specific Instructions
    // prevent "making stuff up" by forcing generic language in Auto mode
    // and strict adherence in Personalise mode.
    
    let modeInstruction = "";

    if (mode === 'personalise') {
      modeInstruction = `
      MODE: PERSONALISE (STRICT)
      - The user has provided rough notes below.
      - Your goal is to POLISH these notes into a professional reflection.
      - **DO NOT** add any new facts, patients, or scenarios that are not in the notes.
      - If the notes are brief, keep the reflection brief. Do not invent details to fill space.
      `;
    } else {
      // Auto Mode
      modeInstruction = `
      MODE: AUTO-GENERATE (GENERIC)
      - The user has not provided specific notes. 
      - Write a **generic** educational reflection based on the topic below.
      - **DO NOT** invent a specific patient encounter or a specific date.
      - Use phrases like "I refreshed my knowledge on...", "This was a helpful reminder...", or "I reviewed the guidelines for..."
      - Focus on the *clinical theory* provided in the context.
      `;
    }

    // 3. Construct the Final Prompt
    const finalPrompt = `
You are Umbil, a UK clinical reflection assistant.
Generate a GMC-compliant reflective entry.

${modeInstruction}

---
CONTEXT (Use for medical terminology/context):
Question: ${question}
Answer: ${answer}

USER NOTES (Primary Source if in Personalise Mode):
"${userNotes ? userNotes : "(No notes provided)"}"
---

OUTPUT FORMAT:
Respond ONLY with plain text. DO NOT use markdown.
Include 4 short sections:
1. Key learning
2. Application
3. Next steps
4. GMC domains (Briefly link to a domain like 'Knowledge, Skills & Performance')

After the reflection, add a separator '---TAGS---' on a new line, followed by a JSON string array of 5-7 relevant clinical keywords.
`;

    // --- Streaming Call ---
    const result = await streamText({
      model: together(MODEL_SLUG),
      messages: [{ role: "user", content: finalPrompt }],
      // 4. Lower temperature to reduce hallucinations
      temperature: 0.2, 
      maxOutputTokens: 1024,
    });

    return result.toTextStreamResponse();

  } catch (err: unknown) {
    console.error("[Umbil] Reflection API Error:", err);
    const msg = (err as Error).message || "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}