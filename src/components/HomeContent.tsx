// src/components/HomeContent.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ReflectionModal from "@/components/ReflectionModal";
import Toast from "@/components/Toast";
// Updated addCPD will now be the remote save function
import { addCPD, CPDEntry } from "@/lib/store"; 
import { useUserEmail } from "@/hooks/useUser";
import { useSearchParams } from "next/navigation";
import { getMyProfile, Profile } from "@/lib/profile";
import { supabase } from "@/lib/supabase"; // <-- *** 1. ADD THIS IMPORT ***

// --- UPDATED TYPE FOR RATE LIMIT RESPONSE (pro_url removed) ---
type AskResponse = { 
    answer?: string; 
    error?: string;
};
// ----------------------------------------

type ConversationEntry = { type: "user" | "umbil"; content: string; question?: string; }; // pro_url removed from this type

// Define a type for a message to be sent to the API
type ClientMessage = {
  role: "user" | "assistant";
  content: string;
};

const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  // Handle objects that might have an error message property, common in API responses
  if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  if (typeof err === "string") return err;
  
  // Final fallback
  return "An unexpected error occurred.";
};

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
  const [loadingMsg, setLoadingMsg] = useState(loadingMessages[0]);
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null); // NEW: Reference to the main content container
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Using Omit to ensure we only collect the client-side fields needed before database insertion
  const [currentCpdEntry, setCurrentCpdEntry] = useState<Omit<CPDEntry, "reflection" | "tags" | "id" | "user_id"> | null>(null);
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
    // Clear chat history if the 'new-chat' parameter is present
    if (searchParams.get("new-chat")) {
      setConversation([]);
    }
  }, [searchParams]);

  // IMPROVED SCROLL LOGIC
  const scrollToBottom = (instant = false) => {
    // Get the main content container (the viewport/window that is scrolling)
    const container = document.querySelector('.main-content'); 
    
    if (container) {
        // Check if the user is already near the bottom (within 200px)
        const isNearBottom = container.scrollHeight - container.scrollTop < container.clientHeight + 200; 
        
        // Only scroll if it's an instant scroll (user just submitted a question) OR 
        // if the user was already near the bottom (new message arrival)
        if (isNearBottom || instant) {
            messagesEndRef.current?.scrollIntoView({ behavior: instant ? "auto" : "smooth" });
        }
    }
  };

  // Trigger scroll only when conversation updates
  useEffect(() => {
      // Small delay to ensure the new DOM element has rendered before measuring scroll height
      const timeoutId = setTimeout(() => scrollToBottom(), 50); 
      return () => clearTimeout(timeoutId);
  }, [conversation]);
  
  // Handle dynamic loading message
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
      setLoadingMsg(loadingMessages[0]); // Reset to initial message
    }
  }, [loading]);

  const ask = async () => {
    if (!q.trim() || loading) return;

    const newQuestion = q;
    setQ("");
    setLoading(true);

    const updatedConversation: ConversationEntry[] = [
      ...conversation,
      { type: "user", content: newQuestion, question: newQuestion }
    ];
    // Use the instant scroll on user submission
    setConversation(updatedConversation);
    scrollToBottom(true); 

    try {
      // --- *** 2. THIS IS THE FIX (Part 1) *** ---
      // Get the user's current session token to send to the API
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      // --- *** END OF FIX (Part 1) *** ---

      // 1. Map the current conversation state to the API's expected format (role/content)
      const messagesToSend: ClientMessage[] = updatedConversation.map(entry => ({
          role: entry.type === "user" ? "user" : "assistant",
          content: entry.content
      }));
      
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          // --- *** 3. THIS IS THE FIX (Part 2) *** ---
          // Pass the token in the Authorization header
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        // Send the full conversation history for context
        body: JSON.stringify({ messages: messagesToSend, profile, tone: "conversational" }),
      });

      const data: AskResponse = await res.json();
      
      if (!res.ok) {
          throw new Error(data.error || "Request failed");
      } else {
          setConversation((prev) => [
            ...prev,
            { type: "umbil", content: data.answer ?? "", question: newQuestion },
          ]);
      }
      
    } catch (err: unknown) {
      setConversation((prev) => [...prev, { type: "umbil", content: `⚠️ ${getErrorMessage(err)}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddCpdModal = (entry: ConversationEntry) => {
    if (!email) {
      setToastMessage("Please sign in to add CPD entries.");
      return;
    }
    // Prepare the core data to be passed to the modal and eventually the DB
    setCurrentCpdEntry({
      timestamp: new Date().toISOString(),
      question: entry.question || "", // Use the original sanitized question
      answer: entry.content, // Use the AI's response content
    });
    setIsModalOpen(true);
  };

  /**
   * Handles saving the reflection and tags to the CPD entry in the remote database.
   */
  const handleSaveCpd = async (reflection: string, tags: string[]) => {
    if (!currentCpdEntry) return;
    
    // Combine the captured message with the new reflection/tags for the DB insertion
    const cpdEntry = { ...currentCpdEntry, reflection, tags };
    
    // Asynchronously save to the remote Supabase database and handle the response
    const { error } = await addCPD(cpdEntry);

    if (error) {
      console.error("Failed to save CPD entry:", error);
      setToastMessage("❌ Failed to save CPD entry. Please check the console for details.");
    } else {
      setToastMessage("✅ CPD entry saved remotely!");
    }
    
    setIsModalOpen(false);
  };

  const renderMessage = (entry: ConversationEntry, index: number) => {
    const isUmbil = entry.type === "umbil";
    const className = `message-bubble ${isUmbil ? "umbil-message" : "user-message"}`;

    return (
      <div key={index} className={className}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.content}</ReactMarkdown>
        {isUmbil && ( // Show CPD button for all Umbil messages
          <div className="umbil-message-actions">
            <button className="action-button" onClick={() => handleOpenAddCpdModal(entry)}>Add to CPD</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Assigning a class to the container element */}
      <div ref={scrollContainerRef} className="main-content-scroll-container" style={{ flexGrow: 1 }}>
          
        {conversation.length > 0 ? (
          // Conversation Mode
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
      </div>
      <ReflectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCpd}
      />
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </>
  );
}