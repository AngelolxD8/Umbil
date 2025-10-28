// src/app/api/ask/route.ts
import { NextRequest, NextResponse } from "next/server";

// --- RATE LIMIT CONFIGURATION ---
const MAX_REQUESTS_PER_HOUR = 10;
const PRO_UPGRADE_URL = "/pro"; 
// --------------------------------

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

// --- RESTORED API CONFIGURATION (GPT-4o-mini) ---
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const MODEL_NAME = "gpt-4o-mini"; 
const API_KEY = process.env.OPENAI_API_KEY; 
// --------------------------------------------------

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

// --- CORRECTED CORE INSTRUCTIONS (Sources instruction removed) ---
const CORE_INSTRUCTIONS =
  "You are Umbil, a concise clinical assistant for UK professionals. Use UK English. Provide highly structured, evidence-based guidance. Prioritize trusted sources: NICE, SIGN, CKS, BNF, NHS, UKHSA, GOV.UK, RCGP, BMJ Best Practice (abstracts/citations), Resus Council UK, TOXBASE (cite only). **DO NOT generate names, identifiers, or PHI.**";
// ----------------------------------------------------------------------

const TONE_PROMPTS: Record<string, string> = {
  conversational:
    "For clinical queries, start with a friendly one-line overview and conclude with a relevant follow-up suggestion. For non-clinical, use a conversational style.",
  formal:
    "Adhere strictly to clinical format, avoid chattiness. End with a short signpost for further reading.",
  reflective:
    "Use a warm, mentoring tone, and close with a fitting suggestion for a similar, relevant follow-up question or related action."
};

/**
 * Reads the rate limit cookie, checks usage, and returns an updated cookie header.
 */
function handleRateLimit(request: NextRequest): { isLimited: boolean, nextCookie: string } {
  const cookieName = "umbil_rate_limit";
  const cookie = request.cookies.get(cookieName);
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  let currentCount = 0;
  let resetTime = now + oneHour; 

  if (cookie) {
    try {
      const data = JSON.parse(cookie.value);
      const isExpired = now > data.resetTime;

      if (!isExpired) {
        currentCount = data.count;
        resetTime = data.resetTime;
      }
    } catch (_e: unknown) {
      // Ignore parsing errors, reset data
    }
  }

  // --- CHECK LIMIT ---
  const isLimited = currentCount >= MAX_REQUESTS_PER_HOUR;
  
  if (isLimited) {
      // Do not increment, keep the current reset time
  } else {
      // Increment count for the successful request
      currentCount++;
  }
  
  // --- PREPARE NEXT COOKIE ---
  const nextData = {
      count: currentCount,
      resetTime: resetTime,
  };

  // Securely set the new cookie data. Expires in 1 hour.
  const nextCookie = `${cookieName}=${JSON.stringify(nextData)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${oneHour / 1000};`;

  return { isLimited, nextCookie };
}


export async function POST(req: NextRequest) {
  // Check against the OPENAI_API_KEY
  if (!API_KEY) {
      return NextResponse.json(
          { error: "Server configuration error: OPENAI_API_KEY is not set." },
          { status: 500 }
      );
  }
  
  // --- 1. RATE LIMIT CHECK ---
  const { isLimited, nextCookie } = handleRateLimit(req);
  
  if (isLimited) {
    const response = NextResponse.json(
        { 
            error: `You've reached the limit of ${MAX_REQUESTS_PER_HOUR} questions per hour on the free tier. Time to upgrade!`,
            pro_url: PRO_UPGRADE_URL
        },
        { status: 402 } // 402 Payment Required status for limit
    );
    response.headers.set("Set-Cookie", nextCookie); 
    return response;
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
        content: msg.role === 'user' ? sanitizeQuery(msg.content) : msg.content
    }));

    const cacheKey = JSON.stringify({ messages: sanitizedMessages, systemPromptContent });
    
    // --- 2. CACHE CHECK ---
    if (cache.has(cacheKey)) {
        console.log(`[UMBL-API] Cache HIT!`);
        const response = NextResponse.json({ answer: cache.get(cacheKey) ?? "" });
        response.headers.set("Set-Cookie", nextCookie); // Set the cookie even on cache hit
        return response;
    }

    // Prepare messages array: System prompt + SANITIZED Conversation History
    const systemMessage = { role: "system", content: systemPromptContent };
    const fullMessages = [systemMessage, ...sanitizedMessages];

    // --- RESTORED FETCH CALL TO OPENAI ---
    const r = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_NAME, // "gpt-4o-mini"
        messages: fullMessages,
        max_tokens: 400, 
      }),
    });

    if (!r.ok) {
      const errorData = await r.json();
      
      if (errorData.error?.code === "rate_limit_exceeded" || r.status === 429) {
         // RESTORING ORIGINAL OPENAI RATE LIMIT ERROR MESSAGE
         const response = NextResponse.json(
             { error: "Umbil’s taking a short pause to catch up with demand. Please check back later — your lifeline will be ready soon." },
             { status: 429 }
         );
         response.headers.set("Set-Cookie", nextCookie);
         return response;
      }
      
      const errorMsg = errorData.error?.message || "Sorry, an unexpected error occurred. Please try again.";
      const response = NextResponse.json({ error: errorMsg }, { status: r.status });
      response.headers.set("Set-Cookie", nextCookie);
      return response;
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

    const response = NextResponse.json({ answer: answer ?? "" });
    response.headers.set("Set-Cookie", nextCookie);
    return response;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}