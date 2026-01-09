// src/app/api/admin/ingestion/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabaseService";
import { generateEmbedding }from "@/lib/rag";
import { OpenAI } from "openai";
import { embed, generateText } from "ai";
import { INGESTION_PROMPT } from "@/lib/prompts";
import { metadata } from "@/app/head";
import { Truculenta } from "next/font/google";

const openai = new OpenAI();
const MODEL_SLUG = "gpt-4.1";

export async function POST(request: NextRequest) {
  try {
    const { text, source } = await request.json();

    if (!text || !source) {
      return NextResponse.json({ error: "Missing text or sauce" }, {status: 400});
    }

    // 1. rewrite step
    const completion = await openai.chat.completions.create({
      model: MODEL_SLUG,
      messages: [
      {
        role: "system",
        content: `${INGESTION_PROMPT}
        Include the source citation at the end of the rewritten original content.
        Source: ${source}`
      },
      {
        role: "user",
        content: text
      }
      ],
      temperature: 0.3, // This keeps it highly factual and avoid hallucination
    });

    const originalUmbilContent = completion.choices[0].message.content;

    if (!originalUmbilContent) {
      throw new Error("OpenAI returned no content");
    }

    const rewrittenContent = originalUmbilContent;

    // 2. chonking
    const chunks = originalUmbilContent.split("\n\n").filter((c) => c.length > 100);

    // 3. embed & store in supabase
    let chunksProcessed = 0;

    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk);
      
      await supabaseService.from("knowledge_base").insert({
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
      rewrittenContent,
      message: "Contents have been rewritten and stored as Umbil Original."
    });

  } catch(err: any) {
    console.error("Ingest Error: ", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}