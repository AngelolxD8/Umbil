// src/app/api/tools/route.ts
import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { createTogetherAI } from "@ai-sdk/togetherai";

// Use the same efficient model config
const API_KEY = process.env.TOGETHER_API_KEY!;
const MODEL_SLUG = "openai/gpt-oss-120b"; 

const together = createTogetherAI({
  apiKey: API_KEY,
});

export const runtime = 'edge';

// Prompts for each specific tool
const PROMPTS: Record<string, string> = {
  referral: `
    You are an expert UK General Practitioner. Write a concise, professional hospital referral letter based on the user's shorthand notes.
    Structure:
    - Salutation (e.g. Dear [Specialty],)
    - "Thank you for reviewing this [age]-year-old [gender]..."
    - History & Symptoms
    - Examination Findings/Bloods
    - Actions taken so far
    - Specific Request (e.g. "Please assess urgently for...")
    - Sign off: "Kind regards, GP"
    Keep it strictly professional. No fluff.
  `,
  safety_netting: `
    You are a UK GP. Create a specific, concise "Safety Netting" block for medical notes based on the clinical presentation.
    Format: "Advised to return if: [List specific red flags]. [Mention specific guideline system if relevant, e.g. NICE Traffic Light]."
    Keep it punchy and ready to paste into EMIS/SystmOne.
  `,
  discharge_summary: `
    You are a medical assistant. Condense this long list of hospital ward notes into a concise "GP Summary".
    Required Sections:
    1. Primary Diagnosis
    2. Key Procedures/Events
    3. Medication Changes (Start/Stop/Change)
    4. Follow-up Required (What does the GP actually need to do?)
    Ignore daily "patient stable" updates. Focus on the plan.
  `,
  sbar: `
    Convert the user's shorthand notes into a structured SBAR (Situation, Background, Assessment, Recommendation) handover.
    This is for an urgent call to a hospital registrar.
    - Situation: Who is the patient, where are they, what is the acute concern?
    - Background: Relevant history, admission reason.
    - Assessment: Current Vitals (BP, HR, Sats), exam findings, clinical impression.
    - Recommendation: What do you want? (e.g. "I need you to see them now" or "Advice on management").
  `,
  translate_reflection: `
    You are a medical translator. The user has written a clinical reflection in their native language.
    Translate this into formal, professional UK English suitable for a GMC appraisal portfolio.
    Maintain the exact meaning but ensure the tone is reflective and professional.
    Output ONLY the English translation.
  `
};

export async function POST(req: NextRequest) {
  if (!API_KEY) return NextResponse.json({ error: "API Key missing" }, { status: 500 });

  try {
    const { toolType, input } = await req.json();

    if (!input || !PROMPTS[toolType]) {
      return NextResponse.json({ error: "Invalid input or tool type" }, { status: 400 });
    }

    const systemPrompt = PROMPTS[toolType];
    const finalPrompt = `${systemPrompt}\n\nUSER INPUT:\n${input}\n\nOUTPUT:`;

    const result = await streamText({
      model: together(MODEL_SLUG),
      messages: [{ role: "user", content: finalPrompt }],
      temperature: 0.3, // Lower temperature for more structured output
      maxOutputTokens: 1024,
    });

    return result.toTextStreamResponse();

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}