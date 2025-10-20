// src/components/HomeContent.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ReflectionModal from "@/components/ReflectionModal";
import Toast from "@/components/Toast";
import { addCPD, CPDEntry } from "@/lib/store";
import { useUserEmail } from "@/hooks/useUser";
import { useSearchParams } from "next/navigation";
import { getMyProfile, Profile } from "@/lib/profile";

type AskResponse = { answer?: string; error?: string };
type ConversationEntry = { type: "user" | "umbil"; content: string; question?: string };

// Define a type for a message to be sent to the API
type ClientMessage = {
  role: "user" | "assistant";
  content: string;
};

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return "Unknown error";
  }
}

const loadingMessages = [
  "Umbil is thinking...",
  "Consulting the guidelines...",
  "Synthesizing clinical data...",
  "Almost there...",
  "Crafting your response...",
];

export default function HomeContent() {
  const [q, setQ] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  // New state to hold the actively streaming text from Umbil
  const [streamingText, setStreamingText] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCpdEntry, setCurrentCpdEntry] = useState<Omit<CPDEntry, "reflection" | "tags"> | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { email } = useUserEmail();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const userProfile = await getMyProfile();
      setProfile(userProfile);
    };
    if (email) {
      fetchProfile();
    }
  }, [email]);

  useEffect(() => {
    if (searchParams.get("new-chat")) {
      setConversation([]);
    }
  }, [searchParams]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll whenever conversation or streamingText updates
  useEffect(scrollToBottom, [conversation, streamingText]);

  // Removed dynamic loading message interval as streaming will replace the wait time.
  // The 'loading' state is still used to disable the input.

  const ask = async () => {
    if (!q.trim() || loading) return;

    const newQuestion = q;
    setQ("");
    setLoading(true);

    // 1. Add User message to conversation immediately
    const updatedConversation: ConversationEntry[] = [
      ...conversation,
      { type: "user", content: newQuestion, question: newQuestion }
    ];
    setConversation(updatedConversation);
    setStreamingText(""); // Clear previous streaming text

    try {
      // Prepare message history for API (Lightweight Session Memory)
      const historyForApi: ClientMessage[] = conversation.map(entry => ({
        role: entry.type === "umbil" ? "assistant" : "user",
        content: entry.content
      }));

      const allMessages = [...historyForApi, { role: "user", content: newQuestion }];
      const MAX_HISTORY_MESSAGES = 10;
      const messagesToSend = allMessages.slice(-MAX_HISTORY_MESSAGES);
      
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messagesToSend, profile, tone: "conversational" }),
      });

      if (!res.ok || !res.body) {
        let errorMsg = "Request failed.";
        try {
          const data: AskResponse = await res.json();
          errorMsg = data.error || errorMsg;
        } catch {
          // If JSON parse fails, use status text
          errorMsg = res.statusText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      // 2. Read the stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullAnswer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullAnswer += chunk;
        setStreamingText(fullAnswer); // Update streaming state with each chunk
      }

      // 3. Finalize: Commit the full answer to the conversation and clear streaming text
      setConversation((prev) => [
        ...prev,
        { type: "umbil", content: fullAnswer, question: newQuestion },
      ]);
      setStreamingText("");

    } catch (err: unknown) {
      setConversation((prev) => [...prev, { type: "umbil", content: `⚠️ ${getErrorMessage(err)}` }]);
      setStreamingText("");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddCpdModal = (entry: ConversationEntry) => {
    if (!email) {
      setToastMessage("Please sign in to add CPD entries.");
      return;
    }
    setCurrentCpdEntry({
      timestamp: new Date().toISOString(),
      question: entry.question || "",
      answer: entry.content,
    });
    setIsModalOpen(true);
  };

  const handleSaveCpd = (reflection: string, tags: string[]) => {
    if (currentCpdEntry) {
      const cpdEntry = { ...currentCpdEntry, reflection, tags };
      addCPD(cpdEntry);
      setToastMessage("✅ CPD entry saved!");
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
            <button className="action-button" onClick={() => handleOpenAddCpdModal(entry)}>Add to CPD</button>
          </div>
        )}
      </div>
    );
  };

  // Render the conversation and the live streaming message
  const renderConversation = () => {
    const allMessages = [...conversation];
    if (streamingText) {
      // Add a temporary 'umbil' message for the streaming content
      allMessages.push({ type: "umbil", content: streamingText, question: "" });
    }

    return (
      <div className="conversation-container">
        <div className="message-thread">
          {allMessages.map(renderMessage)}
          {loading && streamingText === '' && (
            // Only show loading dots if we are waiting for the *first* chunk of the response
            <div className="loading-indicator">
              Umbil is thinking...
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
    );
  }

  return (
    <>
      {conversation.length > 0 || streamingText ? (
        renderConversation()
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
        onSave={handleSaveCpd}
      />
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </>
  );
}