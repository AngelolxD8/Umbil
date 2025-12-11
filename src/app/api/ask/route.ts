// src/app/api/ask/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseService } from "@/lib/supabaseService";
import { createHash } from "crypto";
import { streamText, generateText } from "ai"; 
import { createTogetherAI } from "@ai-sdk/togetherai";
import { tavily } from "@tavily/core";
import { SYSTEM_PROMPTS, STYLE_MODIFIERS } from "@/lib/prompts";

// Node.js runtime is required for Tavily
// export const runtime = 'edge'; 

type ClientMessage = { role: "user" | "assistant"; content: string };
type AnswerStyle = "clinic" | "standard" | "deepDive";

const API_KEY = process.env.TOGETHER_API_KEY!;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY!;

const MODEL_SLUG = "openai/gpt-oss-120b";
// Using a lightweight model for the intent check to save costs/time
const INTENT_MODEL_SLUG = "meta-llama/Llama-3-8b-chat-hf"; 

const CACHE_TABLE = "api_cache";
const ANALYTICS_TABLE = "app_analytics";
const HISTORY_TABLE = "chat_history"; 

const together = createTogetherAI({ apiKey: API_KEY });
const tvly = TAVILY_API_KEY ? tavily({ apiKey: TAVILY_API_KEY }) : null;

function sha256(str: string): string {
  return createHash("sha256").update(str).digest("hex");
}

function sanitizeAndNormalizeQuery(q: string): string {
  return q.replace(/\b(john|jane|smith|mr\.|ms\.|mrs\.)\s+\w+/gi, "patient")
          .replace(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g, "a specific date")
          .replace(/\b\d{6,10}\b/g, "an identifier")
          .replace(/\b(\d{1,3})\s+year\s+old\s+(male|female|woman|man|patient)\b/gi, "$1-year-old patient")
          .toLowerCase()
          .replace(/\s+/g, " ")
          .trim();
}

function sanitizeQuery(q: string): string {
  return q.replace(/\b(john|jane|smith|mr\.|ms\.|mrs\.)\s+\w+/gi, "patient")
          .replace(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g, "a specific date")
          .replace(/\b\d{6,10}\b/g, "an identifier")
          .replace(/\b(\d{1,3})\s+year\s+old\s+(male|female|woman|man|patient)\b/gi, "$1-year-old patient");
}

