// src/lib/rag.ts

import { OpenAI } from "openai";
import { supabaseService } from "./supabaseService";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function generateEmbedding(text: string){
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.replace(/\n/g, " "),
  });
  return response.data[0].embedding;
}

// Context searching in supabase
export async function getLocalContext(query: string): Promise<string> {
  try {
    const embedding = await generateEmbedding(query);

    const { data: documents, error } = await supabaseService.rpc("match_docs", {
      query_embedding: embedding,
      match_threshold: 0.5, // fairly relevant matches
      match_count: 5,       // top 5 matches
    });

    if (error) {
      console.error("Supabase vector search error: ", error);
      return "";
    }

    if (!documents || documents.length === 0) {
      return "";
    }

    // results formatting
    const contextText = documents.map((doc: any) => {
      const source = doc.metadata?.source || "Unknown Source";
      return `--- Source: ${source} ---\n${doc.content}`;
    }).join("\n\n");

    return`-- Curated guidelines --\n${contextText}\n------\n`;
  } catch (err) {
    console.error("RAG Context Error:", err);
    return "";
  }
}