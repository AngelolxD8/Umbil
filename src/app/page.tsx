// src/app/page.tsx
"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type AskResponse = { answer?: string; error?: string };

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return "Unknown error";
  }
}

export default function Home() {
  const [q, setQ] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [answer, setAnswer] = useState<string | null>(null);

  const ask = async () => {
    if (!q.trim()) return;
    setLoading(true);
    setAnswer(null);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, tone: "conversational" }),
      });

      const data: AskResponse = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");

      setAnswer(data.answer ?? "");
    } catch (err: unknown) {
      setAnswer(`⚠️ ${getErrorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {answer ? (
        // Conversation Mode
        <div className="conversation-container">
          <div className="message-bubble user-message">
            <p>{q}</p>
          </div>
          <div className="message-bubble umbil-message">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{answer}</ReactMarkdown>
            <div className="evidence-pill">Evidence: High</div>
            <div className="sources-line">Sources: NICE, SIGN</div>
            {/* Actions will be added in a later part */}
          </div>
          <div className="ask-bar-container sticky">
            <input
              className="ask-bar-input"
              placeholder="Ask a follow-up question..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask()}
            />
            <button className="ask-bar-send-button" onClick={ask} disabled={loading}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>
        </div>
      ) : (
        // Home Screen
        <div className="hero">
          <h1 className="hero-headline">Smarter medicine starts here.</h1>

          <div className="ask-bar-container">
            <input
              className="ask-bar-input"
              placeholder="Ask anything — clinical, reflective, or educational..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask()}
            />
            <button className="ask-bar-send-button" onClick={ask} disabled={loading}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>

          <p className="disclaimer">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4M12 8h.01"></path></svg>
            Please don’t enter any patient-identifiable information.
          </p>
        </div>
      )}
    </>
  );
}