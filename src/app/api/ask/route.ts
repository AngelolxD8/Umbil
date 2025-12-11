// src/app/api/ask/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseService } from "@/lib/supabaseService";
import { createHash } from "crypto";
import { streamText, generateText } from "ai"; 
import { createTogetherAI } from "@ai-sdk/togetherai";
import { tavily } from "@tavily/core";
import { SYSTEM_PROMPTS, STYLE_MODIFIERS } from "@/lib/prompts";

// Node.js runtime required for network checks
// export const runtime = 'edge'; 

type ClientMessage = { role: "user" | "assistant"; content: string };
type AnswerStyle = "clinic" | "standard" | "deepDive";

const API_KEY = process.env.TOGETHER_API_KEY!;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY!;

const MODEL_SLUG = "openai/gpt-oss-120b";
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
  const q = query.toLowerCase();
  
  // Regex includes specific medical visual terms
  const imageKeywords = /(image|picture|photo|diagram|illustration|look like|show me|appearance|rash|lesion|visible|ecg|x-ray|scan)/i;
  
  const hasKeyword = imageKeywords.test(q);
  console.log(`[Umbil] Image Intent Check: "${q}" -> Regex Match: ${hasKeyword}`);

  if (hasKeyword) return true; 

  return false;
}

// --- NEW: Helper to validate if an image is accessible ---
async function isValidImage(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 1500); // 1.5s timeout strictly

    const res = await fetch(url, { 
      method: 'HEAD', 
      signal: controller.signal,
      headers: { 'User-Agent': 'UmbilBot/1.0' } // Polite UA
    });
    
    clearTimeout(id);
    return res.ok; // True if status is 200-299
  } catch (e) {
    return false;
  }
}

// --- Web Context with Smart Validation & Limit Handling ---
async function getWebContext(query: string, wantsImage: boolean): Promise<{ text: string, error?: string }> {
  if (!tvly) return { text: "" };
  
  try {
    // Tavily Search
    const searchResult = await tvly.search(`${query} site:nice.org.uk OR site:bnf.nice.org.uk OR site:cks.nice.org.uk OR site:dermnetnz.org OR site:pcds.org.uk`, {
      searchDepth: "basic", 
      includeImages: wantsImage,
      maxResults: 3,
    });
    
    let contextStr = "\n\n--- REAL-TIME CONTEXT FROM UK GUIDELINES ---\n";
    contextStr += searchResult.results.map((r) => `Source: ${r.url}\nContent: ${r.content}`).join("\n\n");

    // --- SMART IMAGE HANDLING ---
    if (wantsImage && searchResult.images && searchResult.images.length > 0) {
      console.log(`[Umbil] Found ${searchResult.images.length} candidate images. Validating...`);
      
      let validImageFound = false;
      let validCount = 0;

      // Check the first few images
      for (const img of searchResult.images.slice(0, 3)) { // Check top 3 max
        if (validCount >= 1) break; // Stop after finding 1 good one to save time

        const isGood = await isValidImage(img.url);
        if (isGood) {
           contextStr += `\n\n--- VALIDATED MEDICAL IMAGE ---\nImage URL: ${img.url}\nDescription: ${img.description || 'Medical illustration'}\n`;
           validImageFound = true;
           validCount++;
        }
      }

      if (!validImageFound) {
         console.log("[Umbil] All images failed validation (hotlink protection).");
         // Fallback: Provide links but don't promise embedded images
      }
    }

    contextStr += "\n------------------------------------------\n";
    return { text: contextStr };

  } catch (e) {
    console.error("[Umbil] Search failed (Limit likely reached):", e);
    // Return specific error flag to trigger the "Upsell" message
    return { text: "", error: "LIMIT_REACHED" };
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

    // 2. Get Context (returns object now)
    const { text: context, error: searchError } = await getWebContext(userContent, wantsImage);

    const gradeNote = profile?.grade ? ` User grade: ${profile.grade}.` : "";
    const styleModifier = getStyleModifier(answerStyle);
    
    // 3. Dynamic System Prompt
    let imageInstruction = "";

    if (searchError === "LIMIT_REACHED") {
        // --- UPSELL TRIGGER ---
        imageInstruction = `
        IMPORTANT: The search tool failed because the monthly free limit was reached.
        You MUST apologize to the user and say:
        "I cannot retrieve live images or new guidelines right now as the monthly free search limit has been reached. 
        (This usually resets on the 1st of the month). 
        
        **Umbil Pro** offers unlimited visual searches and deep-dives. 
        For now, I will answer based on my internal medical knowledge."
        `;
    } else if (wantsImage && context.includes("VALIDATED MEDICAL IMAGE")) {
        // --- SUCCESS TRIGGER ---
        imageInstruction = `
        IMAGES FOUND: The context contains a VALIDATED image URL.
        1. Display it using Markdown: ![Medical Illustration](URL)
        2. **CRITICAL**: Immediately below the image, add a clickable link saying: 
           "[🔍 View Original Source on External Site](URL)"
        3. Explain what the image shows.
        `;
    } else if (wantsImage) {
        // --- INTENT BUT NO IMAGE FOUND ---
        imageInstruction = `
        The user asked for an image, but no valid/accessible image was found in the search context.
        Apologize briefly ("I couldn't find a verifiable open-access image for this specific condition right now") and provide a detailed text description instead.
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
      async onFinish({ text, usage }) {
        const answer = text.replace(/\n?References:[\s\S]*$/i, "").trim();

        await logAnalytics(userId, "question_asked", { 
            cache: "miss", 
            total_tokens: usage.totalTokens, 
            style: answerStyle || 'standard',
            device_id: deviceId,
            includes_images: wantsImage,
            limit_hit: !!searchError // Track this in analytics!
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