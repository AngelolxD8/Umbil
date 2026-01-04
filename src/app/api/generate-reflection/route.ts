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
    const body = await req.json();
    const { mode, userNotes } = body;

    // --- 1. DEFINE PROMPTS BASED ON MODE ---
    let systemInstruction = "";
    let contextContent = "";

    if (mode === 'psq_analysis') {
        // NEW MODE: PSQ ANALYSIS
        const { stats, strengths, weaknesses, comments } = body;
        
        systemInstruction = `
        You are an expert Medical Appraiser for the NHS.
        Your task is to draft a "Reflective Note" for a doctor's annual appraisal based on their Patient Satisfaction Questionnaire (PSQ) results.
        
        GUIDELINES:
        1. Tone: Professional, first-person ("I felt...", "The data shows...").
        2. Structure:
           - Summary of Feedback (Mention the score and volume).
           - Analysis of Strengths (What are patients happy with?).
           - Area for Development (Address the lowest scoring area diplomatically).
           - Action Plan (Propose 1-2 concrete steps to improve).
        3. Be concise (approx 150-200 words).
        4. Do NOT use markdown headers (like ##), just plain paragraphs.
        `;

        contextContent = `
        DATA TO ANALYZE:
        - Total Responses: ${stats.totalResponses}
        - Average Score: ${stats.averageScore}/5.0
        - Top Strength: ${strengths}
        - Area to Improve: ${weaknesses}
        - Recent Patient Comments: ${JSON.stringify(comments)}
        
        USER'S ROUGH NOTES (If any): "${userNotes || ''}"
        `;

    } else if (mode === 'personalise') {
      // MODE: PERSONALISE (TIDY UP ONLY)
      systemInstruction = `
      You are an expert Medical Editor. 
      The user has written rough clinical notes below.
      YOUR TASK:
      1. Tidy up the grammar, spelling, and flow.
      2. Make it sound professional and concise.
      3. KEEP IT EXACT: Do NOT add new facts. Just polish.
      `;
      contextContent = `TARGET TEXT: "${userNotes}"`;

    } else {
      // MODE: AUTO-GENERATE (STANDARD Q&A)
      const { question, answer } = body;
      systemInstruction = `
      You are Umbil, a UK clinical reflection assistant.
      Write a generic educational reflection based on the Q&A below.
      Focus on clinical theory, not specific patients.
      `;
      contextContent = `Question: ${question}\nAnswer: ${answer}\nNotes: ${userNotes || ''}`;
    }

    // --- 2. STREAMING CALL ---
    const finalPrompt = `
    ${systemInstruction}
    
    ---
    ${contextContent}
    ---
    
    RESPOND ONLY WITH THE DRAFTED TEXT.
    `;

    const result = await streamText({
      model: together(MODEL_SLUG),
      messages: [{ role: "user", content: finalPrompt }],
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