// src/app/api/ask/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseService } from "@/lib/supabaseService";
import { createHash } from "crypto";
import { streamText } from "ai"; 
import { createTogetherAI } from "@ai-sdk/togetherai";
import { tavily } from "@tavily/core";
import { SYSTEM_PROMPTS, STYLE_MODIFIERS } from "@/lib/prompts";

// Node.js runtime required
// export const runtime = 'edge'; 

type ClientMessage = { role: "user" | "assistant"; content: string };
type AnswerStyle = "clinic" | "standard" | "deepDive";

const API_KEY = process.env.TOGETHER_API_KEY!;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY!;

const MODEL_SLUG = "openai/gpt-oss-120b";
const CACHE_TABLE = "api_cache";
const ANALYTICS_TABLE = "app_analytics";
const HISTORY_TABLE = "chat_history"; 

// Define Trusted Image Sources
const TRUSTED_SOURCES = [
  "site:nice.org.uk",
  "site:bnf.nice.org.uk",
  "site:cks.nice.org.uk",
  "site:dermnetnz.org",
  "site:pcds.org.uk",
  "site:cdc.gov", // Added CDC for good measure
  "site:nhs.uk"   // Added NHS
].join(" OR ");

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

// --- Helper to get clean source name ---
function getDomainName(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    if (hostname.includes('dermnetnz')) return 'DermNet NZ';
    if (hostname.includes('nice.org')) return 'NICE CKS';
    if (hostname.includes('nhs.uk')) return 'NHS';
    if (hostname.includes('cdc.gov')) return 'CDC';
    if (hostname.includes('pcds')) return 'PCDS';
    return hostname.replace('www.', '');
  } catch (e) {
    return 'Trusted Source';
  }
}

// --- Intent Detection ---
async function detectImageIntent(query: string): Promise<boolean> {
  const q = query.toLowerCase();
  // Regex includes specific medical visual terms
  const imageKeywords = /(image|picture|photo|diagram|illustration|look like|show me|appearance|rash|lesion|visible|ecg|x-ray|scan|clinical feature)/i;
  return imageKeywords.test(q);
}

// --- Web Context (Trusted Sources & Rich Links) ---
async function getWebContext(query: string, wantsImage: boolean): Promise<{ text: string, error?: string }> {
  if (!tvly) return { text: "" };
  
  try {
    // Search ONLY trusted sources
    const searchResult = await tvly.search(`${query} ${TRUSTED_SOURCES}`, {
      searchDepth: "basic", // Keep cost low
      includeImages: wantsImage,
      maxResults: 3,
    });
    
    let contextStr = "\n\n--- REAL-TIME CONTEXT FROM TRUSTED GUIDELINES ---\n";
    contextStr += searchResult.results.map((r) => `Source: ${r.url}\nContent: ${r.content}`).join("\n\n");

    // --- TRUSTED IMAGE HANDLING ---
    if (wantsImage && searchResult.images && searchResult.images.length > 0) {
      contextStr += "\n\n--- RELEVANT IMAGES FROM TRUSTED SOURCES ---\n";
      
      // Take top 2 images and format them with source info for the AI
      searchResult.images.slice(0, 2).forEach((img: any) => {
         const sourceName = getDomainName(img.url);
         contextStr += `Image Link: ${img.url}\nSource: ${sourceName}\nDescription: ${img.description || 'Clinical illustration'}\n\n`;
      });
    }

    contextStr += "\n------------------------------------------\n";
    return { text: contextStr };

  } catch (e) {
    console.error("[Umbil] Search failed (Limit likely reached):", e);
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
        // --- LIMIT HIT TRIGGER ---
        imageInstruction = `
        IMPORTANT: The external search tool failed because the monthly free limit has been reached.
        You MUST apologize to the user and say exactly:
        "I cannot retrieve live images or new guidelines right now as the monthly free search limit has been reached. (This usually resets on the 1st of the month). 
        **Umbil Pro** offers unlimited visual searches and deep-dives. 
        For now, I will answer based on my internal medical knowledge."
        Then, answer the user's question as best you can without external tools.
        `;
    } else if (wantsImage && context.includes("RELEVANT IMAGES FROM TRUSTED SOURCES")) {
        // --- SUCCESS TRIGGER (Rich Link Strategy) ---
        imageInstruction = `
        IMAGES FOUND: The context contains image links from trusted sources.
        Do NOT try to embed them with ![]. Many medical sites block embedding.
        Instead, provide a descriptive text and then a clearly labeled, clickable link in this format:
        
        [📷 View Image of {Description} on {Source Name}](URL)
        
        Example: [📷 View clinical photograph of rash on DermNet NZ](https://...)
        Make sure the link is prominent.
        `;
    } else if (wantsImage) {
        // --- INTENT BUT NO IMAGE FOUND ---
        imageInstruction = `
        The user asked for an image, but no relevant image was found on trusted sources (NICE, DermNet, CDC, etc.).
        State clearly: "I could not locate a verifiable, open-access image from trusted clinical sources for this specific request."
        Then provide a detailed text description instead.
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
            limit_hit: !!searchError
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