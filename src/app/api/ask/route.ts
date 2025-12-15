// src/app/api/tools/route.ts
import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { createTogetherAI } from "@ai-sdk/togetherai";
import { tavily } from "@tavily/core";

// --- CONFIG ---
const API_KEY = process.env.TOGETHER_API_KEY!;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY!;
const MODEL_SLUG = "openai/gpt-oss-120b"; 

const together = createTogetherAI({ apiKey: API_KEY });
const tvly = TAVILY_API_KEY ? tavily({ apiKey: TAVILY_API_KEY }) : null;

// --- TYPE DEFINITIONS ---
// Added 'patient_friendly' to the list
type ToolId = 'referral' | 'safety_netting' | 'discharge_summary' | 'sbar' | 'translate_reflection' | 'patient_friendly';

interface ToolConfig {
  systemPrompt: string;
  useSearch: boolean;
  searchQueryGenerator?: (input: string) => string;
}

// --- PROMPTS & CONFIGURATION ---
const TOOLS: Record<ToolId, ToolConfig> = {
  referral: {
    useSearch: true, 
    searchQueryGenerator: (input) => {
      if (input.toLowerCase().includes("2ww") || input.toLowerCase().includes("cancer")) {
        return `NICE NG12 suspected cancer referral criteria UK ${input}`;
      }
      return `NICE CKS referral guidelines UK ${input}`;
    },
    systemPrompt: `
      You are an expert Medical Secretary for a UK General Practitioner.
      Your task is to write a formal hospital referral letter based on the user's rough notes.
      
      CRITICAL RULES:
      1.  **GENERIC PLACEHOLDERS ONLY**: If the doctor's name or patient's name is not explicitly provided in the input, YOU MUST USE PLACEHOLDERS like "[Patient Name]" or "[Dr Name]". DO NOT invent names like "Dr James Smith".
      2.  **PHI REMOVAL**: Remove any potential patient identifiers that accidentally slipped in and replace with "[Redacted]".
      3.  Output standard letter format (Dear [Specialty], Re: [Patient details]).
      4.  No Markdown formatting in the letter body (no bold **, no headers #). Keep it plain text.
      5.  Check referral criteria against Context if provided.
      
      Structure:
      - Salutation (Dear [Specialty Team])
      - Patient details (Extract Age/Sex only. Use [Patient Name] if name missing.)
      - "Thank you for seeing..."
      - HxC (Concise history)
      - Examination & Vitals
      - PMH / DH
      - Specific reason for referral
      - Sign off: "Kind regards, [Dr Name]"
    `
  },
  safety_netting: {
    useSearch: true,
    searchQueryGenerator: (input) => `NICE CKS safety netting red flags ${input}`,
    systemPrompt: `
      You are a Clinical Documentation Assistant.
      Create an extremely concise "Safety Netting" documentation block.
      
      RULES:
      1. STRICT LIMIT: Maximum 60 words.
      2. Use telegraphic style.
      3. Focus entirely on specific Red Flags.
      4. If dates/names are missing, use generic terms.
      
      OUTPUT FORMAT:
      "Advice: [General advice].
      Return immediately if: [Specific RED FLAGS].
      Discussed [Guideline Name]."
    `
  },
  sbar: {
    useSearch: false,
    systemPrompt: `
      Convert the user's notes into a high-priority SBAR handover.
      
      RULES:
      1. STRICT LIMIT: Maximum 100 words.
      2. Use bullet points.
      3. Be urgent and direct.
      4. Use placeholders like [Patient] or [Location] if not provided.
      
      Structure:
      - S: (Situation)
      - B: (Background)
      - A: (Assessment)
      - R: (Recommendation)
    `
  },
  discharge_summary: {
    useSearch: false,
    systemPrompt: `
      Condense ward notes into a structured Discharge Summary.
      
      RULES:
      1. STRICT LIMIT: Maximum 200 words.
      2. IGNORE daily "patient stable" updates.
      3. Use placeholders for names/dates if not provided.
      
      OUTPUT TEMPLATE:
      **DX:** [Diagnosis]
      **KEY EVENTS:** [Procedures/scans only]
      **MED CHANGES:** [Started/Stopped]
      **PLAN:** [Follow up instructions]
    `
  },
  translate_reflection: {
    useSearch: false,
    systemPrompt: `
      You are a professional medical translator. 
      Translate the following reflection into professional UK English suitable for a medical appraisal/portfolio.
      Keep the tone formal and reflective.
      Do not add commentary, just output the translation.
    `
  },
  // --- NEW TOOL ADDED HERE ---
  patient_friendly: {
    useSearch: false,
    systemPrompt: `
      You are a compassionate medical communicator.
      Your task is to rewrite complex medical text (like a discharge summary or doctor's note) into "Patient Friendly" language.

      RULES:
      1. Reading Level: 5th Grade (Simple, clear English).
      2. Tone: Warm, reassuring, and clear.
      3. Terminology: Replace ALL medical jargon with plain English explanations (e.g., change "Ambulate" to "Walk", "Hypertension" to "High Blood Pressure").
      4. Structure: Use simple bullet points for instructions.
      5. Accuracy: Do NOT change the medical facts or advice, only the language.

      OUTPUT STRUCTURE:
      - **Summary:** (What happened in simple words)
      - **What Next:** (Clear instructions on what to do)
      - **When to seek help:** (Red flags in simple language)
    `
  }
};

// --- HELPER: CONTEXT SEARCH ---
async function getContext(query: string): Promise<string> {
  if (!tvly) return "";
  try {
    const result = await tvly.search(query, {
      searchDepth: "basic", 
      maxResults: 2,
      includeDomains: ["nice.org.uk", "cks.nice.org.uk", "patient.info"]
    });
    const snippets = result.results.map(r => `Source: ${r.url}\nExcerpt: ${r.content}`).join("\n\n");
    return `\n\n--- CLINICAL GUIDELINES CONTEXT ---\n${snippets}\n-----------------------------------\n`;
  } catch (error) {
    console.error("Tool search failed", error);
    return "";
  }
}

// --- MAIN ROUTE HANDLER ---
export async function POST(req: NextRequest) {
  if (!API_KEY) return NextResponse.json({ error: "API Key missing" }, { status: 500 });

  try {
    const { toolType, input } = await req.json();
    
    // Explicit cast to satisfy TypeScript indexing
    const config = TOOLS[toolType as ToolId];
    
    if (!input || !config) {
      return NextResponse.json({ error: "Invalid input or tool type" }, { status: 400 });
    }

    // Context Injection
    let context = "";
    if (config.useSearch && config.searchQueryGenerator) {
      const searchQuery = config.searchQueryGenerator(input);
      context = await getContext(searchQuery);
    }

    const finalPrompt = `
${config.systemPrompt}

${context ? `Use the following guidelines to ensure safety/accuracy:\n${context}` : ""}

USER INPUT NOTES:
${input}

OUTPUT:
`;

    const result = await streamText({
      model: together(MODEL_SLUG),
      messages: [{ role: "user", content: finalPrompt }],
      temperature: 0.2, 
      maxOutputTokens: 1024, 
    });

    return result.toTextStreamResponse();

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Error";
    console.error("Tool API Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}