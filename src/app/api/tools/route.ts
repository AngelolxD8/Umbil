// src/app/api/tools/route.ts
import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { createTogetherAI } from "@ai-sdk/togetherai";
import { tavily } from "@tavily/core";

// --- CONFIG ---
const API_KEY = process.env.TOGETHER_API_KEY!;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY!;
const MODEL_SLUG = "openai/gpt-oss-120b"; // Or "meta-llama/Llama-3-70b-chat-hf" for speed

const together = createTogetherAI({ apiKey: API_KEY });
const tvly = TAVILY_API_KEY ? tavily({ apiKey: TAVILY_API_KEY }) : null;

export const runtime = 'edge';

// --- TYPE DEFINITIONS ---
type ToolId = 'referral' | 'safety_netting' | 'discharge_summary' | 'sbar' | 'translate_reflection';

interface ToolConfig {
  systemPrompt: string;
  useSearch: boolean;
  searchQueryGenerator?: (input: string) => string; // Logic to generate a search query from input
}

// --- PROMPTS & CONFIGURATION ---
const TOOLS: Record<ToolId, ToolConfig> = {
  referral: {
    useSearch: true, // ENABLE SEARCH INJECTION
    searchQueryGenerator: (input) => {
      // Heuristic: If input mentions "2WW" or "Cancer", force a NICE guideline search
      if (input.toLowerCase().includes("2ww") || input.toLowerCase().includes("cancer")) {
        return `NICE NG12 suspected cancer referral criteria UK ${input}`;
      }
      return `NICE CKS referral guidelines UK ${input}`;
    },
    systemPrompt: `
      You are an expert Medical Secretary for a UK General Practitioner.
      Your task is to write a formal hospital referral letter.
      
      RULES:
      1.  Output standard letter format (Dear [Specialty], Re: [Patient details]).
      2.  Do NOT use Markdown formatting (no bold **, no headers #). Keep it plain text.
      3.  If "Context" is provided below, you MUST check if the patient meets the referral criteria.
      4.  If criteria are NOT met based on the input, add a "[NOTE TO GP]" at the top.
      
      Structure:
      - Salutation
      - Patient details (from input)
      - "Thank you for seeing this patient with..."
      - History of Complaint
      - Examination & Vitals
      - PMH / DH (if provided)
      - specific reason for referral (e.g. "Criteria for 2WW met: [Reason]")
      - Sign off: "Kind regards, Dr [Name]"
    `
  },
  safety_netting: {
    useSearch: true,
    searchQueryGenerator: (input) => `NICE CKS safety netting red flags ${input}`,
    systemPrompt: `
      You are a Medico-Legal Assistant for a UK Doctor.
      Create a "Safety Netting" documentation block.
      
      OUTPUT FORMAT (Strictly follow this):
      "Safety netting advice given: [General advice, e.g. fluid intake].
      Return immediately if: [List specific RED FLAGS based on the condition].
      discussed [Relevant Guideline, e.g. NICE Traffic Light system/Sepsis risks]."

      Tone: Professional, concise, ready to paste into EMIS/SystmOne.
      Ensure the Red Flags are accurate to the specific condition described.
    `
  },
  sbar: {
    useSearch: false,
    systemPrompt: `
      Convert the user's notes into a structured SBAR (Situation, Background, Assessment, Recommendation) handover.
      For urgent calls to hospital registrars.
      - Situation: Who/Where/Acute concern.
      - Background: Relevant history.
      - Assessment: Vitals/Exam.
      - Recommendation: Specific request (e.g. "Review immediately").
    `
  },
  discharge_summary: {
    useSearch: false,
    systemPrompt: `
      Condense these ward notes into a concise GP Discharge Summary.
      Sections: Primary Diagnosis, Procedures, Med Changes, Follow-up Required.
      Ignore "patient stable" filler.
    `
  },
  translate_reflection: {
    useSearch: false,
    systemPrompt: `
      Translate this clinical reflection into formal UK English suitable for a GMC appraisal portfolio.
      Maintain reflective tone. Output ONLY the translation.
    `
  }
};

// --- HELPER: CONTEXT SEARCH ---
async function getContext(query: string): Promise<string> {
  if (!tvly) return "";
  try {
    const result = await tvly.search(query, {
      searchDepth: "basic", // Basic is faster for tools
      maxResults: 2,
      includeDomains: ["nice.org.uk", "cks.nice.org.uk", "patient.info"]
    });
    const snippets = result.results.map(r => `Source: ${r.url}\nExcerpt: ${r.content}`).join("\n\n");
    return `\n\n--- CLINICAL GUIDELINES CONTEXT ---\n${snippets}\n-----------------------------------\n`;
  } catch (e) {
    console.error("Tool search failed", e);
    return "";
  }
}

// --- MAIN ROUTE HANDLER ---
export async function POST(req: NextRequest) {
  if (!API_KEY) return NextResponse.json({ error: "API Key missing" }, { status: 500 });

  try {
    // 1. Parse Input
    // We now expect 'fields' object for structured inputs, or raw 'input' string
    const { toolType, input, fields } = await req.json();
    
    // Combine fields into a single string if 'fields' is provided (for Phase 2 UI)
    let processedInput = input;
    if (fields) {
      processedInput = Object.entries(fields)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n");
    }

    const toolConfig = TOOLS[toolType as ToolId];
    if (!processedInput || !toolConfig) {
      return NextResponse.json({ error: "Invalid input or tool type" }, { status: 400 });
    }

    // 2. Context Injection (The "Brain" Upgrade)
    let context = "";
    if (toolConfig.useSearch && toolConfig.searchQueryGenerator) {
      const searchQuery = toolConfig.searchQueryGenerator(processedInput);
      // Silently fetch context
      context = await getContext(searchQuery);
    }

    // 3. Construct Final Prompt
    const finalPrompt = `
${toolConfig.systemPrompt}

${context ? `Use the following guidelines to ensure safety/accuracy:\n${context}` : ""}

USER INPUT DATA:
${processedInput}

OUTPUT:
`;

    // 4. Stream Response
    const result = await streamText({
      model: together(MODEL_SLUG),
      messages: [{ role: "user", content: finalPrompt }],
      temperature: 0.2, // Low temp for tools (precision over creativity)
      maxOutputTokens: 1024,
    });

    return result.toTextStreamResponse();

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Error";
    console.error("Tool API Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}