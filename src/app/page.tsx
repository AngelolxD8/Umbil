// src/app/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type AskResponse = { answer?: string; error?: string };
type ConversationEntry = { type: "user" | "umbil"; content: string };

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
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [conversation]);

  const ask = async () => {
    if (!q.trim() || loading) return;

    const newQuestion = q;
    setQ("");
    setLoading(true);
    setConversation((prev) => [...prev, { type: "user", content: newQuestion }]);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: newQuestion, tone: "conversational" }),
      });

      const data: AskResponse = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");

      setConversation((prev) => [...prev, { type: "umbil", content: data.answer ?? "" }]);
    } catch (err: unknown) {
      setConversation((prev) => [...prev, { type: "umbil", content: `⚠️ ${getErrorMessage(err)}` }]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = (entry: ConversationEntry, index: number) => {
    const isUmbil = entry.type === "umbil";
    const className = `message-bubble ${isUmbil ? "umbil-message" : "user-message"}`;
    return (
      <div key={index} className={className}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.content}</ReactMarkdown>
        {isUmbil && (
          <>
            <div className="evidence-pill">Evidence: High</div>
            <div className="sources-line">Sources: NICE, SIGN</div>
            {/* Actions will be added in a later part */}
          </>
        )}
      </div>
    );
  };

  return (
    <>
      {conversation.length > 0 ? (
        // Conversation Mode
        <div className="conversation-container">
          <div className="message-thread">
            {conversation.map(renderMessage)}
            {loading && (
              <div className="loading-indicator">
                <span>•</span>
                <span>•</span>
                <span>•</span>
              </div>
            )}
            <div ref={messagesEndRef} />
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