// src/app/api/ask/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseService } from "@/lib/supabaseService";
import { createHash } from "crypto";
import { streamText } from "ai"; 
import { createTogetherAI } from "@ai-sdk/togetherai";

type ClientMessage = { role: "user" | "assistant"; content: string };
type AnswerStyle = "clinic" | "standard" | "deepDive";

const API_KEY = process.env.TOGETHER_API_KEY!;
const MODEL_SLUG = "openai/gpt-oss-120b";
const CACHE_TABLE = "api_cache";
const ANALYTICS_TABLE = "app_analytics";
const HISTORY_TABLE = "chat_history"; 

const together = createTogetherAI({ apiKey: API_KEY });

function sha256(str: string): string {
  return createHash("sha256").update(str).digest("hex");
}

function sanitizeAndNormalizeQuery(q: string): string {
  return q.replace(/\b(john|jane|smith|mr\.|ms\.|mrs\.)\s+\w+/gi, "patient").replace(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g, "a specific date").replace(/\b\d{6,10}\b/g, "an identifier").replace(/\b(\d{1,3})\s+year\s+old\s+(male|female|woman|man|patient)\b/gi, "$1-year-old patient").toLowerCase().replace(/\s+/g, " ").trim();
}

function sanitizeQuery(q: string): string {
  return q.replace(/\b(john|jane|smith|mr\.|ms\.|mrs\.)\s+\w+/gi, "patient").replace(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g, "a specific date").replace(/\b\d{6,10}\b/g, "an identifier").replace(/\b(\d{1,3})\s+year\s+old\s+(male|female|woman|man|patient)\b/gi, "$1-year-old patient");
}

const BASE_PROMPT = `You are Umbil, a UK clinical assistant. Use UK English and markdown formatting. NEVER use HTML tags like <br>. Use new lines for spacing. Reference UK clinical guidance (NICE, SIGN, CKS, BNF). Start with a concise summary, then use bullet points for key details, and end with a helpful follow-up or differential.`.trim();

const getStyleModifier = (style: AnswerStyle | null): string => {
  switch (style) {
    case 'clinic': return "Your answer must be extremely concise and under 150 words. Focus on 4-6 critical bullet points: likely diagnosis, key actions, and safety-netting. Keep it very short for quick reading in a clinical setting.";
    case 'deepDive': return "Provide a comprehensive, detailed answer suitable for teaching. Go into more depth on the evidence, pathophysiology, or specific guideline details. There is no word limit; be thorough.";
    case 'standard': default: return "Provide a standard, balanced answer, ideally under 400 words. Be clear and comprehensive but not excessively long.";
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

export async function POST(req: NextRequest) {
  if (!API_KEY) return NextResponse.json({ error: "TOGETHER_API_KEY not set" }, { status: 500 });

  const userId = await getUserId(req);

  try {
    const { messages, profile, answerStyle, saveToHistory } = await req.json();
    if (!messages?.length) return NextResponse.json({ error: "Missing messages" }, { status: 400 });

    const gradeNote = profile?.grade ? ` User grade: ${profile.grade}.` : "";
    const styleModifier = getStyleModifier(answerStyle);
    const systemPrompt = `${BASE_PROMPT} ${styleModifier} ${gradeNote}`.trim();

    const latestUserMessage = messages[messages.length - 1];
    const normalizedQuery = sanitizeAndNormalizeQuery(latestUserMessage.content);
    
    const cacheKeyContent = JSON.stringify({ model: MODEL_SLUG, query: normalizedQuery, style: answerStyle || 'standard' });
    const cacheKey = sha256(cacheKeyContent);

    const { data: cached } = await supabase.from(CACHE_TABLE).select("answer").eq("query_hash", cacheKey).single();

    if (cached) {
      await logAnalytics(userId, "question_asked", { cache: "hit", input_tokens: 0, output_tokens: 0, style: answerStyle || 'standard' });
      
      // FIX: Even on cache hit, we might need to save to history if this is the first message
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
      temperature: 0.25,
      topP: 0.8,
      maxOutputTokens: 4096, 
      async onFinish({ text, usage }) {
        const answer = text.replace(/\n?References:[\s\S]*$/i, "").trim();

        await logAnalytics(userId, "question_asked", { cache: "miss", total_tokens: usage.totalTokens, style: answerStyle || 'standard' });

        if (answer.length > 50) {
          await supabaseService.from(CACHE_TABLE).upsert({ query_hash: cacheKey, answer, full_query_key: cacheKeyContent });
        }

        // --- UPDATED: Save Question + Answer to History here ---
        if (userId && latestUserMessage.role === 'user' && saveToHistory) {
            const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            await Promise.allSettled([
                supabaseService.from(HISTORY_TABLE).insert({ 
                    user_id: userId, 
                    question: latestUserMessage.content,
                    answer: answer // Save the generated answer!
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