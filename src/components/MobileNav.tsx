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
  
  // NEW: State to toggle history expansion
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  
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

  const handleInvite = async () => {
    const shareData = { title: "Join me on Umbil", text: "I'm using Umbil to simplify my clinical learning and CPD. Check it out:", url: "https://umbil.co.uk" };
    if (navigator.share) { try { await navigator.share(shareData); } catch (err) { console.log(err); } }
    else { navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`).then(() => setToastMessage("Invite link copied!")); }
  };

  // --- Navigation Groups ---
  const coreLinks = [
    { href: "/cpd", label: "My CPD" },
    { href: "/pdp", label: "My PDP" },
    { href: "/profile", label: "My Profile" },
  ];

  // --- Logic for Displaying History ---
  const INITIAL_HISTORY_COUNT = 5;
  const visibleHistory = isHistoryExpanded ? history : history.slice(0, INITIAL_HISTORY_COUNT);
  const hiddenCount = Math.max(0, history.length - INITIAL_HISTORY_COUNT);

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      
      <div id="tour-highlight-sidebar" className={`sidebar ${isOpen ? "is-open" : ""}`} onClick={(e) => e.stopPropagation()}>
        
        {/* 1. HEADER */}
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

            {/* Core Links */}
            <nav className="nav-group">
                {coreLinks.map((item) => (
                    <Link key={item.href} href={item.href} className={`nav-item ${pathname === item.href ? "active" : ""}`} onClick={onClose}>
                        {item.label}
                    </Link>
                ))}
            </nav>

            {/* Recent History - IMPROVED */}
            {userEmail && history.length > 0 && (
                <div className="history-section">
                    <div className="section-label">Recent</div>
                    <div className="history-list">
                        {visibleHistory.map((item) => (
                            <button key={item.id} onClick={() => handleHistoryClick(item.id)} className="history-item">
                                <span className="history-text">{item.question}</span>
                            </button>
                        ))}
                        
                        {/* Toggle Button for Older Items */}
                        {history.length > INITIAL_HISTORY_COUNT && (
                             <button 
                                onClick={() => setIsHistoryExpanded(!isHistoryExpanded)} 
                                className="history-toggle-btn"
                             >
                                {isHistoryExpanded ? (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                                        Show less
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                        Show {hiddenCount} more
                                    </>
                                )}
                             </button>
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* 3. STICKY FOOTER */}
        <div className="sidebar-footer">
            
            {/* Umbil Pro Link */}
            <Link href="/pro" className="pro-link" onClick={onClose}>
               <span>Umbil Pro ✨</span>
            </Link>

            {/* 2x2 Grid of Colorful Teal Buttons */}
            <div className="footer-grid">
                <button onClick={() => { handleInvite(); onClose(); }} className="footer-btn">
                    Invite
                </button>
                <button onClick={(e) => { e.preventDefault(); handleStartTour(); }} className="footer-btn">
                    Quick Tour
                </button>
                <Link href="/settings" className="footer-btn" onClick={onClose}>
                    Settings
                </Link>
                <Link href="/settings/feedback" className="footer-btn" onClick={onClose}>
                    Feedback
                </Link>
            </div>

            {/* Profile Info & Sign Out */}
            {userEmail && (
                <div className="profile-section">
                    <div className="profile-info">
                        <div className="user-name">{profile?.full_name || email}</div>
                        {profile?.grade && <div className="user-role">{profile.grade}</div>}
                    </div>
                    <button className="sign-out-btn" onClick={handleSignOut}>
                        Sign Out
                    </button>
                </div>
            )}

            {/* Dark Mode Toggle */}
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
            overflow: hidden; 
        }

        .sidebar-header {
            flex-shrink: 0;
            padding-bottom: 0;
            margin-bottom: 16px; /* Tighter spacing */
        }

        /* Scrollable Middle Section */
        .sidebar-scroll-area {
            flex-grow: 1;
            overflow-y: auto;
            padding-bottom: 12px;
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        .sidebar-scroll-area::-webkit-scrollbar {
            display: none;
        }

        /* Overriding the global margin for the new chat button to tighten layout */
        .new-chat-button {
            margin-bottom: 12px !important;
        }

        /* Navigation Items */
        .nav-group {
            display: flex;
            flex-direction: column;
            gap: 2px; /* Tighter gap between items */
            margin-bottom: 16px; /* Less space before history */
        }
        .nav-item {
            display: block;
            padding: 8px 16px; /* Reduced vertical padding (was 10px) */
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

        /* Streak Button Style */
        .streak-display-sidebar { 
            padding: 10px 16px; /* Slightly tighter */
            font-size: 1rem; 
            color: var(--umbil-brand-teal); 
            background-color: var(--umbil-hover-bg); 
            border-radius: var(--umbil-radius-sm); 
            margin: 0 0 12px 0; /* Reduced margin bottom (was 16px) */
            text-align: center; 
            transition: opacity 0.3s, background-color 0.2s; 
            display: block; 
            text-decoration: none; 
            cursor: pointer; 
            border: 1px solid var(--umbil-card-border);
        }
        .streak-display-sidebar:hover { 
            background-color: var(--umbil-divider); 
        }
        .streak-display-sidebar.faded-streak { 
            opacity: 0.6; 
        }

        /* History Section */
        .history-section {
            margin-top: 0px; /* Removed extra top margin */
            padding-top: 12px;
            border-top: 1px solid var(--umbil-divider);
        }
        .section-label {
            font-size: 0.75rem;
            fontWeight: 700;
            color: var(--umbil-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 6px;
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
        
        /* NEW: Toggle Button Style */
        .history-toggle-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 12px;
            font-size: 0.85rem;
            color: var(--umbil-muted);
            background: none;
            border: none;
            cursor: pointer;
            width: 100%;
            text-align: left;
            transition: color 0.2s, background-color 0.2s;
            border-radius: 6px;
        }
        .history-toggle-btn:hover {
            color: var(--umbil-text);
            background-color: var(--umbil-hover-bg);
        }

        /* Sticky Footer Section */
        .sidebar-footer {
            flex-shrink: 0;
            border-top: 1px solid var(--umbil-divider);
            padding-top: 16px;
            background-color: var(--umbil-surface);
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        /* Pro Link */
        .pro-link {
            display: block;
            color: var(--umbil-brand-teal) !important;
            font-weight: 600;
            background-color: rgba(31, 184, 205, 0.1);
            padding: 10px;
            border-radius: var(--umbil-radius-sm);
            text-align: center;
            text-decoration: none;
            transition: background-color 0.2s;
        }
        .pro-link:hover {
            background-color: rgba(31, 184, 205, 0.2);
        }

        /* Colorful Teal Grid Buttons */
        .footer-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
        }

        .footer-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 10px;
            border: 1px solid var(--umbil-brand-teal);
            border-radius: var(--umbil-radius-sm);
            color: var(--umbil-brand-teal);
            background-color: transparent;
            font-weight: 600;
            font-size: 0.9rem;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s ease-in-out;
            text-decoration: none;
        }
        .footer-btn:hover {
            background-color: var(--umbil-brand-teal);
            color: var(--umbil-surface);
        }

        /* Profile Info Section */
        .profile-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 4px;
            border-top: 1px solid var(--umbil-divider);
            margin-top: 4px;
        }
        .profile-info {
            display: flex;
            flex-direction: column;
        }
        .user-name {
            font-weight: 600;
            font-size: 0.95rem;
            color: var(--umbil-text);
        }
        .user-role {
            font-size: 0.75rem;
            color: var(--umbil-muted);
        }
        .sign-out-btn {
            background: none;
            border: 1px solid var(--umbil-divider);
            color: #ef4444;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 0.8rem;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        .sign-out-btn:hover {
            background-color: #fef2f2;
            color: #dc2626;
            border-color: #fca5a5;
        }

        /* Dark Mode Toggle */
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