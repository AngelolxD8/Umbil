// src/app/api/ask/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createHash } from 'crypto'; 

// ---------- Types ----------
type OpenAIResponse = {
  choices: Array<{ message: { content: string } }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

type ClientMessage = { role: "user" | "assistant"; content: string };

// ---------- Config ----------
const TOGETHER_API_BASE_URL = "https://api.together.xyz/v1";
const CHAT_API_URL = `${TOGETHER_API_BASE_URL}/chat/completions`;
const MODEL_SLUG = "openai/gpt-oss-120b";
const API_KEY = process.env.TOGETHER_API_KEY;
const CACHE_TABLE = "api_cache";

// ---------- Helpers ----------

/**
 * Generates a stable SHA-256 hash for a given string, used as a primary key for caching.
 * @param str The string to hash (the full query key).
 * @returns A SHA-256 hash string.
 */
function sha256(str: string): string {
  // CRITICAL FIX: The 'crypto' module is available in the Next.js Node.js runtime 
  // on Vercel API routes, but *not* the Edge runtime (which API routes don't use).
  // If you encounter an error here, check Vercel settings to ensure the route 
  // is *not* running as an Edge Function.
  return createHash('sha256').update(str).digest('hex');
}

function sanitizeQuery(q: string) {
  return q
    .replace(/\b(john|jane|smith|mr\.|ms\.|mrs\.)\s+\w+/gi, "patient")
    .replace(/\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/g, "a specific date")
    .replace(/\b\d{6,10}\b/g, "a long identifier number")
    .replace(
      /\b(\d{1,3})\s+year\s+old\s+(male|female|woman|man|patient)\b/gi,
      "$1-year-old patient"
    );
}

// ---------- Prompts ----------
const CORE_INSTRUCTIONS =
  "You are Umbil, a concise UK clinical assistant. Use NICE, SIGN, CKS, BNF, NHS, GOV.UK, RCGP, BMJ Best Practice, Resus Council UK, TOXBASE (cite only). " +
  "Do not output names or PHI. Use plain lists (no tables). Keep within about 400 tokens and finish naturally. If the response hits the token limit, it may stop mid-sentence.";

const TONE_PROMPTS: Record<string, string> = {
  conversational:
    "Be clear, friendly, and very concise. End with one helpful follow-up question.",
  formal:
    "Write in professional clinical style and close with a one-line signpost for further reading.",
  reflective:
    "Use a warm mentoring tone and end with one related reflective question.",
};

// ---------- Route ----------
export async function POST(req: NextRequest) {
  if (!API_KEY)
    return NextResponse.json(
      { error: "Server configuration error: TOGETHER_API_KEY not set." },
      { status: 500 }
    );

  try {
    const body: {
      messages?: ClientMessage[];
      profile?: { full_name?: string | null; grade?: string | null };
      tone?: string;
    } = await req.json();

    const { messages, profile, tone = "conversational" } = body;
    if (!messages?.length)
      return NextResponse.json({ error: "Missing messages" }, { status: 400 });

    const tonePrompt = TONE_PROMPTS[tone] ?? TONE_PROMPTS.conversational;
    const grade = profile?.grade ? ` User grade: ${profile.grade}.` : "";
    const systemPrompt = `${CORE_INSTRUCTIONS} ${grade} ${tonePrompt}`;
    
    // The latest message is the user's current question
    const latestUserMessage = messages[messages.length - 1];

    // Apply sanitization to the latest user's input
    const sanitizedLatestUserMessage = sanitizeQuery(latestUserMessage.content);

    // CRITICAL FIX: Base the cache key ONLY on the System Prompt and the Sanitized Latest Question
    const cacheKeyContent = JSON.stringify({
      model: MODEL_SLUG,
      systemPrompt: systemPrompt,
      latestUserMessage: sanitizedLatestUserMessage,
    });
    
    // 1. Generate stable hash for the cache key
    const cacheHash = sha256(cacheKeyContent);
    
    // 2. Check Supabase cache (Query is only based on the hash)
    const { data: cachedData, error: cacheReadError } = await supabase
      .from(CACHE_TABLE)
      .select("answer")
      .eq("query_hash", cacheHash)
      .single();

    // PGRST116 is the expected error code for 'No rows found', so we ignore it.
    if (cacheReadError && cacheReadError.code !== 'PGRST116') { 
      console.error("Supabase Cache Read Error:", cacheReadError);
      // Continue execution to generate the answer if cache read fails
    }
    
    if (cachedData) {
        console.log(`[UMBL-API] Cache Hit for hash: ${cacheHash}`);
        return NextResponse.json({ answer: cachedData.answer });
    }
    
    console.log(`[UMBL-API] Cache Miss for hash: ${cacheHash}. Calling Together API...`);
    
    // --- Cache Miss: Proceed to LLM API call ---
    
    // Prepare messages: apply the system prompt and the full conversation history (which is necessary for LLM coherence, even if we don't cache based on it)
    const fullMessages = [
      { role: "system", content: systemPrompt },
      // Apply sanitization to the entire history before sending to the LLM (as it's only done on user messages)
      ...messages.map((m) => ({
          ...m,
          content: m.role === "user" ? sanitizeQuery(m.content) : m.content,
      })),
    ];

    const r = await fetch(CHAT_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_SLUG,
        messages: fullMessages,
        max_tokens: 500,
        temperature: 0.25,
        top_p: 0.8,
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      return NextResponse.json(
        { error: `Together API error: ${err}` },
        { status: r.status }
      );
    }

    const data: OpenAIResponse = await r.json();
    const answer = data.choices?.[0]?.message?.content ?? "";
    

    if (data.usage)
      console.log(
        `[UMBL-API] Tokens → total:${data.usage.total_tokens} prompt:${data.usage.prompt_tokens} completion:${data.usage.completion_tokens}`
      );
      
    // 3. Write new response to Supabase cache (Fire and forget: we don't await)
    // Only cache if the answer is meaningful (e.g., more than a short response)
    if (answer.length > 50) { 
        const cachePayload = {
          query_hash: cacheHash,
          answer: answer,
          full_query_key: cacheKeyContent, // Storing the content used to generate the hash
        };
        
        // Use upsert to handle concurrent writes safely
        const { error: cacheWriteError } = await supabase
          .from(CACHE_TABLE)
          .upsert(cachePayload, { onConflict: 'query_hash' }); 
          
        if (cacheWriteError) {
          console.error("Supabase Cache Write Error:", cacheWriteError);
        } else {
          console.log(`[UMBL-API] Cache Write Success for hash: ${cacheHash}`);
        }
    }

    return NextResponse.json({ answer });
  } catch (err: unknown) {
    const errorMessage = (err as { message?: string })?.message ?? "Server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}