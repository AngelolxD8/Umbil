// src/components/HomeContent.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from 'next/dynamic'; 
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Toast from "@/components/Toast";
import { addCPD, CPDEntry, getConversationMessages, getDeviceId } from "@/lib/store"; 
import { useUserEmail } from "@/hooks/useUser";
import { useSearchParams, useRouter } from "next/navigation";
import { getMyProfile, Profile } from "@/lib/profile";
import { supabase } from "@/lib/supabase";
import { useCpdStreaks } from "@/hooks/useCpdStreaks";
import { v4 as uuidv4 } from 'uuid'; 
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { ToolId, TOOLS_CONFIG } from "@/components/ToolsModal"; 

// --- Dynamic Imports ---
const ReflectionModal = dynamic(() => import('@/components/ReflectionModal'));
const QuickTour = dynamic(() => import('@/components/QuickTour'));
const ToolsModal = dynamic(() => import('@/components/ToolsModal'));
const StreakPopup = dynamic(() => import('@/components/StreakPopup'));

// --- Types ---
type AnswerStyle = "clinic" | "standard" | "deepDive";
type AskResponse = { answer?: string; error?: string; };
type ConversationEntry = { type: "user" | "umbil"; content: string; question?: string; };
type ClientMessage = { role: "user" | "assistant"; content: string; };

const styleDisplayNames: Record<AnswerStyle, string> = { clinic: "Clinic", standard: "Standard", deepDive: "Deep Dive" };
const loadingMessages = ["Umbil is thinking...", "Consulting the guidelines...", "Synthesizing clinical data...", "Checking local formularies...", "Almost there...", "Crafting your response..."];

const DUMMY_TOUR_CONVERSATION: ConversationEntry[] = [
  { type: "user", content: "What are the red flags for a headache?", question: "What are the red flags for a headache?" },
  { type: "umbil", content: "Key red flags for headache include:\n\n* **S**ystemic symptoms (fever, weight loss)\n* **N**eurological deficits\n* **O**nset (sudden, thunderclap)\n* **O**lder age (new onset >50 years)\n* **P**attern change or positional", question: "What are the red flags for a headache?" }
];
const DUMMY_CPD_ENTRY = { question: "What are the red flags for a headache?", answer: "Key red flags for headache include:\n\n* **S**ystemic symptoms (fever, weight loss)\n* **N**eurological deficits\n* **O**nset (sudden, thunderclap)\n* **O**lder age (new onset >50 years)\n* **P**attern change or positional" };

// --- Sub-components ---

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
          <button className="btn btn--primary" onClick={onStart} style={{ width: '100%' }}>Take the Tour</button>
          <button className="btn btn--outline" onClick={onSkip} style={{ width: '100%' }}>Skip for Now</button>
        </div>
      </div>
    </div>
  );
}

// --- NEW TOOLS DROPDOWN ---
const ToolsDropdown: React.FC<{ onSelect: (toolId: ToolId) => void }> = ({ onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (id: ToolId) => { onSelect(id); setIsOpen(false); };
  
  return (
    <div id="tour-highlight-tools-dropdown" className="style-dropdown-container" ref={dropdownRef}>
      <button 
        className="action-icon-btn" 
        title="Medical Tools"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '1.1rem' }}>✨</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Tools</span>
        </div>
      </button>
      
      {isOpen && (
        <div className="style-dropdown-menu" style={{ minWidth: '180px' }}>
          {TOOLS_CONFIG.map((tool) => (
             <button key={tool.id} onClick={() => handleSelect(tool.id)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{tool.label}</span>
             </button>
          ))}
        </div>
      )}
    </div>
  );
};

