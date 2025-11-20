// src/components/HomeContent.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from 'next/dynamic'; 
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Toast from "@/components/Toast";
import { addCPD, CPDEntry } from "@/lib/store";
import { useUserEmail } from "@/hooks/useUser";
import { useSearchParams, useRouter } from "next/navigation";
import { getMyProfile, Profile } from "@/lib/profile";
import { supabase } from "@/lib/supabase";
import { useCpdStreaks } from "@/hooks/useCpdStreaks";

// Define dynamic components
const ReflectionModal = dynamic(() => import('@/components/ReflectionModal'));
const QuickTour = dynamic(() => import('@/components/QuickTour'));

// --- Types ---

type AnswerStyle = "clinic" | "standard" | "deepDive";

const styleDisplayNames: Record<AnswerStyle, string> = {
  clinic: "Clinic",
  standard: "Standard",
  deepDive: "Deep Dive",
};

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

// --- Helper Components ---

function TourWelcomeModal({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center', padding: '32px' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>👋</div>
        <h2 style={{ marginBottom: '12px', fontSize: '1.5rem' }}>Welcome to Umbil</h2>
        <p style={{ color: 'var(--umbil-muted)', marginBottom: '24px', lineHeight: '1.5' }}>
          Your new clinical co-pilot is ready. Would you like a 60-second tour of the key features?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button className="btn btn--primary" onClick={onStart} style={{ width: '100%' }}>
            Take the Tour
          </button>
          <button className="btn btn--outline" onClick={onSkip} style={{ width: '100%' }}>
            Skip for Now
          </button>
        </div>
      </div>
    </div>
  );
}

const AnswerStyleDropdown: React.FC<{
  currentStyle: AnswerStyle;
  onStyleChange: (style: AnswerStyle) => void;
}> = ({ currentStyle, onStyleChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (style: AnswerStyle) => {
    onStyleChange(style);
    setIsOpen(false);
  };

  return (
    <div id="tour-highlight-style-dropdown" className="style-dropdown-container" ref={dropdownRef}>
      <button
        className="style-dropdown-button"
        onClick={() => setIsOpen(!isOpen)}
        title="Change answer style"
      >
        {styleDisplayNames[currentStyle]}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.7 }}>
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {isOpen && (
        <div className="style-dropdown-menu">
          <button
            className={currentStyle === "standard" ? "active" : ""}
            onClick={() => handleSelect("standard")}
          >
            <strong>Standard</strong>
            <p>Balanced, detailed answer.</p>
          </button>
          <button
            className={currentStyle === "clinic" ? "active" : ""}
            onClick={() => handleSelect("clinic")}
          >
            <strong>Clinic</strong>
            <p>Concise, bulleted key actions.</p>
          </button>
          <button
            className={currentStyle === "deepDive" ? "active" : ""}
            onClick={() => handleSelect("deepDive")}
          >
            <strong>Deep Dive</strong>
            <p>Comprehensive, in-depth explanation.</p>
          </button>
        </div>
      )}
    </div>
  );
};

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

// --- DUMMY TOUR CONTENT ---
const DUMMY_TOUR_CONVERSATION: ConversationEntry[] = [
  {
    type: "user",
    content: "What are the red flags for a headache?",
    question: "What are the red flags for a headache?",
  },
  {
    type: "umbil",
    content: "Key red flags for headache include:\n\n* **S**ystemic symptoms (fever, weight loss)\n* **N**eurological deficits\n* **O**nset (sudden, thunderclap)\n* **O**lder age (new onset >50 years)\n* **P**attern change or positional",
    question: "What are the red flags for a headache?",
  }
];

