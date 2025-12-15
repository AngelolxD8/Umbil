// src/app/api/tools/route.ts
import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { createTogetherAI } from "@ai-sdk/togetherai";
import { tavily } from "@tavily/core";
import { SYSTEM_PROMPTS } from "@/lib/prompts";

// --- CONFIG ---
const API_KEY = process.env.TOGETHER_API_KEY!;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY!;
const MODEL_SLUG = "openai/gpt-oss-120b"; 

const together = createTogetherAI({ apiKey: API_KEY });
const tvly = TAVILY_API_KEY ? tavily({ apiKey: TAVILY_API_KEY }) : null;

// --- TYPE DEFINITIONS ---
type ToolId = 'referral' | 'safety_netting' | 'discharge_summary' | 'sbar' | 'patient_friendly';

interface ToolConfig {
  systemPrompt: string;
  useSearch: boolean;
  searchQueryGenerator?: (input: string) => string;
}

// --- PROMPTS & CONFIGURATION ---
const TOOLS: Record<ToolId, ToolConfig> = {
  referral: {
    useSearch: true, 
    searchQueryGenerator: (input) => `NICE CKS referral guidelines UK ${input}`,
    systemPrompt: SYSTEM_PROMPTS.TOOLS.REFERRAL
  },
  safety_netting: {
    useSearch: true,
    searchQueryGenerator: (input) => `NICE CKS safety netting red flags ${input}`,
    systemPrompt: SYSTEM_PROMPTS.TOOLS.SAFETY_NETTING
  },
  sbar: {
    useSearch: false,
    systemPrompt: SYSTEM_PROMPTS.TOOLS.SBAR
  },
  discharge_summary: {
    useSearch: false,
    systemPrompt: SYSTEM_PROMPTS.TOOLS.DISCHARGE
  },
  patient_friendly: {
    useSearch: false,
    // No search needed for translation
    systemPrompt: SYSTEM_PROMPTS.TOOLS.PATIENT_FRIENDLY 
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
    
    // Explicit cast to ToolId
    const config = TOOLS[toolType as ToolId];
    
    if (!input || !config) {
      return NextResponse.json({ error: `Invalid input or tool type: ${toolType}` }, { status: 400 });
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