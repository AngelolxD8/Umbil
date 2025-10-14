// src/app/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ReflectionModal from "@/components/ReflectionModal";
import Toast from "@/components/Toast";
import { addCPD, CPDEntry } from "@/lib/store";
import { useUserEmail } from "@/hooks/useUser";

type AskResponse = { answer?: string; error?: string };
type ConversationEntry = { type: "user" | "umbil"; content: string; question?: string };

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCpdEntry, setCurrentCpdEntry] = useState<Omit<CPDEntry, "reflection" | "tags"> | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { email } = useUserEmail();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [conversation]);

  const ask = async () => {
    if (!q.trim() || loading) return;

    const newQuestion = q;
    setQ("");
    setLoading(true);
    setConversation((prev) => [...prev, { type: "user", content: newQuestion, question: newQuestion }]);

    try {
      // Build the message history for the API call
      const messages = conversation.map(entry => ({
        role: entry.type === "user" ? "user" : "assistant",
        content: entry.content
      }));
      messages.push({ role: "user", content: newQuestion });

      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, tone: "conversational" }),
      });

      const data: AskResponse = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");

      setConversation((prev) => [
        ...prev,
        { type: "umbil", content: data.answer ?? "", question: newQuestion },
      ]);
    } catch (err: unknown) {
      setConversation((prev) => [...prev, { type: "umbil", content: `⚠️ ${getErrorMessage(err)}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToCPD = (entry: ConversationEntry) => {
    if (!email) {
      setToastMessage("Please sign in to save CPD entries.");
      return;
    }
    const cpd: Omit<CPDEntry, "reflection" | "tags"> = {
      timestamp: new Date().toISOString(),
      question: entry.question || "",
      answer: entry.content,
    };
    addCPD(cpd);
    setToastMessage("✅ Saved to CPD");
  };

  const handleOpenReflectionModal = (entry: ConversationEntry) => {
    if (!email) {
      setToastMessage("Please sign in to add a reflection.");
      return;
    }
    setCurrentCpdEntry({
      timestamp: new Date().toISOString(),
      question: entry.question || "",
      answer: entry.content,
    });
    setIsModalOpen(true);
  };

  const handleSaveReflection = (reflection: string, tags: string[]) => {
    if (currentCpdEntry) {
      const cpdEntry = { ...currentCpdEntry, reflection, tags };
      addCPD(cpdEntry);
      setToastMessage("✅ Reflection saved to CPD");
    }
  };

  const renderMessage = (entry: ConversationEntry, index: number) => {
    const isUmbil = entry.type === "umbil";
    const className = `message-bubble ${isUmbil ? "umbil-message" : "user-message"}`;

    return (
      <div key={index} className={className}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.content}</ReactMarkdown>
        {isUmbil && (
          <div className="umbil-message-actions">
            <button className="action-button" onClick={() => handleSaveToCPD(entry)}>Save to CPD</button>
            <button className="action-button" onClick={() => handleOpenReflectionModal(entry)}>Reflect</button>
          </div>
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

          <p className="disclaimer" style={{ marginTop: '36px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4M12 8h.01"></path></svg>
            Please don’t enter any patient-identifiable information.
          </p>
        </div>
      )}
      <ReflectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveReflection}
      />
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </>
  );
}