const DUMMY_CPD_ENTRY = {
  question: "What are the red flags for a headache?",
  answer: "Key red flags for headache include:\n\n* **S**ystemic symptoms (fever, weight loss)\n* **N**eurological deficits\n* **O**nset (sudden, thunderclap)\n* **O**lder age (new onset >50 years)\n* **P**attern change or positional",
};

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

  // FIX: Get 'loading' state from useUserEmail
  const { email, loading: userLoading } = useUserEmail();
  const searchParams = useSearchParams();
  const router = useRouter(); 
  const [profile, setProfile] = useState<Profile | null>(null);

  const { currentStreak, loading: streakLoading } = useCpdStreaks();

  const [answerStyle, setAnswerStyle] = useState<AnswerStyle>("standard");
  
  // --- TOUR STATE ---
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0); 
  // ---------------------

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

  // --- START TOUR LOGIC (Combined) ---
  useEffect(() => {
    // FIX: Return early if auth is still loading to prevent premature redirect
    if (userLoading) return;

    if (searchParams.get("new-chat")) {
      setConversation([]);
    }

    const checkTour = () => {
      const justLoggedIn = sessionStorage.getItem("justLoggedIn") === "true";
      const hasCompletedTour = localStorage.getItem("hasCompletedQuickTour") === "true";
      const forceTour = searchParams.get("tour") === "true" && searchParams.get("forceTour") === "true";

      if (forceTour) {
        setIsTourOpen(true);
        setTourStep(0);
      } else if (justLoggedIn && !hasCompletedTour) {
        setShowWelcomeModal(true);
      }

      if (justLoggedIn) {
        sessionStorage.removeItem("justLoggedIn");
      }
    };

    if (searchParams.get("tour")) {
      if (!email) {
        router.push("/auth"); 
        return;
      }
      checkTour();
    } else {
      checkTour();
    }
    
  }, [searchParams, email, router, userLoading]); // Added userLoading dependency

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

  // --- TOUR HANDLERS ---

  const handleStartTour = () => {
    setShowWelcomeModal(false);
    setIsTourOpen(true);
    setTourStep(0);
  };

  const handleSkipTour = () => {
    setShowWelcomeModal(false);
    localStorage.setItem("hasCompletedQuickTour", "true"); 
  };

  const handleTourStepChange = useCallback((stepIndex: number) => {
    setTourStep(stepIndex); 
    
    if (stepIndex === 4) {
      setCurrentCpdEntry(DUMMY_CPD_ENTRY); 
      setIsModalOpen(true);
    } else if (isModalOpen) {
      setIsModalOpen(false);
    }

    if (stepIndex === 6) {
      const menuButton = document.getElementById("tour-highlight-sidebar-button");
      menuButton?.click(); 
    }
  }, [isModalOpen]); 

  const handleTourClose = useCallback(() => {
    setIsTourOpen(false);
    setTourStep(0); 
    setIsModalOpen(false); 
    setCurrentCpdEntry(null);
    localStorage.setItem("hasCompletedQuickTour", "true");
    
    const sidebar = document.querySelector('.sidebar.is-open');
    if (sidebar) {
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
       const closeButton = sidebar.querySelector('.sidebar-header button') as any;
       closeButton?.click();
    }
  }, []);


  // --- API & Chat Logic ---
  const fetchUmbilResponse = async (
    currentConversation: ConversationEntry[],
    styleOverride: AnswerStyle | null = null
  ) => {
    setLoading(true);
    const lastUserQuestion = [...currentConversation].reverse().find((e) => e.type === "user")?.question;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const messagesToSend: ClientMessage[] = currentConversation.map((entry) => ({
          role: entry.type === "user" ? "user" : "assistant",
          content: entry.content,
      }));
      
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
          answerStyle: styleToUse,
        }),
      });

      if (!res.ok) {
        const data: AskResponse = await res.json();
        throw new Error(data.error || "Request failed");
      }

      const contentType = res.headers.get("Content-Type");

      if (contentType?.includes("application/json")) {
        const data: AskResponse = await res.json();
        setConversation((prev) => [
          ...prev,
          { type: "umbil", content: data.answer ?? "", question: lastUserQuestion },
        ]);
      } 
      else if (contentType?.includes("text/plain")) {
        if (!res.body) throw new Error("Response body is empty.");
        setConversation((prev) => [
          ...prev,
          { type: "umbil", content: "", question: lastUserQuestion },
        ]);
        
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break; 
          const chunk = decoder.decode(value);
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
    if (!q.trim() || loading || isTourOpen) return;
    const newQuestion = q;
    setQ("");
    const updatedConversation: ConversationEntry[] = [
      ...conversation,
      { type: "user", content: newQuestion, question: newQuestion },
    ];
    setConversation(updatedConversation);
    scrollToBottom(true);
    await fetchUmbilResponse(updatedConversation, null); 
  };

  // --- Utility Handlers ---

  const convoToShow = isTourOpen && tourStep >= 2 ? DUMMY_TOUR_CONVERSATION : conversation;

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
      .then(() => setToastMessage("Copied to clipboard!"))
      .catch((err) => {
        console.error(err);
        setToastMessage("❌ Failed to copy text.");
      });
  };

  const handleShare = async () => {
    const textContent = convoToShow.map((entry) => {
        const prefix = entry.type === "user" ? "You" : "Umbil";
        return `${prefix}:\n${entry.content}\n\n--------------------\n`;
      }).join("\n");

    if (navigator.share) {
      try {
        await navigator.share({ title: "Umbil Conversation", text: textContent });
      } catch (err) { console.log(err); }
    } else {
       // Fallback download
       const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
       const url = URL.createObjectURL(blob);
       const a = document.createElement("a");
       a.href = url;
       a.download = "umbil_conversation.txt";
       document.body.appendChild(a);
       a.click();
       document.body.removeChild(a);
       setToastMessage("Conversation downloading...");
    }
  };

  const handleRegenerateResponse = async () => {
    if (loading || conversation.length === 0 || isTourOpen) return;
    const lastEntry = conversation[conversation.length - 1];
    if (lastEntry.type !== "umbil") return;
    const conversationForRegen = conversation.slice(0, -1);
    setConversation(conversationForRegen);
    await fetchUmbilResponse(conversationForRegen, null);
  };
  
  const handleDeepDive = async (entry: ConversationEntry, index: number) => {
    if (loading || isTourOpen) return;
    if (!entry.question) {
        setToastMessage("❌ Cannot deep-dive on this message.");
        return;
    }
    const historyForDeepDive = conversation.slice(0, index);
    await fetchUmbilResponse(historyForDeepDive, 'deepDive');
  };

  const handleOpenAddCpdModal = (entry: ConversationEntry) => {
    if (isTourOpen) return;
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
    if (isTourOpen) {
      handleTourStepChange(5); // Go to Step 5 (PDP Info)
      return;
    }

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
      setToastMessage("❌ Failed to save CPD entry.");
    } else {
      setToastMessage("✅ CPD entry saved remotely!");
    }
    setIsModalOpen(false);
    setCurrentCpdEntry(null);
  };

  // --- Render Message Function ---

  const renderMessage = (entry: ConversationEntry, index: number) => {
    const isUmbil = entry.type === "umbil";
    const isLastMessage = index === convoToShow.length - 1;
    const className = `message-bubble ${isUmbil ? "umbil-message" : "user-message"}`;
    const highlightId = isTourOpen && isUmbil ? "tour-highlight-message" : undefined;

    return (
      <div key={index} id={highlightId} className={className}>
        {isUmbil ? (
          <div className="markdown-content-wrapper">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                table: ({ ...props }) => <div className="table-scroll-wrapper"><table {...props} /></div>,
              }}
            >
              {entry.content}
            </ReactMarkdown>
          </div>
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.content}</ReactMarkdown>
        )}

        {isUmbil && (
          <div className="umbil-message-actions">
            <button className="action-button" onClick={handleShare} title="Share conversation">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
              Share
            </button>

            <button className="action-button" onClick={() => handleCopyMessage(entry.content)} title="Copy this message">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              Copy
            </button>
            
            {isLastMessage && !loading && entry.question && (
              <button className="action-button" onClick={() => handleDeepDive(entry, index)} title="Deep dive on this topic">
                <svg className="icon-zoom-in" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                Deep Dive
              </button>
            )}

            {isLastMessage && !loading && (
              <button className="action-button" onClick={handleRegenerateResponse} title="Regenerate response">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"></polyline><polyline points="23 20 23 14 17 14"></polyline><path d="M20.49 9A9 9 0 0 0 7.1 4.14M3.51 15A9 9 0 0 0 16.9 19.86"></path></svg>
                Regenerate
              </button>
            )}

            <button
              id={isTourOpen ? "tour-highlight-cpd-button" : undefined}
              className="action-button"
              onClick={() => isTourOpen ? handleTourStepChange(5) : handleOpenAddCpdModal(entry)}
              title="Add reflection to your CPD log"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg>
              Log learning (CPD)
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {isTourOpen && (
        <QuickTour 
          isOpen={isTourOpen}
          currentStep={tourStep} 
          onClose={handleTourClose}
          onStepChange={handleTourStepChange}
        />
      )}

      <div ref={scrollContainerRef} className="main-content">
        {(convoToShow.length > 0) ? (
          <>
            <div className="conversation-container">
              <div className="message-thread">
                {convoToShow.map(renderMessage)}
                {loading && (
                  <div className="loading-indicator">
                    {loadingMsg}<span>•</span><span>•</span><span>•</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            <div className="sticky-input-wrapper">
              <div id="tour-highlight-askbar" className="ask-bar-container" style={{ marginTop: 0, maxWidth: '800px', position: 'relative' }}>
                <input
                  className="ask-bar-input"
                  placeholder="Ask anything..."
                  value={isTourOpen ? "What are the red flags for a headache?" : q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && ask()}
                  disabled={isTourOpen} 
                  style={{ paddingRight: '150px' }} 
                />
                <AnswerStyleDropdown
                  currentStyle={answerStyle}
                  onStyleChange={setAnswerStyle}
                />
                <button
                  className="ask-bar-send-button"
                  onClick={isTourOpen ? () => handleTourStepChange(2) : ask} 
                  disabled={loading}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="hero">
            <h1 className="hero-headline">Smarter medicine starts here.</h1>
            <div id="tour-highlight-askbar" className="ask-bar-container" style={{ marginTop: "24px", position: 'relative' }}>
              <input
                className="ask-bar-input"
                placeholder="Ask anything..."
                value={isTourOpen ? "What are the red flags for a headache?" : q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && ask()}
                disabled={isTourOpen}
                style={{ paddingRight: '150px' }}
              />
              <AnswerStyleDropdown
                currentStyle={answerStyle}
                onStyleChange={setAnswerStyle}
              />
              <button
                className="ask-bar-send-button"
                onClick={isTourOpen ? () => handleTourStepChange(2) : ask}
                disabled={loading}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </div>
            <p className="disclaimer" style={{ marginTop: "36px" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4M12 8h.01"></path></svg>
              Please don’t enter any patient-identifiable information.
            </p>
          </div>
        )}
      </div>

      {showWelcomeModal && (
        <TourWelcomeModal onStart={handleStartTour} onSkip={handleSkipTour} />
      )}

      {(isModalOpen || (isTourOpen && tourStep === 4)) && (
        <div id={isTourOpen && tourStep === 4 ? "tour-highlight-modal" : undefined}>
          <ReflectionModal
            isOpen={isModalOpen}
            onClose={isTourOpen ? () => {} : () => setIsModalOpen(false)}
            onSave={handleSaveCpd}
            currentStreak={streakLoading ? 0 : currentStreak}
            cpdEntry={isTourOpen ? DUMMY_CPD_ENTRY : currentCpdEntry}
          />
        </div>
      )}
      
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </>
  );
}