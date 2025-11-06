// src/app/api/ask/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseService } from "@/lib/supabaseService";
import { createHash } from "crypto";
// We only need streamText from 'ai'
import { streamText } from "ai"; 
import { createTogetherAI } from "@ai-sdk/togetherai";

// ---------- Types ----------
type ClientMessage = { role: "user" | "assistant"; content: string };

// ---------- Config ----------
const API_KEY = process.env.TOGETHER_API_KEY!;
// const TOGETHER_API_BASE_URL = "https://api.together.xyz/v1"; // Not needed
const MODEL_SLUG = "openai/gpt-oss-120b";
const CACHE_TABLE = "api_cache";
const ANALYTICS_TABLE = "app_analytics";

// Together AI client
const together = createTogetherAI({
  apiKey: API_KEY,
  // baseURL is not needed for the official provider
});

// ---------- Helpers ----------
// --- FIX 1: Renamed function from `sha26` to `sha256` ---
function sha256(str: string): string {
  return createHash("sha256").update(str).digest("hex");
}

// --- NEW (Restored): Function specifically for cache key generation ---
function sanitizeAndNormalizeQuery(q: string): string {
  return q
    .replace(/\b(john|jane|smith|mr\.|ms\.|mrs\.)\s+\w+/gi, "patient")
    .replace(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g, "a specific date")
    .replace(/\b\d{6,10}\b/g, "an identifier")
    .replace(/\b(\d{1,3})\s+year\s+old\s+(male|female|woman|man|patient)\b/gi, "$1-year-old patient")
    .toLowerCase() // Normalizes case
    .replace(/\s+/g, " ") // Normalizes whitespace
    .trim();
}

function sanitizeQuery(q: string): string {
  return q
    .replace(/\b(john|jane|smith|mr\.|ms\.|mrs\.)\s+\w+/gi, "patient")
    .replace(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g, "a specific date")
    .replace(/\b\d{6,10}\b/g, "an identifier")
    .replace(/\b(\d{1,3})\s+year\s+old\s+(male|female|woman|man|patient)\b/gi, "$1-year-old patient");
}

const CORE_INSTRUCTIONS = `
You are Umbil, a concise UK clinical assistant. Use UK English, markdown formatting (not HTML). 
Reference UK clinical guidance (NICE, SIGN, CKS, BNF). Start with a short summary, then bullet points, 
and end with a helpful follow-up or differential.
`;

async function getUserId(req: NextRequest): Promise<string | null> {
  try {
    const token = req.headers.get("authorization")?.split("Bearer ")[1];
    if (!token) return null;

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;
    return data.user.id;
  } catch (e) {
    console.error("getUserId error:", (e as Error).message);
    return null;
  }
}

async function logAnalytics(
  userId: string | null,
  eventType: string,
  metadata: Record<string, unknown>
) {
  try {
    const { error } = await supabaseService.from(ANALYTICS_TABLE).insert({
      user_id: userId,
      event_type: eventType,
      metadata,
    });
    if (error) console.error("[Umbil] Analytics Log Error:", error.message);
  } catch (e) {
    console.error("[Umbil] Analytics Log Exception:", (e as Error).message);
  }
}

// ---------- Route Handler ----------
export async function POST(req: NextRequest) {
  if (!API_KEY)
    return NextResponse.json({ error: "TOGETHER_API_KEY not set" }, { status: 500 });

  // Get User ID for logging (available in both try and catch)
  const userId = await getUserId(req);

  // --- FEATURE 2: Add main try...catch for API error logging ---
  try {
    const { messages, profile } = await req.json();

    if (!messages?.length)
      return NextResponse.json({ error: "Missing messages" }, { status: 400 });

    const gradeNote = profile?.grade ? ` User grade: ${profile.grade}.` : "";
    const systemPrompt = `${CORE_INSTRUCTIONS.trim()} ${gradeNote}`;

    const latestUserMessage = messages[messages.length - 1];
    
    // 1. Use the *normalized* query for the cache key
    const normalizedQuery = sanitizeAndNormalizeQuery(latestUserMessage.content);
    
    // 2. Define the full cache key content
    const cacheKeyContent = JSON.stringify({ model: MODEL_SLUG, query: normalizedQuery });
    const cacheKey = sha256(cacheKeyContent);

    // --- Cache Lookup ---
    const { data: cached } = await supabase
      .from(CACHE_TABLE)
      .select("answer")
      .eq("query_hash", cacheKey)
      .single();

    if (cached) {
      await logAnalytics(userId, "question_asked", {
        cache: "hit",
        input_tokens: 0,
        output_tokens: 0,
      });
      return NextResponse.json({ answer: cached.answer });
    }

    // --- Streaming Call ---
    const result = await streamText({
      model: together(MODEL_SLUG), 
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m: ClientMessage) => ({
          ...m,
          content: m.role === "user" ? sanitizeQuery(m.content) : m.content,
        })),
      ],
      temperature: 0.25,
      topP: 0.8,
      maxOutputTokens: 4096, 
      async onFinish({ text, usage }) {
        const answer = text.replace(/\n?References:[\s\S]*$/i, "").trim();

        await logAnalytics(userId, "question_asked", {
          cache: "miss",
          input_tokens: usage.inputTokens,
          output_tokens: usage.outputTokens,
          total_tokens: usage.totalTokens,
          model: MODEL_SLUG,
        });

        if (answer.length > 50) {
          // 3. Add `full_query_key` back to the cache entry
          await supabaseService.from(CACHE_TABLE).upsert({
            query_hash: cacheKey,
            answer,
            full_query_key: cacheKeyContent,
          });
        }
      },
    });

    return result.toTextStreamResponse({
      headers: { "X-Cache-Status": "MISS" },
    });

  } catch (err: unknown) {
    // --- This is the new catch block for logging API errors ---
    console.error("[Umbil] Fatal Error:", err);
    
    await logAnalytics(userId, 'api_error', { 
      error: (err as Error).message,
      source: 'ask_route'
    });
    
    const msg = (err as Error).message || "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
  // --- END FEATURE 2 ---
}