const AnswerStyleDropdown: React.FC<{ currentStyle: AnswerStyle; onStyleChange: (style: AnswerStyle) => void; }> = ({ currentStyle, onStyleChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (style: AnswerStyle) => { onStyleChange(style); setIsOpen(false); };
  
  return (
    <div id="tour-highlight-style-dropdown" className="style-dropdown-container" ref={dropdownRef}>
      <button className="style-dropdown-button" onClick={() => setIsOpen(!isOpen)} title="Change answer style">
        {styleDisplayNames[currentStyle]}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.7 }}><path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      {isOpen && (
        <div className="style-dropdown-menu">
          <button className={currentStyle === "standard" ? "active" : ""} onClick={() => handleSelect("standard")}><strong>Standard</strong><p>Balanced, concise answer.</p></button>
          <button className={currentStyle === "clinic" ? "active" : ""} onClick={() => handleSelect("clinic")}><strong>Clinic</strong><p>Bullet points, rapid actions.</p></button>
          <button className={currentStyle === "deepDive" ? "active" : ""} onClick={() => handleSelect("deepDive")}><strong>Deep Dive</strong><p>Detailed evidence review.</p></button>
        </div>
      )}
    </div>
  );
};

const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  return "An unexpected error occurred.";
};

type SearchInputAreaProps = {
  q: string;
  setQ: (val: string) => void;
  ask: () => void;
  loading: boolean;
  isTourOpen: boolean;
  isRecording: boolean;
  handleMicClick: () => void;
  answerStyle: AnswerStyle;
  setAnswerStyle: (s: AnswerStyle) => void;
  onToolSelect: (id: ToolId) => void;
  handleTourStepChange: (step: number) => void;
};

