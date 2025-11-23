// src/components/MobileNav.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"; 
import { useUserEmail } from "@/hooks/useUser";
import { getMyProfile, Profile } from "@/lib/profile";
import { useEffect, useState } from "react";
import { useCpdStreaks } from "@/hooks/useCpdStreaks"; 
import { getChatHistory, ChatHistoryItem } from "@/lib/store"; 
import Toast from "@/components/Toast";

type MobileNavProps = {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string | null;
  isDarkMode: boolean; 
  toggleDarkMode: () => void; 
};

export default function MobileNav({ isOpen, onClose, userEmail, isDarkMode, toggleDarkMode }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  const { email } = useUserEmail();
  const [profile, setProfile] = useState<Partial<Profile> | null>(null);
  const [history, setHistory] = useState<ChatHistoryItem[]>([]); 
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const { currentStreak, loading: streaksLoading, hasLoggedToday } = useCpdStreaks();

  useEffect(() => {
    const loadData = async () => {
      if (email) {
        const [userProfile, historyData] = await Promise.all([getMyProfile(), getChatHistory()]);
        setProfile(userProfile);
        setHistory(historyData);
      } else {
        setProfile(null);
        setHistory([]);
      }
    };
    if (isOpen) loadData();
  }, [email, isOpen]);

  const handleNewChat = () => { onClose(); router.push(`/?new-chat=${Date.now()}`); };
  const handleSignOut = async () => { await supabase.auth.signOut(); onClose(); router.push("/"); };
  const handleStartTour = () => { onClose(); router.push(`/?tour=true&forceTour=true&new-chat=${Date.now()}`); };

  const handleHistoryClick = (id: string) => {
      onClose();
      const params = new URLSearchParams();
      params.set("history_id", id);
      router.push(`/?${params.toString()}`);
  };

  // --- FIXED LINE BELOW ---
  const handleInvite = async () => {
    const shareData = { title: "Join me on Umbil", text: "I'm using Umbil to simplify my clinical learning and CPD. Check it out:", url: "https://umbil.co.uk" };
    if (navigator.share) { try { await navigator.share(shareData); } catch (err) { console.log(err); } }
    else { navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`).then(() => setToastMessage("Invite link copied!")); }
  };

  // --- Navigation Groups ---
  const coreLinks = [
    { href: "/cpd", label: "My CPD", icon: "📋" },
    { href: "/pdp", label: "My PDP", icon: "wm" }, 
    { href: "/profile", label: "My Profile", icon: "👤" },
  ];

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      
      <div id="tour-highlight-sidebar" className={`sidebar ${isOpen ? "is-open" : ""}`} onClick={(e) => e.stopPropagation()}>
        
        {/* 1. HEADER (Fixed) */}
        <div className="sidebar-header">
          <h3 className="text-lg font-semibold">Menu</h3>
          <button onClick={onClose} className="menu-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* 2. SCROLLABLE AREA (Top Actions + Recent) */}
        <div className="sidebar-scroll-area">
            
            {/* New Chat Button */}
            <button className="new-chat-button" onClick={handleNewChat}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg> New Chat
            </button>

            {/* CPD Streak */}
            {userEmail && !streaksLoading && currentStreak > 0 && (
                <Link href="/profile" className={`streak-display-sidebar ${!hasLoggedToday ? 'faded-streak' : ''}`} onClick={onClose}>
                    <span style={{fontWeight: 700}}>🔥 CPD Streak: {currentStreak} {currentStreak === 1 ? 'day' : 'days'}</span>
                </Link>
            )}

            {/* Core Links (CPD, PDP, Profile) */}
            <nav className="nav-group">
                {coreLinks.map((item) => (
                    <Link key={item.href} href={item.href} className={`nav-item ${pathname === item.href ? "active" : ""}`} onClick={onClose}>
                        {item.label}
                    </Link>
                ))}
            </nav>

            {/* Recent History (Max 6 Items) */}
            {userEmail && history.length > 0 && (
                <div className="history-section">
                    <div className="section-label">Recent (7 Days)</div>
                    <div className="history-list">
                        {history.slice(0, 6).map((item) => (
                            <button key={item.id} onClick={() => handleHistoryClick(item.id)} className="history-item">
                                <span className="history-text">{item.question}</span>
                            </button>
                        ))}
                        {history.length > 6 && (
                             <div style={{ padding: '4px 12px', fontSize: '0.75rem', color: 'var(--umbil-muted)', fontStyle: 'italic' }}>
                                + {history.length - 6} older items
                             </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* 3. STICKY FOOTER (Utilities) */}
        <div className="sidebar-footer">
            
            <Link href="/pro" className="footer-link pro-link" onClick={onClose}>
               <span>Umbil Pro ✨</span>
            </Link>

            <div className="footer-grid">
                <button onClick={() => { handleInvite(); onClose(); }} className="footer-link">Invite a Colleague</button>
                <button onClick={(e) => { e.preventDefault(); handleStartTour(); }} className="footer-link">Quick Tour</button>
                <Link href="/settings" className="footer-link" onClick={onClose}>Settings</Link>
                <Link href="/settings/feedback" className="footer-link" onClick={onClose}>Send Feedback</Link>
            </div>

            {userEmail && (
                <button className="footer-link sign-out" onClick={handleSignOut}>
                    Sign Out {profile?.full_name ? `(${profile.full_name.split(' ')[0]})` : ''}
                </button>
            )}

            <div className="dark-mode-toggle">
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{isDarkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}</span>
                <label className="switch"><input type="checkbox" checked={isDarkMode} onChange={toggleDarkMode} /><span className="slider round"></span></label>
            </div>
        </div>

      </div>
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      
      <style jsx global>{`
        .sidebar {
            display: flex;
            flex-direction: column;
            /* Ensures styling handles overflow correctly */
            overflow: hidden; 
        }

        .sidebar-header {
            flex-shrink: 0; /* Don't shrink */
            padding-bottom: 0;
            margin-bottom: 20px;
        }

        /* Scrollable Middle Section */
        .sidebar-scroll-area {
            flex-grow: 1;
            overflow-y: auto;
            padding-bottom: 20px;
            /* Hide scrollbar for cleaner look */
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
        }
        .sidebar-scroll-area::-webkit-scrollbar {
            display: none;
        }

        /* Navigation Items */
        .nav-group {
            display: flex;
            flex-direction: column;
            gap: 4px;
            margin-bottom: 24px;
        }
        .nav-item {
            display: block;
            padding: 10px 16px;
            font-size: 1rem;
            font-weight: 500;
            color: var(--umbil-text);
            border-radius: var(--umbil-radius-sm);
            transition: background-color 0.2s;
        }
        .nav-item:hover, .nav-item.active {
            background-color: var(--umbil-hover-bg);
            color: var(--umbil-brand-teal);
        }

        /* History Section */
        .history-section {
            margin-top: 8px;
            padding-top: 16px;
            border-top: 1px solid var(--umbil-divider);
        }
        .section-label {
            font-size: 0.75rem;
            fontWeight: 700;
            color: var(--umbil-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 8px;
            padding-left: 12px;
        }
        .history-list {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        .history-item {
            text-align: left;
            background: none;
            border: none;
            padding: 8px 12px;
            font-size: 0.9rem;
            color: var(--umbil-text);
            cursor: pointer;
            width: 100%;
            transition: background-color 0.2s;
            border-radius: 6px;
            overflow: hidden;
        }
        .history-item:hover {
            background-color: var(--umbil-hover-bg);
        }
        .history-text {
            display: block;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        /* Sticky Footer Section */
        .sidebar-footer {
            flex-shrink: 0;
            border-top: 1px solid var(--umbil-divider);
            padding-top: 16px;
            background-color: var(--umbil-surface); /* Ensure content doesn't show behind */
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .footer-grid {
            display: grid;
            grid-template-columns: 1fr 1fr; /* 2 columns for utility links */
            gap: 8px;
            margin-bottom: 8px;
        }

        .footer-link {
            display: block;
            text-align: left;
            background: none;
            border: none;
            padding: 8px 12px;
            font-size: 0.85rem;
            color: var(--umbil-muted);
            border-radius: 6px;
            cursor: pointer;
            transition: color 0.2s, background-color 0.2s;
            text-decoration: none;
        }
        .footer-link:hover {
            color: var(--umbil-text);
            background-color: var(--umbil-hover-bg);
        }

        .pro-link {
            color: var(--umbil-brand-teal) !important;
            font-weight: 600;
            background-color: rgba(31, 184, 205, 0.1);
            margin-bottom: 8px;
            text-align: center;
        }
        .pro-link:hover {
            background-color: rgba(31, 184, 205, 0.2);
        }

        .sign-out {
            width: 100%;
            color: #ef4444; /* Red for sign out */
            border: 1px solid var(--umbil-divider);
            text-align: center;
            margin-bottom: 12px;
        }
        .sign-out:hover {
            background-color: #fef2f2;
            color: #dc2626;
        }

        .dark-mode-toggle {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background-color: var(--umbil-hover-bg);
            border-radius: var(--umbil-radius-sm);
        }

        /* Switches */
        .switch { position: relative; display: inline-block; width: 36px; height: 20px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--umbil-card-border); transition: 0.4s; border-radius: 24px; }
        .slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px; background-color: var(--umbil-surface); transition: 0.4s; border-radius: 50%; }
        input:checked + .slider { background-color: var(--umbil-brand-teal); }
        input:checked + .slider:before { transform: translateX(16px); }
        .dark .slider { background-color: var(--umbil-divider); }
        .dark .slider:before { background-color: var(--umbil-hover-bg); }
      `}</style>
    </>
  );
}