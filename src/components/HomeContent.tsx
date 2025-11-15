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
import { supabase } from "@/lib/supabase";
import { useCpdStreaks } from "@/hooks/useCpdStreaks";

// --- Types ---

type AnswerStyle = "clinic" | "standard" | "deepDive";

type AskResponse = {
  answer?: string;
  error?: string;
};

type ConversationEntry = {
  type: "user" | "umbil";
  content: string;
  question?: string;
};

type ClientMessage = {
  role: "user" | "assistant";
  content: string;
};

// --- NEW: Answer Style Button Component ---
const AnswerStyleSelector: React.FC<{
  currentStyle: AnswerStyle;
  onStyleChange: (style: AnswerStyle) => void;
}> = ({ currentStyle, onStyleChange }) => {
  return (
    <div className="answer-style-selector">
      <button
        className={`btn--style ${currentStyle === "clinic" ? "active" : ""}`}
        onClick={() => onStyleChange("clinic")}
        title="Concise bullets: 4-6 key points for quick reading."
      >
        Clinic
      </button>
      <button
        className={`btn--style ${currentStyle === "standard" ? "active" : ""}`}
        onClick={() => onStyleChange("standard")}
        title="Standard balanced answer (default)."
      >
        Standard
      </button>
      <button
        className={`btn--style ${currentStyle === "deepDive" ? "active" : ""}`}
        onClick={() => onStyleChange("deepDive")}
        title="Comprehensive details suitable for teaching or in-depth learning."
      >
        Deep Dive
      </button>
    </div>
  );
};
// --- END: Answer Style Button Component ---