const SearchInputArea = ({ 
  q, setQ, ask, loading, isTourOpen, 
  isRecording, handleMicClick, answerStyle, 
  setAnswerStyle, onToolSelect, handleTourStepChange 
}: SearchInputAreaProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Helper to adjust height immediately
  const adjustHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [q, adjustHeight]);

  return (
    <div id="tour-highlight-askbar" className="ask-bar-container-new">
      <textarea
        ref={textareaRef}
        className="ask-bar-textarea"
        placeholder="Ask Umbil anything..."
        value={isTourOpen ? "What are the red flags for a headache?" : q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={adjustHeight}
        onClick={adjustHeight}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            ask();
          }
        }}
        disabled={isTourOpen}
        rows={1}
      />
      
      <div className="ask-bar-actions">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ToolsDropdown onSelect={onToolSelect} />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <AnswerStyleDropdown currentStyle={answerStyle} onStyleChange={setAnswerStyle} />

          <button 
            className={`action-icon-btn ${isRecording ? "recording" : ""}`}
            onClick={handleMicClick}
            disabled={loading || isTourOpen}
            title={isRecording ? "Stop Recording" : "Start Dictation"}
          >
            {isRecording ? (
                <div className="recording-pulse">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                </div>
            ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            )}
          </button>

          <button className="send-icon-btn" onClick={isTourOpen ? () => handleTourStepChange(3) : ask} disabled={loading || !q.trim()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default function HomeContent() {
  const [q, setQ] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMsg, setLoadingMsg] = useState(loadingMessages[0]);
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false); 
  const [selectedTool, setSelectedTool] = useState<ToolId>('referral');
  
  const [currentCpdEntry, setCurrentCpdEntry] = useState<{ question: string; answer: string; } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { email, loading: userLoading } = useUserEmail();
  const searchParams = useSearchParams();
  const router = useRouter(); 
  const [profile, setProfile] = useState<Profile | null>(null);
  
  const { currentStreak, loading: streakLoading, hasLoggedToday, refetch: refetchStreaks } = useCpdStreaks();
  
  const [answerStyle, setAnswerStyle] = useState<AnswerStyle>("standard");
  
  const [conversationId, setConversationId] = useState<string | null>(null);

  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0); 

  const [isStreakPopupOpen, setIsStreakPopupOpen] = useState(false);
  const [streakToDisplay, setStreakToDisplay] = useState(0);

  const { isRecording, toggleRecording } = useSpeechRecognition({
    onTranscript: (text) => setQ((prev) => (prev ? prev + " " + text : text)),
    onError: (msg) => setToastMessage(msg),
  });

  useEffect(() => {
    if (email) getMyProfile().then(setProfile);
  }, [email]);

  // --- Initial Load & URL Parameter Handling ---
  useEffect(() => {
    if (userLoading) return;
    
    // --- UPDATED LOGIC TO FIX TOUR START BUG ---
    const isNewChat = searchParams.get("new-chat");
    const isTour = searchParams.get("tour") === "true";
    const isForceTour = searchParams.get("forceTour") === "true";

    // 1. Handle New Chat Reset
    if (isNewChat) {
      setConversation([]);
      setQ("");
      setConversationId(null);
      
      // If we are starting a tour, enable it BEFORE cleaning the URL
      if (isTour && isForceTour) {
        setIsTourOpen(true);
        setTourStep(0);
      }

      // Clean the URL without reload
      router.replace("/", { scroll: false });
      return;
    }

    // 2. Handle Existing Chat Loading (only if NOT starting a new chat)
    const cid = searchParams.get("c"); 
    if (cid && cid !== conversationId) {
        setConversationId(cid);
        setLoading(true);
        setQ(""); 

        getConversationMessages(cid).then(items => {
            if (items && items.length > 0) {
                const reconstructed: ConversationEntry[] = [];
                items.forEach(item => {
                    reconstructed.push({ type: "user", content: item.question, question: item.question });
                    if(item.answer) {
                        reconstructed.push({ type: "umbil", content: item.answer, question: item.question });
                    }
                });
                setConversation(reconstructed);
            } else {
                setConversation([]);
            }
            setLoading(false);
        });
    } else if (!cid && !conversationId && !isTour) {
        // No ID in URL or State, and not tour -> Reset
        setConversation([]);
    }

    const checkTour = () => {
      const justLoggedIn = sessionStorage.getItem("justLoggedIn") === "true";
      const hasCompletedTour = localStorage.getItem("hasCompletedQuickTour") === "true";

      // If already handled above, this is redundant but safe
      if (isTour && isForceTour) {
        setIsTourOpen(true);
        setTourStep(0);
      } else if (justLoggedIn && !hasCompletedTour) {
        setShowWelcomeModal(true);
      }
      
      if (justLoggedIn) sessionStorage.removeItem("justLoggedIn");
    };
    
    checkTour();

  }, [searchParams, email, router, userLoading, conversationId]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.visualViewport) {
      const handleResize = () => {
        scrollToBottom(true);
      };
      window.visualViewport.addEventListener('resize', handleResize);
      return () => window.visualViewport?.removeEventListener('resize', handleResize);
    }
  }, [conversation]);

  const scrollToBottom = (instant = false) => {
    const container = scrollContainerRef.current;
    if (container) {
      const isNearBottom = container.scrollHeight - container.scrollTop < container.clientHeight + 300;
      if (isNearBottom || instant) {
        messagesEndRef.current?.scrollIntoView({ behavior: instant ? "auto" : "smooth" });
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

  const handleMicClick = () => toggleRecording();

  const handleStartTour = () => { setShowWelcomeModal(false); setIsTourOpen(true); setTourStep(0); };
  const handleSkipTour = () => { setShowWelcomeModal(false); localStorage.setItem("hasCompletedQuickTour", "true"); };

  const handleTourStepChange = useCallback((stepIndex: number) => {
    setTourStep(stepIndex); 
    // Step 5 is Reflection Modal (in new 8-step tour)
    if (stepIndex === 5) { setCurrentCpdEntry(DUMMY_CPD_ENTRY); setIsModalOpen(true); } 
    else if (isModalOpen) { setIsModalOpen(false); }
    // Step 7 is Sidebar/Analytics
    if (stepIndex === 7) { const menuButton = document.getElementById("tour-highlight-sidebar-button"); menuButton?.click(); }
  }, [isModalOpen]); 

  const handleTourClose = useCallback(() => {
    setIsTourOpen(false); setTourStep(0); setIsModalOpen(false); setCurrentCpdEntry(null);
    localStorage.setItem("hasCompletedQuickTour", "true");
    const sidebar = document.querySelector('.sidebar.is-open');
    if (sidebar) { (sidebar.querySelector('.sidebar-header button') as HTMLElement)?.click(); }

    if (email && profile && !profile.full_name) {
        setTimeout(() => {
            router.push('/profile');
        }, 300);
    }
  }, [email, profile, router]);

  const handleToolSelect = (toolId: ToolId) => {
      setSelectedTool(toolId);
      setIsToolsOpen(true);
  };

  const fetchUmbilResponse = async (
      currentConversation: ConversationEntry[], 
      styleOverride: AnswerStyle | null = null,
      activeConversationId: string | null
  ) => {
    setLoading(true);
    const lastUserQuestion = [...currentConversation].reverse().find((e) => e.type === "user")?.question;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const messagesToSend: ClientMessage[] = currentConversation.map((entry) => ({ role: entry.type === "user" ? "user" : "assistant", content: entry.content }));
      const styleToUse = styleOverride || answerStyle;
      
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json", 
            ...(token && { Authorization: `Bearer ${token}` }),
            "x-device-id": getDeviceId() 
        },
        body: JSON.stringify({ 
            messages: messagesToSend, 
            profile, 
            answerStyle: styleToUse,
            conversationId: activeConversationId, 
            saveToHistory: true 
        }),
      });

      if (!res.ok) { const data: AskResponse = await res.json(); throw new Error(data.error || "Request failed"); }
      const contentType = res.headers.get("Content-Type");
      if (contentType?.includes("application/json")) {
        const data: AskResponse = await res.json();
        setConversation((prev) => [...prev, { type: "umbil", content: data.answer ?? "", question: lastUserQuestion }]);
      } else if (contentType?.includes("text/plain")) {
        if (!res.body) throw new Error("Response body is empty.");
        setConversation((prev) => [...prev, { type: "umbil", content: "", question: lastUserQuestion }]);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break; 
          const chunk = decoder.decode(value, { stream: true });
          setConversation((prev) => {
            const newConversation = [...prev];
            const lastMessage = newConversation[newConversation.length - 1];
            if (lastMessage && lastMessage.type === "umbil") lastMessage.content += chunk;
            return newConversation;
          });
        }
      } else { throw new Error(`Unexpected Content-Type: ${contentType}`); }
    } catch (err: unknown) {
      setConversation((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.type === "umbil" && lastMsg.question === lastUserQuestion) {
              const errorNote = "\n\n> *⚠️ Network connection interrupted. Response may be incomplete.*";
              return [...prev.slice(0, -1), { ...lastMsg, content: lastMsg.content + errorNote }];
          }
          return [...prev, { type: "umbil", content: `⚠️ ${getErrorMessage(err)}` }];
      });
    } finally { setLoading(false); }
  };

  const ask = async () => {
    if (!q.trim() || loading || isTourOpen) return;
    
    // --- THIS BLOCK FIXES THE ID PERSISTENCE ---
    let currentCid = conversationId;
    if (!currentCid) {
        currentCid = uuidv4();
        setConversationId(currentCid);
        // Use router.replace to update URL cleanly without reload
        router.replace(`/?c=${currentCid}`, { scroll: false });
    }
    // -------------------------------------------

    const newQuestion = q;
    setQ("");
    
    const updatedConversation: ConversationEntry[] = [...conversation, { type: "user", content: newQuestion, question: newQuestion }];
    setConversation(updatedConversation);
    scrollToBottom(true);
    await fetchUmbilResponse(updatedConversation, null, currentCid); 
  };

  const convoToShow = isTourOpen && tourStep >= 3 ? DUMMY_TOUR_CONVERSATION : conversation;

  const handleCopyMessage = (content: string) => { navigator.clipboard.writeText(content).then(() => setToastMessage("Copied to clipboard!")).catch((err) => { console.error(err); setToastMessage("❌ Failed to copy text."); }); };
  const handleShare = async () => {
    const textContent = convoToShow.map((entry) => { const prefix = entry.type === "user" ? "You" : "Umbil"; return `${prefix}:\n${entry.content}\n\n--------------------\n`; }).join("\n");
    if (navigator.share) { try { await navigator.share({ title: "Umbil Conversation", text: textContent }); } catch (err) { console.log(err); } } 
    else { const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "umbil_conversation.txt"; document.body.appendChild(a); a.click(); document.body.removeChild(a); setToastMessage("Conversation downloading..."); }
  };
  const handleRegenerateResponse = async () => {
    if (loading || conversation.length === 0 || isTourOpen) return;
    const lastEntry = conversation[conversation.length - 1];
    if (lastEntry.type !== "umbil") return;
    const conversationForRegen = conversation.slice(0, -1);
    setConversation(conversationForRegen);
    await fetchUmbilResponse(conversationForRegen, null, conversationId);
  };
  const handleDeepDive = async (entry: ConversationEntry, index: number) => {
    if (loading || isTourOpen) return;
    if (!entry.question) { setToastMessage("❌ Cannot deep-dive on this message."); return; }
    const historyForDeepDive = conversation.slice(0, index);
    await fetchUmbilResponse(historyForDeepDive, 'deepDive', conversationId);
  };
  const handleOpenAddCpdModal = (entry: ConversationEntry) => {
    if (isTourOpen) return;
    if (!email) { setToastMessage("Please sign in to add CPD entries."); return; }
    setCurrentCpdEntry({ question: entry.question || "", answer: entry.content });
    setIsModalOpen(true);
  };
  const handleSaveCpd = async (reflection: string, tags: string[]) => {
    // Step 5 is Modal Step (Index 5)
    if (isTourOpen) { handleTourStepChange(6); return; }
    if (!currentCpdEntry) return;
    
    const isFirstLogToday = !hasLoggedToday;
    const nextStreak = currentStreak + (isFirstLogToday ? 1 : 0);

    const cpdEntry: Omit<CPDEntry, 'id' | 'user_id'> = { timestamp: new Date().toISOString(), question: currentCpdEntry.question, answer: currentCpdEntry.answer, reflection, tags };
    const { error } = await addCPD(cpdEntry);
    
    if (error) { 
        console.error("Failed to save CPD entry:", error); 
        setToastMessage("❌ Failed to save CPD entry."); 
    } else { 
        if (isFirstLogToday) {
            setStreakToDisplay(nextStreak);
            setIsStreakPopupOpen(true);
        } else {
            setToastMessage("✅ CPD entry saved remotely!"); 
        }
        refetchStreaks();
    }
    
    setIsModalOpen(false); 
    setCurrentCpdEntry(null);
  };

  const renderMessage = (entry: ConversationEntry, index: number) => {
    const isUmbil = entry.type === "umbil";
    const isLastMessage = index === convoToShow.length - 1;
    const className = `message-bubble ${isUmbil ? "umbil-message" : "user-message"}`;
    const highlightId = isTourOpen && isUmbil ? "tour-highlight-message" : undefined;

    return (
      <div key={index} id={highlightId} className={className}>
        {isUmbil ? (
          <div className="markdown-content-wrapper">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ table: ({ ...props }) => <div className="table-scroll-wrapper"><table {...props} /></div> }}>{entry.content}</ReactMarkdown>
          </div>
        ) : ( <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.content}</ReactMarkdown> )}

        {isUmbil && (
          <div className="umbil-message-actions">
            <button className="action-button" onClick={handleShare} title="Share conversation"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg> Share</button>
            <button className="action-button" onClick={() => handleCopyMessage(entry.content)} title="Copy this message"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy</button>
            {isLastMessage && !loading && entry.question && ( <button className="action-button" onClick={() => handleDeepDive(entry, index)} title="Deep dive on this topic"><svg className="icon-zoom-in" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg> Deep Dive</button> )}
            {isLastMessage && !loading && ( <button className="action-button" onClick={handleRegenerateResponse} title="Regenerate response"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"></polyline><polyline points="23 20 23 14 17 14"></polyline><path d="M20.49 9A9 9 0 0 0 7.1 4.14M3.51 15A9 9 0 0 0 16.9 19.86"></path></svg> Regenerate</button> )}
            <button id={isTourOpen ? "tour-highlight-cpd-button" : undefined} className="action-button" onClick={() => isTourOpen ? handleTourStepChange(5) : handleOpenAddCpdModal(entry)} title="Add reflection to your CPD log"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg> Log learning (CPD)</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {isTourOpen && ( <QuickTour isOpen={isTourOpen} currentStep={tourStep} onClose={handleTourClose} onStepChange={handleTourStepChange} /> )}
      
      <div className="main-content" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
        {(convoToShow.length > 0) ? (
          <>
            <div 
                ref={scrollContainerRef} 
                className="conversation-container" 
                style={{ 
                    flexGrow: 1, 
                    overflowY: 'auto', 
                    padding: '20px',
                    paddingBottom: '40px' 
                }}
            >
              <div className="message-thread">
                {convoToShow.map(renderMessage)}
                {loading && <div className="loading-indicator">{loadingMsg}<span>•</span><span>•</span><span>•</span></div>}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="sticky-input-wrapper" style={{ position: 'relative', flexShrink: 0, background: 'var(--umbil-bg)', borderTop: '1px solid var(--umbil-divider)', zIndex: 50, padding: '20px' }}>
              <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                <SearchInputArea 
                  q={q} setQ={setQ} ask={ask} loading={loading} 
                  isTourOpen={isTourOpen} isRecording={isRecording} 
                  handleMicClick={toggleRecording} answerStyle={answerStyle} 
                  setAnswerStyle={setAnswerStyle} 
                  onToolSelect={handleToolSelect} 
                  handleTourStepChange={handleTourStepChange}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="hero" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <h1 className="hero-headline">Smarter medicine starts here.</h1>
            <div style={{ marginTop: "24px", position: 'relative', width: '100%', maxWidth: '700px' }}>
              <SearchInputArea 
                  q={q} setQ={setQ} ask={ask} loading={loading} 
                  isTourOpen={isTourOpen} isRecording={isRecording} 
                  handleMicClick={toggleRecording} answerStyle={answerStyle} 
                  setAnswerStyle={setAnswerStyle} 
                  onToolSelect={handleToolSelect} 
                  handleTourStepChange={handleTourStepChange}
                />
            </div>
            <p className="disclaimer" style={{ marginTop: "36px" }}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4M12 8h.01"></path></svg> Please don’t enter any patient-identifiable information.</p>
          </div>
        )}
      </div>
      {showWelcomeModal && <TourWelcomeModal onStart={handleStartTour} onSkip={handleSkipTour} />}
      
      {/* Updated: Check for step 5 (Modal) */}
      {(isModalOpen || (isTourOpen && tourStep === 5)) && (
        <ReflectionModal isOpen={isModalOpen} onClose={isTourOpen ? () => {} : () => setIsModalOpen(false)} onSave={handleSaveCpd} currentStreak={streakLoading ? 0 : currentStreak} cpdEntry={isTourOpen ? DUMMY_CPD_ENTRY : currentCpdEntry} tourId={isTourOpen && tourStep === 5 ? "tour-highlight-modal" : undefined} />
      )}
      
      <StreakPopup 
        isOpen={isStreakPopupOpen} 
        streakCount={streakToDisplay} 
        onClose={() => setIsStreakPopupOpen(false)} 
      />

      <ToolsModal 
        isOpen={isToolsOpen} 
        onClose={() => setIsToolsOpen(false)} 
        initialTool={selectedTool}
      />

      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      
      <style jsx>{`
        @keyframes pulse-red {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
        }
        .recording-pulse {
            animation: pulse-red 1.5s infinite;
            display: flex;
            align-items: center;
            justify-content: center;
        }
      `}</style>
    </>
  );
}