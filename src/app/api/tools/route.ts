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
type ToolId = 'referral' | 'safety_netting' | 'discharge_summary' | 'sbar';

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
      You are an expert Medical Secretary. Write a formal, concise hospital referral letter based on the user's notes.
      
      RULES:
      1. Output standard letter format (Dear [Specialty], Re: [Patient details]).
      2. No Markdown (* or #). Plain text only.
      3. Verify criteria against Context if provided.
      4. STRICT LIMIT: Maximum 200 words. Be direct.
      
      Structure:
      - Salutation
      - Patient details (Age/Sex from input)
      - "Thank you for seeing..."
      - HxC (Concise history)
      - Exam/Vitals
      - PMH/DH
      - Reason for referral
      - "Kind regards, Dr [Name]"
    `
  },
  safety_netting: {
    useSearch: true,
    searchQueryGenerator: (input) => `NICE CKS safety netting red flags ${input}`,
    systemPrompt: `
      You are a Clinical Documentation Assistant.
      Create an extremely concise "Safety Netting" entry for medical notes.
      
      RULES:
      1. STRICT LIMIT: Maximum 60 words.
      2. Use telegraphic style (omit "The patient should...").
      3. Focus entirely on specific Red Flags.
      4. Context Awareness: If the patient already has a symptom for X days, ensure the "return if" duration makes sense (e.g. "Fever > 5 days" rather than "Fever > 48h" if they are already at day 2).
      5. Functional Symptoms: Prefer "blue lips/breathless at rest" over "O2 < 90%" unless the patient likely has equipment.
      
      OUTPUT FORMAT:
      "Advice: [Fluids/Analgesia/Rest].
      Return immediately if: [Comma separated list of specific RED FLAGS].
      discussed [Guideline Name, e.g. Sepsis/Traffic Light]."
    `
  },
  sbar: {
    useSearch: false,
    systemPrompt: `
      Convert the user's notes into a high-priority SBAR handover for a Registrar.
      
      RULES:
      1. STRICT LIMIT: Maximum 100 words.
      2. Use bullet points.
      3. Be urgent and direct.
      
      Structure:
      - S: (Who/Where/Main Issue)
      - B: (Relevant Hx only)
      - A: (Vitals/Exam findings)
      - R: (Specific action required now)
    `
  },
  discharge_summary: {
    useSearch: false,
    systemPrompt: `
      Condense these ward notes into a structured Discharge Summary.
      
      RULES:
      1. STRICT LIMIT: Maximum 200 words.
      2. IGNORE daily "patient stable" updates.
      3. Use a telegraphic, skimmable style.
      4. DO NOT assume this is for a GP; make it generic for any follow-up clinician.
      
      OUTPUT TEMPLATE:
      **DX:** [Primary Diagnosis]
      **KEY EVENTS:** [Procedures/scans/complications only. No daily narrative.]
      **MED CHANGES:** [Started/Stopped/Changed only]
      **PLAN:** [Follow up instructions & Outstanding investigations]
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
    
    const toolConfig = TOOLS[toolType as ToolId];
    
    if (!input || !toolConfig) {
      return NextResponse.json({ error: "Invalid input or tool type" }, { status: 400 });
    }

    // Context Injection
    let context = "";
    if (toolConfig.useSearch && toolConfig.searchQueryGenerator) {
      const searchQuery = toolConfig.searchQueryGenerator(input);
      context = await getContext(searchQuery);
    }

    const finalPrompt = `
${toolConfig.systemPrompt}

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