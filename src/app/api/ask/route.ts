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

// Conceptual In-Memory Cache (Non-persistent across lambda cold starts, but catches immediate repeats)
const cache = new Map<string, string>();

/**
 * Strips common patient identifiers (PHI) from a query string.
 * This is a preventative measure to reduce risk from accidental PHI entry.
 */
function sanitizeQuery(query: string): string {
    // Regex for:
    // 1. Common names (Dr. Smith, John, Jane, Patient X) -> replaced with 'patient'
    // 2. Specific dates (DD/MM/YY, DD-MM-YYYY) -> replaced with 'a specific date'
    // 3. Numbers that look like MRNs/DOBs (6-10 digit numbers) -> replaced with 'a number'
    let sanitized = query;

    // 1. Remove names (simple heuristic - avoid overly aggressive stripping)
    // Replaces 'Mr. Smith', 'John Smith', or just 'Smith' if surrounded by spaces/punctuation
    sanitized = sanitized.replace(/\b(john|jane|smith|doctore|nurse|patient\s+x|mr\.|ms\.|mrs\.)\s+\w+/gi, 'patient');
    sanitized = sanitized.replace(/\b(john|jane|smith|david|sarah|patient\s+x|mr\.|ms\.|mrs\.)\b/gi, 'patient');


    // 2. Remove specific dates (DD/MM/YYYY or DD-MM-YYYY)
    sanitized = sanitized.replace(/\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/g, 'a specific date');

    // 3. Remove long number sequences (potential MRN/NHS number)
    sanitized = sanitized.replace(/\b\d{6,10}\b/g, 'a long identifier number');
    
    // 4. Update the patient's age and gender to a generic format if found
    sanitized = sanitized.replace(/\b(\d{1,3})\s+year\s+old\s+(male|female|woman|man|patient)\b/gi, '$1-year-old patient');

    return sanitized;
}

// Updated TONE_PROMPTS for Tighter Prompt (Added "highly concise")
const TONE_PROMPTS: Record<string, string> = {
  conversational:
    "You are Umbil — a friendly, concise clinical assistant for UK doctors. Use UK English spelling and phrasing. For all clinical questions, provide highly concise, structured, and evidence-focused guidance. Reference trusted sources such as NICE, SIGN, CKS and BNF concisely where relevant. **DO NOT generate names or identifiers in your response.** For non-clinical queries, use a conversational style. Start with a very short, conversational one-line overview. Follow with structured, evidence-based guidance (bullets or short paragraphs). Conclude with a clear, relevant follow-up suggestion.",
  formal:
    "You are Umbil — a formal and precise clinical summariser for UK doctors. Use UK English spelling and phrasing. For all clinical questions, provide highly concise, structured, and evidence-focused guidance. Reference trusted sources such as NICE, SIGN, CKS and BNF concisely where relevant. **DO NOT generate names or identifiers in your response.** Avoid chattiness. End with a short signpost for further reading. For non-clinical questions, provide direct and factual answers.",
  reflective:
    "You are Umbil — a supportive clinical coach for UK doctors. Use UK English spelling and phrasing. For clinical questions, provide highly concise, evidence-based guidance based on trusted UK sources like NICE, SIGN, CKS and BNF, and close with a fitting suggestion for a similar, relevant follow-up question or related action. **DO NOT generate names or identifiers in your response.** Use a warm, mentoring tone. For non-clinical queries, you may respond in a broader, more conversational style."
};

export async function POST(req: NextRequest) {
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
    
    let basePrompt = TONE_PROMPTS[tone] ?? TONE_PROMPTS.conversational;

    // START: PRIVACY ENHANCEMENT / ANONYMIZATION
    let systemPromptContent = basePrompt;
    if (profile?.grade) {
      const grade = profile.grade || "a doctor";
      // Ensure the system message is updated with the new safety directive.
      systemPromptContent = `You are Umbil, a clinical assistant providing guidance to a user who is a ${grade}. ${basePrompt}`;
    }

    // 1. SANITIZE ALL INCOMING MESSAGES FOR PHI
    const sanitizedMessages: ClientMessage[] = messages.map(msg => ({
        ...msg,
        content: msg.role === 'user' ? sanitizeQuery(msg.content) : msg.content
    }));

    // 2. Construct Cache Key from the SANITIZED request
    const cacheKey = JSON.stringify({ messages: sanitizedMessages, systemPromptContent });
    
    // END: PRIVACY ENHANCEMENT / ANONYMIZATION

    // 3. Check Cache
    if (cache.has(cacheKey)) {
        console.log(`[UMBL-API] Cache HIT!`);
        console.log(`[UMBL-API] Tokens Used: Total: 0, (Cache Hit)`);
        return NextResponse.json({ answer: cache.get(cacheKey) ?? "" });
    }

    // Prepare messages array: System prompt + SANITIZED Conversation History
    const systemMessage = { role: "system", content: systemPromptContent };
    const fullMessages = [systemMessage, ...sanitizedMessages];

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: fullMessages,
        max_tokens: 800,
      }),
    });

    if (!r.ok) {
      const errorData = await r.json();
      
      if (errorData.error?.code === "rate_limit_exceeded" || r.status === 429) {
         return NextResponse.json(
             { error: "Umbil’s taking a short pause to catch up with demand. Please check back later — your lifeline will be ready soon." },
             { status: 429 }
         );
      }
      
      return NextResponse.json({ error: errorData.error?.message || "Sorry, an unexpected error occurred. Please try again." }, { status: r.status });
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