const getStyleModifier = (style: AnswerStyle | null): string => {
  return STYLE_MODIFIERS[style || 'standard'] || STYLE_MODIFIERS.standard;
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

// --- Intent Detection ---
async function detectImageIntent(query: string): Promise<boolean> {
  // 1. Cheap/Free Regex Check first
  const imageKeywords = /(image|picture|photo|diagram|illustration|look like|show me)/i;
  if (!imageKeywords.test(query)) return false;

  // 2. If keywords found, confirm with AI
  try {
    const { text } = await generateText({
      model: together(INTENT_MODEL_SLUG),
      prompt: `User Query: "${query}"
      Does the user explicitly want to see a visual image, diagram, or photo? 
      Answer strictly YES or NO.`,
      // Removed maxTokens to fix TS error. The prompt ensures brevity.
    });
    return text.trim().toUpperCase().includes("YES");
  } catch (e) {
    // If AI check fails, fallback to regex result (which was true)
    return true; 
  }
}

// --- Web Context with Image Support ---
async function getWebContext(query: string, wantsImage: boolean): Promise<string> {
  if (!tvly) return "";
  
  try {
    const searchResult = await tvly.search(`${query} site:nice.org.uk OR site:bnf.nice.org.uk OR site:cks.nice.org.uk OR site:dermnetnz.org`, {
      searchDepth: "basic", 
      includeImages: wantsImage,
      maxResults: 3,
    });
    
    let contextStr = "\n\n--- REAL-TIME CONTEXT FROM UK GUIDELINES ---\n";
    
    // Add Text Snippets
    contextStr += searchResult.results.map((r) => `Source: ${r.url}\nContent: ${r.content}`).join("\n\n");

    // Add Images if requested and found
    if (wantsImage && searchResult.images && searchResult.images.length > 0) {
      contextStr += "\n\n--- RELEVANT MEDICAL IMAGES FOUND (Use markdown ![Alt](url) to display) ---\n";
      // We limit to 2 images to keep prompt small
      searchResult.images.slice(0, 2).forEach((img: any) => {
         contextStr += `Image URL: ${img.url}\nDescription: ${img.description || 'Medical illustration'}\n\n`;
      });
    }

    contextStr += "\n------------------------------------------\n";
    return contextStr;

  } catch (e) {
    console.error("Search grounding failed:", e);
    return "";
  }
}

export async function POST(req: NextRequest) {
  if (!API_KEY) return NextResponse.json({ error: "TOGETHER_API_KEY not set" }, { status: 500 });

  const userId = await getUserId(req);
  const deviceId = req.headers.get("x-device-id") || "unknown";

  try {
    const { messages, profile, answerStyle, saveToHistory, conversationId } = await req.json();
    
    if (!messages?.length) return NextResponse.json({ error: "Missing messages" }, { status: 400 });

    const latestUserMessage = messages[messages.length - 1];
    const userContent = latestUserMessage.content;
    const normalizedQuery = sanitizeAndNormalizeQuery(userContent);
    
    // 1. Detect Intent
    const wantsImage = await detectImageIntent(userContent);

    // 2. Get Context
    const context = await getWebContext(userContent, wantsImage);

    const gradeNote = profile?.grade ? ` User grade: ${profile.grade}.` : "";
    const styleModifier = getStyleModifier(answerStyle);
    
    // 3. System Prompt
    let imageInstruction = "";
    if (wantsImage && context.includes("RELEVANT MEDICAL IMAGES FOUND")) {
        imageInstruction = `
        IMAGES FOUND: The context contains image URLs. 
        If they are relevant to the user's question, display them using Markdown syntax: ![Description](URL).
        Do NOT hallucinate image URLs. Only use the ones provided in the context.
        `;
    }

    const systemPrompt = `${SYSTEM_PROMPTS.ASK_BASE}\n${styleModifier}\n${gradeNote}\n${imageInstruction}\n${context}`.trim();

    const cacheKeyContent = JSON.stringify({ model: MODEL_SLUG, query: normalizedQuery, style: answerStyle || 'standard' });
    const cacheKey = sha256(cacheKeyContent);

    const { data: cached } = await supabase.from(CACHE_TABLE).select("answer").eq("query_hash", cacheKey).single();

    if (cached) {
      await logAnalytics(userId, "question_asked", { 
          cache: "hit", 
          style: answerStyle || 'standard',
          device_id: deviceId 
      });
      
      if (userId && latestUserMessage.role === 'user' && saveToHistory) {
         await supabaseService.from(HISTORY_TABLE).insert({ 
             user_id: userId, 
             conversation_id: conversationId, 
             question: latestUserMessage.content, 
             answer: cached.answer 
         });
      }

      return NextResponse.json({ answer: cached.answer });
    }

    const result = await streamText({
      model: together(MODEL_SLUG), 
      messages: [
        { role: "system", content: systemPrompt }, 
        ...messages.map((m: ClientMessage) => ({ ...m, content: m.role === "user" ? sanitizeQuery(m.content) : m.content })),
      ],
      temperature: 0.2, 
      topP: 0.8,
      // Removed maxTokens to fix TS error.
      async onFinish({ text, usage }) {
        const answer = text.replace(/\n?References:[\s\S]*$/i, "").trim();

        await logAnalytics(userId, "question_asked", { 
            cache: "miss", 
            total_tokens: usage.totalTokens, 
            style: answerStyle || 'standard',
            device_id: deviceId,
            includes_images: wantsImage
        });

        if (answer.length > 50) {
          await supabaseService.from(CACHE_TABLE).upsert({ query_hash: cacheKey, answer, full_query_key: cacheKeyContent });
        }

        if (userId && latestUserMessage.role === 'user' && saveToHistory) {
            await supabaseService.from(HISTORY_TABLE).insert({ 
                user_id: userId, 
                conversation_id: conversationId, 
                question: latestUserMessage.content, 
                answer: answer 
            });
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