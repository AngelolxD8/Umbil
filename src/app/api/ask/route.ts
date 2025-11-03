// src/app/api/ask/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseService } from "@/lib/supabaseService"; 
import { createHash } from "crypto";

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
const ANALYTICS_TABLE = "app_analytics"; 

// ---------- Helpers (Keep all your existing helpers) ----------
function sha256(str: string): string {
  return createHash("sha256").update(str).digest("hex");
}

function sanitizeAndNormalizeQuery(q: string): string {
  // ... (your existing function)
  return q
    .replace(/\b(john|jane|smith|mr\.|ms\.|mrs\.)\s+\w+/gi, "patient")
    .replace(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g, "a specific date")
    .replace(/\b\d{6,10}\b/g, "an identifier")
    .replace(/\b(\d{1,3})\s+year\s+old\s+(male|female|woman|man|patient)\b/gi, "$1-year-old patient")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeQuery(q: string): string {
  // ... (your existing function)
  return q
    .replace(/\b(john|jane|smith|mr\.|ms\.|mrs\.)\s+\w+/gi, "patient")
    .replace(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g, "a specific date")
    .replace(/\b\d{6,10}\b/g, "an identifier")
    .replace(/\b(\d{1,3})\s+year\s+old\s+(male|female|woman|man|patient)\b/gi, "$1-year-old patient");
}

// --- CORE PROMPT UPDATED AS REQUESTED ---
const CORE_INSTRUCTIONS = `
You are Umbil, a concise UK clinical assistant. Use UK English. Give structured, evidence-based answers (NICE, SIGN, CKS, BNF, BMJ or other UK sources). Start with a short summary, then bullets. End with a helpful follow-up (another differential)
`;

// --- TONE_PROMPTS REMOVED ---

// --- HELPER: Get User ID from request ---
async function getUserId(req: NextRequest): Promise<string | null> {
  try {
    const token = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!token) return null;

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;
    return data.user.id;
  } catch (e) {
    // --- FIX 1: Use the 'e' variable to fix the ESLint warning ---
    console.error("getUserId error:", (e as Error).message);
    return null;
  }
}

// --- HELPER: Log Analytics Event ---
async function logAnalytics(
  userId: string | null,
  eventType: string,
  // --- FIX 2: Replaced 'any' with a specific type to fix the ESLint error ---
  metadata: Record<string, unknown>
) {
  try {
    const { error } = await supabaseService.from(ANALYTICS_TABLE).insert({
      user_id: userId,
      event_type: eventType,
      metadata: metadata,
    });
    if (error) {
      console.error("[Umbil] Analytics Log Error:", error.message);
    }
  } catch (e) {
    console.error("[Umbil] Analytics Log Exception:", (e as Error).message);
  }
}

// ---------- Route Handler ----------

export async function POST(req: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: "Server configuration error: TOGETHER_API_KEY not set." },
      { status: 500 }
    );
  }

  // --- Get User ID for logging ---
  const userId = await getUserId(req);

  try {
    const body = await req.json();
    // --- 'tone' REMOVED from destructuring ---
    const { messages, profile } = body;
    if (!messages?.length)
      return NextResponse.json({ error: "Missing messages" }, { status: 400 });

    // --- 'tonePrompt' logic REMOVED ---
    const gradeNote = profile?.grade ? ` User grade: ${profile.grade}.` : "";

    // --- 'systemPrompt' logic SIMPLIFIED ---
    const systemPrompt = `${CORE_INSTRUCTIONS.trim()} ${gradeNote}`;

    // ----- CACHE KEY -----
    const latestUserMessage = messages[messages.length - 1];
    const normalizedUser = sanitizeAndNormalizeQuery(latestUserMessage.content);

    // --- 'tone' REMOVED from cache key ---
    const cacheKeyContent = JSON.stringify({
      model: MODEL_SLUG,
      query: normalizedUser,
    });

    const cacheHash = sha256(cacheKeyContent);

    // ----- CHECK CACHE -----
    const { data: cached, error: cacheError } = await supabase
      .from(CACHE_TABLE)
      .select("answer")
      .eq("query_hash", cacheHash)
      .single();

    if (cacheError && cacheError.code !== "PGRST116") {
      console.error("[Umbil] Cache Read Error:", cacheError);
    }

    if (cached) {
      console.log(`[Umbil] Cache HIT → ${cacheHash}`);
      
      // --- LOG CACHE HIT ---
      await logAnalytics(userId, 'question_asked', { 
        cache: 'hit', 
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0 
      });
      
      return NextResponse.json({ answer: cached.answer });
    }

    console.log(`[Umbil] Cache MISS → ${cacheHash}. Fetching from Together API...`);

    // ----- API CALL -----
    const fullMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: ClientMessage) => ({
        ...m,
        content: m.role === "user" ? sanitizeQuery(m.content) : m.content,
      })),
    ];

    const res = await fetch(CHAT_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_SLUG,
        messages: fullMessages,
        max_tokens: 4096, // Kept fix for long answers
        temperature: 0.25,
        top_p: 0.8,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Together API error: ${errText}`);
    }

    const data: OpenAIResponse = await res.json();
    let answer = data.choices?.[0]?.message?.content?.trim() || "";
    const usage = data.usage; 

    if (usage) {
      console.log(
        `[Umbil] Tokens used → total:${usage.total_tokens} prompt:${usage.prompt_tokens} completion:${usage.completion_tokens}`
      );
      
      await logAnalytics(userId, 'question_asked', {
        cache: 'miss',
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens,
        model: MODEL_SLUG
      });
    }

    // ----- POST-PROCESSING -----
    answer = answer.replace(/\n?References:[\s\S]*$/i, "").trim();

    // ----- CACHE WRITE -----
    if (answer.length > 50) {
      const cacheEntry = {
        query_hash: cacheHash,
        answer,
        full_query_key: cacheKeyContent,
      };

      const { error: writeErr } = await supabase
        .from(CACHE_TABLE)
        .upsert(cacheEntry, { onConflict: "query_hash" });

      if (writeErr)
        console.error("[Umbil] Cache Write Error:", writeErr);
      else
        console.log(`[Umbil] Cache Saved → ${cacheHash}`);
    }

    return NextResponse.json({ answer });
  } catch (err: unknown) {
    console.error("[Umbil] Fatal Error:", err);
    
    await logAnalytics(userId, 'api_error', { 
      error: (err as Error).message,
      source: 'ask_route'
    });
    
    const msg = (err as Error).message || "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}