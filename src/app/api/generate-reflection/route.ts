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
    const { mode, userNotes, context } = body;

    // --- 1. DEFINE PROMPTS BASED ON MODE ---
    let systemInstruction = "";
    let contextContent = "";

    if (mode === 'psq_analysis') {
        // MODE: PSQ ANALYSIS
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
        4. STRICTLY PLAIN TEXT ONLY. Do NOT use markdown headers (##), bold (**), or italics (*). Use standard paragraph spacing only.
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
      // MODE: FIX GRAMMAR & FLOW
      systemInstruction = `
      You are an expert Medical Editor. 
      The user has written rough clinical notes below.
      YOUR TASK:
      1. Tidy up the grammar, spelling, and flow.
      2. Make it sound professional and concise.
      3. KEEP IT EXACT: Do NOT add new facts. Just polish.
      4. STRICTLY PLAIN TEXT ONLY. Remove all markdown formatting. No bold (**), no headers (##).
      `;
      contextContent = `TARGET TEXT: "${userNotes}"`;

    } else if (mode === 'structured_reflection') {
      // MODE: AUTO-GENERATE STRUCTURED REFLECTION
      systemInstruction = `
      You are an expert Medical Educator (UK).
      Rewrite the user's rough notes into a structured clinical reflection using the "What, So What, Now What" framework, but with specific headers.
      
      STRUCTURE REQUIRED:
      LEARNING
      (Summarize what was learned or discussed. Be specific.)
      
      APPLICATION
      (How does this apply to your daily clinical practice?)
      
      NEXT STEPS
      (Actionable items, e.g. read specific guidelines, change prescribing habits.)
      
      RULES:
      1. Keep it concise, professional, and suitable for a portfolio.
      2. STRICTLY PLAIN TEXT ONLY. No markdown headers (##) or bold (**).
      3. Use the capitalized headers provided above.
      4. Do NOT invent facts. Use the provided notes and context.
      `;
      contextContent = `USER NOTES: "${userNotes}" \n CONTEXT: "${JSON.stringify(context || {})}"`;

    } else if (mode === 'generate_tags') {
      // MODE: GENERATE TAGS
      systemInstruction = `
      You are a medical taxonomy expert.
      Analyze the provided clinical notes and extract 3-5 short, relevant, specific medical tags (e.g., Cardiology, Hypertension, Paediatrics, Guidelines, Safeguarding).
      
      RULES:
      1. Return ONLY a comma-separated list of tags.
      2. No numbering, no bullet points, no extra text.
      3. Do not include "General Practice" or "CPD". Be specific.
      4. Example output: "Cardiology, Heart Failure, NICE Guidelines"
      `;
      contextContent = `NOTES: "${userNotes}" \n CONTEXT: "${JSON.stringify(context || {})}"`;

    } else {
      // MODE: AUTO-GENERATE (STANDARD Q&A)
      const { question, answer } = body;
      systemInstruction = `
      You are Umbil, a UK clinical reflection assistant.
      Write a generic educational reflection based on the Q&A below.
      Focus on clinical theory, not specific patients.
      STRICTLY PLAIN TEXT ONLY. Do not use markdown headers (##) or bold (**).
      `;
      contextContent = `Question: ${question}\nAnswer: ${answer}\nNotes: ${userNotes || ''}`;
    }

    // --- 2. STREAMING CALL ---
    const finalPrompt = `
    ${systemInstruction}
    
    ---
    ${contextContent}
    ---
    
    RESPOND ONLY WITH THE REQUESTED TEXT.
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