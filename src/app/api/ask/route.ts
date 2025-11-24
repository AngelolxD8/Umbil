// src/app/api/ask/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseService } from "@/lib/supabaseService";
import { createHash } from "crypto";
import { streamText } from "ai"; 
import { createTogetherAI } from "@ai-sdk/togetherai";
import { tavily } from "@tavily/core";

type ClientMessage = { role: "user" | "assistant"; content: string };
type AnswerStyle = "clinic" | "standard" | "deepDive";

const API_KEY = process.env.TOGETHER_API_KEY!;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY!;

// --- CONFIG: Keeping your original efficient model ---
const MODEL_SLUG = "openai/gpt-oss-120b";

const CACHE_TABLE = "api_cache";
const ANALYTICS_TABLE = "app_analytics";
const HISTORY_TABLE = "chat_history"; 

const together = createTogetherAI({ apiKey: API_KEY });
// Initialize Tavily only if key is present
const tvly = TAVILY_API_KEY ? tavily({ apiKey: TAVILY_API_KEY }) : null;

function sha256(str: string): string {
  return createHash("sha256").update(str).digest("hex");
}

function sanitizeAndNormalizeQuery(q: string): string {
  return q.replace(/\b(john|jane|smith|mr\.|ms\.|mrs\.)\s+\w+/gi, "patient").replace(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g, "a specific date").replace(/\b\d{6,10}\b/g, "an identifier").replace(/\b(\d{1,3})\s+year\s+old\s+(male|female|woman|man|patient)\b/gi, "$1-year-old patient").toLowerCase().replace(/\s+/g, " ").trim();
}

function sanitizeQuery(q: string): string {
  return q.replace(/\b(john|jane|smith|mr\.|ms\.|mrs\.)\s+\w+/gi, "patient").replace(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g, "a specific date").replace(/\b\d{6,10}\b/g, "an identifier").replace(/\b(\d{1,3})\s+year\s+old\s+(male|female|woman|man|patient)\b/gi, "$1-year-old patient");
}

// --- PROMPT: Updated to demand reliance on Search Context ---
const BASE_PROMPT = `
You are Umbil, a UK clinical assistant. 
Your primary goal is patient safety.
You must provide answers based ONLY on the provided "Context" (search results) or general medical consensus if context is missing.
If the user asks about drug dosing, YOU MUST CITE THE SOURCE (e.g. BNF, NICE) explicitly from the context.
If the Context suggests conflicting dosages, list BOTH and the conditions for each.
Use UK English and markdown. 
NEVER use HTML tags. 
Start with a concise summary.
`.trim();

const getStyleModifier = (style: AnswerStyle | null): string => {
  switch (style) {
    case 'clinic': return "Your answer must be extremely concise and under 150 words. Focus on 4-6 critical bullet points: likely diagnosis, key actions, and safety-netting.";
    case 'deepDive': return "Provide a comprehensive answer suitable for teaching. Discuss evidence, pathophysiology, and guidelines.";
    case 'standard': default: return "Provide a standard, balanced answer, ideally under 400 words.";
  }
};

async function getUserId(req: NextRequest): Promise<string | null> {
  try {
    const token = req.headers.get("authorization")?.split("Bearer ")[1];
    if (!token) return null;
    const { data } = await supabase.auth.getUser(token);
    return data.user?.id || null;
  } catch { return null; }
}

async function logAnalytics(userId: string | null, eventType: string, metadata: Record<string, unknown>) {
  try { supabaseService.from(ANALYTICS_TABLE).insert({ user_id: userId, event_type: eventType, metadata }).then(() => {}); } catch { }
}

// --- NEW: Lightweight Web Search (Grounding) ---
async function getWebContext(query: string): Promise<string> {
  if (!tvly) return "";
  try {
    // We use 'basic' depth for speed. Switch to 'advanced' if you need deeper page scraping.
    const searchContext = await tvly.search(`${query} site:nice.org.uk OR site:bnf.nice.org.uk OR site:cks.nice.org.uk`, {
      searchDepth: "basic", 
      maxResults: 3,
    });
    
    const snippets = searchContext.results.map((r) => `Source: ${r.url}\nContent: ${r.content}`).join("\n\n");
    return `\n\n--- REAL-TIME CONTEXT FROM UK GUIDELINES ---\n${snippets}\n------------------------------------------\n`;
  } catch (e) {
    console.error("Search grounding failed", e);
    return "";
  }
}

