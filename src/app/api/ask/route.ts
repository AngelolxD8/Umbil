// src/app/api/ask/route.ts
import { NextRequest, NextResponse } from "next/server";

// Define a more specific type for the API response to improve type safety
type OpenAIResponse = {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  // Added usage type for token logging
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

// Define a type for a message received from the client
type ClientMessage = {
  role: "user" | "assistant";
  content: string;
};

// --- CORRECTED API CONFIGURATION (Together AI Sync Chat Completions) ---
// Model: GPT-OSS 120B
const TOGETHER_API_BASE_URL = "https://api.together.xyz/v1";
const CHAT_API_URL = `${TOGETHER_API_BASE_URL}/chat/completions`;
const API_KEY = process.env.TOGETHER_API_KEY; // Using TOGETHER_API_KEY from environment
const MODEL_SLUG = "openai/gpt-oss-120b"; 
// ----------------------------------------------------------------------

// Conceptual In-Memory Cache (Non-persistent across lambda cold starts, but catches immediate repeats)
const cache = new Map<string, string>();

/**
 * Strips common patient identifiers (PHI) from a query string.
 * This is a preventative measure to reduce risk from accidental PHI entry.
 */
function sanitizeQuery(query: string): string {
    let sanitized = query;
    sanitized = sanitized.replace(/\b(john|jane|smith|doctore|nurse|patient\s+x|mr\.|ms\.|mrs\.)\s+\w+/gi, 'patient');
    sanitized = sanitized.replace(/\b(john|jane|smith|david|sarah|patient\s+x|mr\.|ms\.|mrs\.)\b/gi, 'patient');
    sanitized = sanitized.replace(/\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/g, 'a specific date');
    sanitized = sanitized.replace(/\b\d{6,10}\b/g, 'a long identifier number');
    sanitized = sanitized.replace(/\b(\d{1,3})\s+year\s+old\s+(male|female|woman|man|patient)\b/gi, '$1-year-old patient');
    return sanitized;
}

// --- CORE INSTRUCTIONS MODIFIED: Explicitly forbid tables for neatness ---
const CORE_INSTRUCTIONS =
  "You are Umbil, a concise clinical assistant for UK professionals. Use UK English. Provide highly structured, evidence-based guidance. Prioritize trusted sources: NICE, SIGN, CKS, BNF, NHS, UKHSA, GOV.UK, RCGP, BMJ Best Practice (abstracts/citations), Resus Council UK, TOXBASE (cite only). **DO NOT generate names, identifiers, or PHI. IMPORTANT: Do not use Markdown tables; use lists and plain text only.**";
// ----------------------------------------------------------------------

const TONE_PROMPTS: Record<string, string> = {
  // MODIFIED: Request a single, direct suggestive prompt separated by a horizontal rule (---)
  conversational:
    "For clinical queries, use a friendly tone, ensure clear formatting (no tables), and always conclude with a simple, direct follow-up suggestion separated by a Markdown horizontal rule (---) and phrased as a question starting with 'Would you like to...?'",
  formal:
    "Adhere strictly to clinical format, avoid chattiness. End with a short signpost for further reading.",
  reflective:
    "Use a warm, mentoring tone, and close with a fitting suggestion for a similar, relevant follow-up question or related action."
};

export async function POST(req: NextRequest) {
  // Check against the TOGETHER_API_KEY
  if (!API_KEY) {
      return NextResponse.json(
          { error: "Server configuration error: TOGETHER_API_KEY is not set." },
          { status: 500 }
      );
  }
  
  try {
    const body: { messages?: ClientMessage[]; profile?: { full_name?: string | null; grade?: string | null }; tone?: unknown } = await req.json();
    const { messages, profile, tone: toneRaw } = body;

    const tone =
      typeof toneRaw === "string" &&
      ["conversational", "formal", "reflective"].includes(toneRaw)
        ? toneRaw
        : "conversational";

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Missing 'messages' array" },
        { status: 400 }
      );
    }
    
    const baseToneInstruction = TONE_PROMPTS[tone] ?? TONE_PROMPTS.conversational;
    const gradeContext = profile?.grade ? ` The user's grade is ${profile.grade}.` : '';
    const systemPromptContent = `${CORE_INSTRUCTIONS}${gradeContext} ${baseToneInstruction}`;

    const sanitizedMessages: ClientMessage[] = messages.map(msg => ({
        ...msg,
        // Only sanitize user messages
        content: msg.role === 'user' ? sanitizeQuery(msg.content) : msg.content
    }));

    // Generate a unique key based on the sanitized request and the model being used
    const cacheKey = JSON.stringify({ messages: sanitizedMessages, systemPromptContent, model: MODEL_SLUG });
    
    // --- 2. CACHE CHECK ---
    if (cache.has(cacheKey)) {
        console.log(`[UMBL-API] Cache HIT!`);
        return NextResponse.json({ answer: cache.get(cacheKey) ?? "" });
    }

    // Prepare messages array: System prompt + SANITIZED Conversation History
    const systemMessage = { role: "system", content: systemPromptContent };
    // The client sends the full history, so we combine the system prompt with all history messages
    const fullMessages = [systemMessage, ...sanitizedMessages];

    // --- UPDATED FETCH CALL TO TOGETHER AI SYNC CHAT COMPLETIONS ---
    const r = await fetch(CHAT_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_SLUG, // openai/gpt-oss-120b
        messages: fullMessages,
        max_tokens: 400, 
      }),
    });

    if (!r.ok) {
      const errorData = await r.json();
      
      const errorMsg = errorData.error?.message || "Sorry, an unexpected error occurred. Please try again.";
      return NextResponse.json({ error: errorMsg }, { status: r.status });
    }

    const data: OpenAIResponse = await r.json();
    const answer = data.choices?.[0]?.message?.content;
    
    // START: Token Logging Implementation
    if (data.usage) {
        console.log(`[UMBL-API] Tokens Used: Total: ${data.usage.total_tokens}, Prompt: ${data.usage.prompt_tokens}, Completion: ${data.usage.completion_tokens}`);
    } else {
        console.log(`[UMBL-API] Tokens Used: Usage information not available in response.`);
    }
    // END: Token Logging Implementation

    // 3. Set Cache using the SANITIZED key
    if (answer) {
        cache.set(cacheKey, answer);
    }

    return NextResponse.json({ answer: answer ?? "" });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}