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
  // CORRECTED FIX: Reverting to the existing, known-working SHA-256 implementation.
  return createHash('sha256').update(str).digest('hex');
}

/**
 * Sanitizes PHI and normalizes text for a consistent cache key.
 */
function sanitizeAndNormalizeQuery(q: string): string {
  // 1. PHI Sanitization
  const sanitized = q
    .replace(/\b(john|jane|smith|mr\.|ms\.|mrs\.)\s+\w+/gi, "patient")
    .replace(/\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/g, "a specific date")
    .replace(/\b\d{6,10}\b/g, "a long identifier number")
    .replace(
      /\b(\d{1,3})\s+year\s+old\s+(male|female|woman|man|patient)\b/gi,
      "$1-year-old patient"
    );
    
  // 2. Aggressive Normalization for Cache Consistency (lowercasing, trimming extra space)
  return sanitized.toLowerCase().replace(/\s+/g, ' ').trim();
}

// NOTE: This version is only used to send to the LLM and needs to be less aggressive than the cache key version
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
  "You must always complete your response, even if the token limit is approached. Do not output names or PHI. Use plain lists (no tables). Keep within about 800 tokens for thoroughness.";

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
    
    const latestUserMessage = messages[messages.length - 1];

    // 1. Generate CRITICAL CACHE KEY CONTENT (uses normalized text & tone)
    const normalizedLatestUserMessage = sanitizeAndNormalizeQuery(latestUserMessage.content);

    const cacheKeyContent = JSON.stringify({
      model: MODEL_SLUG,
      tone: tone, 
      latestUserMessage: normalizedLatestUserMessage,
    });
    
    // 2. Generate stable hash for the cache key
    const cacheHash = sha256(cacheKeyContent); // Using the correct sha256 function
    
    // 3. Check Supabase cache
    const { data: cachedData, error: cacheReadError } = await supabase
      .from(CACHE_TABLE)
      .select("answer")
      .eq("query_hash", cacheHash)
      .single();

    if (cacheReadError && cacheReadError.code !== 'PGRST116') { 
      console.error("Supabase Cache Read Error:", cacheReadError);
    }
    
    if (cachedData) {
        console.log(`[UMBL-API] Cache Hit for hash: ${cacheHash}`);
        return NextResponse.json({ answer: cachedData.answer });
    }
    
    console.log(`[UMBL-API] Cache Miss for hash: ${cacheHash}. Calling Together API...`);
    
    // --- Cache Miss: Proceed to LLM API call ---
    
    const fullMessages = [
      { role: "system", content: systemPrompt },
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
        max_tokens: 800, 
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
    let answer = data.choices?.[0]?.message?.content ?? "";
    

    if (data.usage)
      console.log(
        `[UMBL-API] Tokens → total:${data.usage.total_tokens} prompt:${data.usage.prompt_tokens} completion:${data.usage.completion_tokens}`
      );
      
    // 4. Post-processing: Remove excessive inline citations from the answer
    answer = answer.replace(/ - (?:[A-Z\s\d;.]+?)(?=(?:\s*\n)|$)/g, '');
      
    // 5. Write new response to Supabase cache (Fire and forget: we don't await)
    if (answer.length > 50) { 
        const cachePayload = {
          query_hash: cacheHash,
          answer: answer,
          full_query_key: cacheKeyContent,
        };
        
        const { error: cacheWriteError } = await supabase
          .from(CACHE_TABLE)
          .upsert(cachePayload, { onConflict: 'query_hash' }); 
          
        if (cacheWriteError) {
          console.error("Supabase Cache Write Error (Non-blocking):", cacheWriteError);
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