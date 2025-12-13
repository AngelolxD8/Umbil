// src/app/api/admin/ingest/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabaseService";
import { generateEmbedding }from "@/lib/rag";
import { createTogetherAI } from "@ai-sdk/togetherai";
import { embed, generateText } from "ai";
import { INGESTION_PROMPT } from "@/lib/prompts";
import { metadata } from "@/app/head";
import { Truculenta } from "next/font/google";

const togetherai = createTogetherAI({ apiKey: process.env.TOGETHER_API_KEY! });
const MODEL_SLUG = "openai/gpt-oss-120b";

export async function POST(request: NextRequest) {
  try {
    const { text, source } = await request.json();

    if (!text || !source) {
      return NextResponse.json({ error: "Missing text or sauce" }, {status: 400});
    }

    // 1. rewrite step
    const { text: originalUmbilContent } = await generateText({
      model: togetherai(MODEL_SLUG),
      prompt: `${INGESTION_PROMPT}\n\n${text}`,
      temperature: 0.3, // This keeps it highly factual and avoid hallucination
    });

    // 2. chonking
    const chunks = originalUmbilContent.split("\n\n").filter((c) => c.length > 50);

    // 3. embed & store in supabase
    let chunksProcessed = 0;

    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk);
      
      await supabaseService.from("documents").insert({
        content: chunk,
        metadata: {
          source,
          type: "umbil_rewrite_original",
          original_ref: "Based on: " + source
        },
        embedding
      });
      chunksProcessed++;
    }

    return NextResponse.json({
      success: true,
      chunksProcessed,
      message: "Contents have been rewritten and stored as Umbil Original."
    });

  } catch(err: any) {
    console.error("Ingest Error: ", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}