// --- NEW: Local Trust Input Component ---
const LocalTrustInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
}> = ({ value, onChange }) => {
  return (
    <div className="local-trust-container">
      <input
        type="text"
        className="local-trust-input"
        placeholder="Optional: Enter NHS Board / ICB / Trust for local guidance..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};
// --- END: Local Trust Input Component ---


// --- Helpers ---

const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  if (
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof (err as { message: unknown }).message === "string"
  ) {
    return (err as { message: string }).message;
  }
  if (typeof err === "string") return err;
  return "An unexpected error occurred.";
};

const loadingMessages = [
  "Umbil is thinking...",
  "Consulting the guidelines...",
  "Synthesizing clinical data...",
  "Checking local formularies...",
  "Almost there...",
  "Crafting your response...",
];

// --- Component ---

export default function HomeContent() {
  const [q, setQ] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMsg, setLoadingMsg] = useState(loadingMessages[0]);
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [currentCpdEntry, setCurrentCpdEntry] = useState<{
    question: string;
    answer: string;
  } | null>(null);
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { email } = useUserEmail();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);

  const { currentStreak, loading: streakLoading } = useCpdStreaks();

  const [answerStyle, setAnswerStyle] = useState<AnswerStyle>("standard");
  const [localTrust, setLocalTrust] = useState<string>(""); // <-- NEW STATE FOR LOCAL TRUST

  // --- Effects ---

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

  const scrollToBottom = (instant = false) => {
    const container = document.querySelector(".main-content");
    if (container) {
      const isNearBottom =
        container.scrollHeight - container.scrollTop <
        container.clientHeight + 200;
      if (isNearBottom || instant) {
        messagesEndRef.current?.scrollIntoView({
          behavior: instant ? "auto" : "smooth",
        });
      }
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => scrollToBottom(), 50);
    return () => clearTimeout(timeoutId);
  }, [conversation]);

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingMsg((prevMsg) => {
          const currentIndex = loadingMessages.indexOf(prevMsg);
          const nextIndex = (currentIndex + 1) % loadingMessages.length;
          return loadingMessages[nextIndex];
        });
      }, 2000);
      return () => clearInterval(interval);
    } else {
      setLoadingMsg(loadingMessages[0]);
    }
  }, [loading]);

  // --- Core API Logic ---

  /**
   * Fetches a response from the API.
   * @param currentConversation The conversation history to send.
   * @param styleOverride (Optional) Force a specific answer style for this request.
   */
  const fetchUmbilResponse = async (
    currentConversation: ConversationEntry[],
    styleOverride: AnswerStyle | null = null // <-- NEW: Allow style override
  ) => {
    setLoading(true);
    
    const lastUserQuestion = [...currentConversation]
      .reverse()
      .find((e) => e.type === "user")?.question;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const messagesToSend: ClientMessage[] = currentConversation.map(
        (entry) => ({
          role: entry.type === "user" ? "user" : "assistant",
          content: entry.content,
        })
      );
      
      // Use the override if provided, otherwise use the state
      const styleToUse = styleOverride || answerStyle;

      const res = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ 
          messages: messagesToSend, 
          profile, 
          answerStyle: styleToUse, // <-- Use the determined style
          localTrust: localTrust.trim() || null 
        }),
      });

      if (!res.ok) {
        const data: AskResponse = await res.json();
        throw new Error(data.error || "Request failed");
      }

      const contentType = res.headers.get("Content-Type");

      if (contentType?.includes("application/json")) {
        // Handle non-streamed (cached) response
        const data: AskResponse = await res.json();
        setConversation((prev) => [
          ...prev,
          {
            type: "umbil",
            content: data.answer ?? "",
            question: lastUserQuestion,
          },
        ]);
      } 
      else if (contentType?.includes("text/plain")) {
        // Handle streamed response
        if (!res.body) {
          throw new Error("Response body is empty for streaming.");
        }
        
        // Add a new, empty message bubble to stream into
        setConversation((prev) => [
          ...prev,
          {
            type: "umbil",
            content: "", 
            question: lastUserQuestion,
          },
        ]);
        
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break; 
          
          const chunk = decoder.decode(value);
          
          // Append the chunk to the *last* message bubble in the conversation
          setConversation((prev) => {
            const newConversation = [...prev];
            const lastMessage = newConversation[newConversation.length - 1];
            if (lastMessage && lastMessage.type === "umbil") {
              lastMessage.content += chunk;
            }
            return newConversation;
          });
        }
      } else {
        throw new Error(`Unexpected Content-Type: ${contentType}`);
      }

    } catch (err: unknown) {
      setConversation((prev) => [
        ...prev,
        { type: "umbil", content: `⚠️ ${getErrorMessage(err)}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const ask = async () => {
    if (!q.trim() || loading) return;

    const newQuestion = q;
    setQ("");

    const updatedConversation: ConversationEntry[] = [
      ...conversation,
      { type: "user", content: newQuestion, question: newQuestion },
    ];

    setConversation(updatedConversation);
    scrollToBottom(true);
    // Call with no style override (uses state)
    await fetchUmbilResponse(updatedConversation, null); 
  };

  // --- Action Button Handlers ---

  const handleCopyMessage = (content: string) => {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        setToastMessage("Copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
        setToastMessage("❌ Failed to copy text.");
      });
  };

  const formatConversationAsText = (): string => {
    return conversation
      .map((entry) => {
        const prefix = entry.type === "user" ? "You" : "Umbil";
        return `${prefix}:\n${entry.content}\n\n--------------------\n`;
      })
      .join("\n");
  };

  const downloadConversationAsTxt = () => {
    const textContent = formatConversationAsText();
    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "umbil_conversation.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastMessage("Conversation downloading...");
  };

  const handleShare = async () => {
    const textContent = formatConversationAsText();

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Umbil Conversation",
          text: textContent,
        });
      } catch (err) {
        console.log("Share API error or cancelled:", err);
      }
    } else {
      downloadConversationAsTxt();
    }
  };

  const handleRegenerateResponse = async () => {
    if (loading || conversation.length === 0) return;

    const lastEntry = conversation[conversation.length - 1];
    if (lastEntry.type !== "umbil") return;

    // Get conversation *before* the last Umbil response
    const conversationForRegen = conversation.slice(0, -1);
    
    // Set the state to this truncated conversation
    setConversation(conversationForRegen);
    
    // Fetch a new response based on the truncated history
    await fetchUmbilResponse(conversationForRegen, null);
  };
  
  // --- NEW: Deep Dive Handler ---
  const handleDeepDive = async (entry: ConversationEntry, index: number) => {
    if (loading) return;
    
    const originalQuestion = entry.question;
    
    if (!originalQuestion) {
        setToastMessage("❌ Cannot deep-dive on this message.");
        return;
    }
    
    // Get the conversation history *up to and including* the user prompt that generated this answer
    // The 'entry' is at 'index', so the user question is at 'index - 1'
    // We slice up to 'index' (exclusive of 'index') to get [User, Umbil, User]
    const historyForDeepDive = conversation.slice(0, index);

    // Call fetchUmbilResponse, passing the truncated history and forcing the 'deepDive' style
    await fetchUmbilResponse(historyForDeepDive, 'deepDive');
  };
  // --- END: Deep Dive Handler ---


  // --- CPD Handlers ---

  const handleOpenAddCpdModal = (entry: ConversationEntry) => {
    if (!email) {
      setToastMessage("Please sign in to add CPD entries.");
      return;
    }
    setCurrentCpdEntry({
      question: entry.question || "", 
      answer: entry.content,
    });
    setIsModalOpen(true);
  };

  const handleSaveCpd = async (reflection: string, tags: string[]) => {
    if (!currentCpdEntry) return;

    const cpdEntry: Omit<CPDEntry, 'id' | 'user_id'> = { 
      timestamp: new Date().toISOString(),
      question: currentCpdEntry.question,
      answer: currentCpdEntry.answer,
      reflection,
      tags 
    };
    
    const { error } = await addCPD(cpdEntry);

    if (error) {
      console.error("Failed to save CPD entry:", error);
      setToastMessage(
        "❌ Failed to save CPD entry. Please check the console for details."
      );
    } else {
      setToastMessage("✅ CPD entry saved remotely!");
    }

    setIsModalOpen(false);
    setCurrentCpdEntry(null);
  };

  // --- Render Logic ---

  const renderMessage = (entry: ConversationEntry, index: number) => {
    const isUmbil = entry.type === "umbil";
    const isLastMessage = index === conversation.length - 1;
    const className = `message-bubble ${
      isUmbil ? "umbil-message" : "user-message"
    }`;

    return (
      <div key={index} className={className}>
        {isUmbil ? (
          <div className="markdown-content-wrapper">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                table: ({ ...props }) => (
                  <div className="table-scroll-wrapper">
                    <table {...props} />
                  </div>
                ),
              }}
            >
              {entry.content}
            </ReactMarkdown>
          </div>
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {entry.content}
          </ReactMarkdown>
        )}

        {isUmbil && (
          <div className="umbil-message-actions">
            <button
              className="action-button"
              onClick={handleShare}
              title="Share conversation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
              Share
            </button>

            <button
              className="action-button"
              onClick={() => handleCopyMessage(entry.content)}
              title="Copy this message"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              Copy
            </button>
            
            {/* --- NEW: Deep Dive Button --- */}
            {/* Show if it's the last message, not loading, AND has a question */}
            {isLastMessage && !loading && entry.question && (
              <button
                className="action-button"
                onClick={() => handleDeepDive(entry, index)}
                title="Deep dive on this topic"
              >
                <svg className="icon-zoom-in" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                Deep Dive
              </button>
            )}
            {/* --- END: Deep Dive Button --- */}

            {isLastMessage && !loading && (
              <button
                className="action-button"
                onClick={handleRegenerateResponse}
                title="Regenerate response"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"></polyline><polyline points="23 20 23 14 17 14"></polyline><path d="M20.49 9A9 9 0 0 0 7.1 4.14M3.51 15A9 9 0 0 0 16.9 19.86"></path></svg>
                Regenerate
              </button>
            )}

            <button
              className="action-button"
              onClick={() => handleOpenAddCpdModal(entry)}
              title="Add reflection to your CPD log"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg>
              Add to CPD
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div
        ref={scrollContainerRef}
        className="main-content"
      >
        {conversation.length > 0 ? (
          // Conversation Mode
          <>
            <div className="conversation-container">
              <div className="message-thread">
                {conversation.map(renderMessage)}
                {loading && (
                  <div className="loading-indicator">
                    {loadingMsg}
                    <span>•</span>
                    <span>•</span>
                    <span>•</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
            {/* --- STICKY WRAPPER --- */}
            <div className="sticky-input-wrapper">
              <AnswerStyleSelector
                currentStyle={answerStyle}
                onStyleChange={setAnswerStyle}
              />
              <LocalTrustInput value={localTrust} onChange={setLocalTrust} />

              <div className="ask-bar-container" style={{ marginTop: 0, maxWidth: '800px' }}>
                <input
                  className="ask-bar-input"
                  placeholder="Ask a follow-up question..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && ask()}
                />
                <button
                  className="ask-bar-send-button"
                  onClick={ask}
                  disabled={loading}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          // Home Screen
          <div className="hero">
            <h1 className="hero-headline">Smarter medicine starts here.</h1>

            <AnswerStyleSelector
              currentStyle={answerStyle}
              onStyleChange={setAnswerStyle}
            />
            
            <LocalTrustInput value={localTrust} onChange={setLocalTrust} />

            <div className="ask-bar-container" style={{ marginTop: "24px" }}>
              <input
                className="ask-bar-input"
                placeholder="Ask anything — clinical, reflective, or educational..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && ask()}
              />
              <button
                className="ask-bar-send-button"
                onClick={ask}
                disabled={loading}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>

            <p className="disclaimer" style={{ marginTop: "36px" }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 16v-4M12 8h.01"></path>
              </svg>
              Please don’t enter any patient-identifiable information.
            </p>
          </div>
        )}
      </div>

      <ReflectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCpd}
        currentStreak={streakLoading ? 0 : currentStreak}
        cpdEntry={currentCpdEntry}
      />
      
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </>
  );
}