export async function POST(req: NextRequest) {
  if (!API_KEY) return NextResponse.json({ error: "TOGETHER_API_KEY not set" }, { status: 500 });

  const userId = await getUserId(req);

  try {
    const { messages, profile, answerStyle, saveToHistory } = await req.json();
    if (!messages?.length) return NextResponse.json({ error: "Missing messages" }, { status: 400 });

    const latestUserMessage = messages[messages.length - 1];
    const normalizedQuery = sanitizeAndNormalizeQuery(latestUserMessage.content);
    
    // 1. Get Grounding Context (This adds ~0.5s - 1s latency but ensures accuracy)
    // We do this BEFORE the cache check so we can potentially include context in the future or just use it for generation.
    // Note: If you want maximum speed, you could check cache *first*, and only search if cache misses.
    // However, for medical questions, context is vital.
    
    const context = await getWebContext(latestUserMessage.content);

    const gradeNote = profile?.grade ? ` User grade: ${profile.grade}.` : "";
    const styleModifier = getStyleModifier(answerStyle);
    
    // 2. Inject Context into System Prompt
    const systemPrompt = `${BASE_PROMPT}\n${styleModifier}\n${gradeNote}\n${context}`.trim();

    // Cache key logic remains the same
    const cacheKeyContent = JSON.stringify({ model: MODEL_SLUG, query: normalizedQuery, style: answerStyle || 'standard' });
    const cacheKey = sha256(cacheKeyContent);

    const { data: cached } = await supabase.from(CACHE_TABLE).select("answer").eq("query_hash", cacheKey).single();

    if (cached) {
      await logAnalytics(userId, "question_asked", { cache: "hit", style: answerStyle || 'standard' });
      
      if (userId && latestUserMessage.role === 'user' && saveToHistory) {
         const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
         supabaseService.from(HISTORY_TABLE).insert({ user_id: userId, question: latestUserMessage.content, answer: cached.answer }).then(() => {});
         supabaseService.from(HISTORY_TABLE).delete().eq('user_id', userId).lt('created_at', sevenDaysAgo.toISOString()).then(() => {});
      }

      return NextResponse.json({ answer: cached.answer });
    }

    const result = await streamText({
      model: together(MODEL_SLUG), 
      messages: [
        { role: "system", content: systemPrompt }, 
        ...messages.map((m: ClientMessage) => ({ ...m, content: m.role === "user" ? sanitizeQuery(m.content) : m.content })),
      ],
      // Lower temperature slightly to force model to stick to the Search Context
      temperature: 0.2, 
      topP: 0.8,
      maxOutputTokens: 4096, 
      async onFinish({ text, usage }) {
        const answer = text.replace(/\n?References:[\s\S]*$/i, "").trim();

        await logAnalytics(userId, "question_asked", { cache: "miss", total_tokens: usage.totalTokens, style: answerStyle || 'standard' });

        if (answer.length > 50) {
          await supabaseService.from(CACHE_TABLE).upsert({ query_hash: cacheKey, answer, full_query_key: cacheKeyContent });
        }

        if (userId && latestUserMessage.role === 'user' && saveToHistory) {
            const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            await Promise.allSettled([
                supabaseService.from(HISTORY_TABLE).insert({ 
                    user_id: userId, 
                    question: latestUserMessage.content,
                    answer: answer 
                }),
                supabaseService.from(HISTORY_TABLE).delete().eq('user_id', userId).lt('created_at', sevenDaysAgo.toISOString())
            ]);
        }
      },
    });

    return result.toTextStreamResponse({ headers: { "X-Cache-Status": "MISS" } });

  } catch (err: unknown) {
    console.error("[Umbil] Fatal Error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}