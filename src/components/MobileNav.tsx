// src/components/MobileNav.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"; 
import { useUserEmail } from "@/hooks/useUser";
import { getMyProfile, Profile } from "@/lib/profile";
import { useEffect, useState } from "react";
import { useCpdStreaks } from "@/hooks/useCpdStreaks"; 
import { getChatHistory, ChatHistoryItem } from "@/lib/store"; // Import history
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
  const [history, setHistory] = useState<ChatHistoryItem[]>([]); // History state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const { currentStreak, loading: streaksLoading, hasLoggedToday } = useCpdStreaks();

  useEffect(() => {
    const loadData = async () => {
      if (email) {
        const [userProfile, historyData] = await Promise.all([
            getMyProfile(),
            getChatHistory()
        ]);
        setProfile(userProfile);
        setHistory(historyData);
      } else {
        setProfile(null);
        setHistory([]);
      }
    };
    if (isOpen) { // Only fetch when sidebar is open to save resources
        loadData();
    }
  }, [email, isOpen]);

  const handleNewChat = () => {
    onClose();
    router.push(`/?new-chat=${Date.now()}`);
  };
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onClose();
    router.push("/"); 
  };

  const handleStartTour = () => {
    onClose();
    router.push(`/?tour=true&forceTour=true&new-chat=${Date.now()}`);
  };

  // --- Load a history item ---
  const handleHistoryClick = (q: string) => {
      onClose();
      // Pass question as URL param to be picked up by HomeContent
      const params = new URLSearchParams();
      params.set("history_q", q);
      router.push(`/?${params.toString()}`);
  };

  const handleInvite = async () => {
    const shareData = {
      title: "Join me on Umbil",
      text: "I'm using Umbil to turn my clinical questions into verified CPD instantly.",
      url: "https://umbil.co.uk"
    };

    if (navigator.share) {
      try { await navigator.share(shareData); } catch (err) { console.log(err); }
    } else {
      const textToCopy = `${shareData.text} ${shareData.url}`;
      navigator.clipboard.writeText(textToCopy).then(() => {
        setToastMessage("Invite link copied to clipboard!");
      });
    }
  };

  const menuItems = [
    { href: "/about", label: "About Umbil" },
    { href: "/cpd", label: "My CPD", requiresAuth: true },
    { href: "/pdp", label: "My PDP", requiresAuth: true },
    { href: "/profile", label: "My Profile", requiresAuth: true },
    { href: "/pro", label: "Umbil Pro ✨", requiresAuth: false }, 
    { href: "/settings", label: "Settings" },
    { href: "/settings/feedback", label: "Send Feedback" }, 
  ];

  const filteredMenuItems = menuItems.filter(item => !item.requiresAuth || userEmail);

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <div id="tour-highlight-sidebar" className={`sidebar ${isOpen ? "is-open" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="sidebar-header">
          <h3 className="text-lg font-semibold">Navigation</h3>
          <button onClick={onClose} className="menu-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <button className="new-chat-button" onClick={handleNewChat}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg>
          New Chat
        </button>

        {/* --- History Section --- */}
        {userEmail && history.length > 0 && (
            <div style={{ marginBottom: 20 }}>
                <div style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    color: 'var(--umbil-muted)', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    marginBottom: '8px',
                    paddingLeft: '16px'
                }}>
                    Recent (7 Days)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {history.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleHistoryClick(item.question)}
                            style={{
                                textAlign: 'left',
                                background: 'none',
                                border: 'none',
                                padding: '8px 16px',
                                fontSize: '0.9rem',
                                color: 'var(--umbil-text)',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                width: '100%',
                                transition: 'background-color 0.2s'
                            }}
                            className="history-item"
                        >
                            {item.question}
                        </button>
                    ))}
                </div>
            </div>
        )}

        {userEmail && !streaksLoading && currentStreak > 0 && (
            <Link
                href="/profile"
                className={`streak-display-sidebar ${!hasLoggedToday ? 'faded-streak' : ''}`}
                onClick={onClose}
            >
                <span style={{fontWeight: 700}}>
                    🔥 CPD Streak: {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
                </span>
            </Link>
        )}
        
        <nav className="sidebar-nav">
          {filteredMenuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? "active" : ""}
              onClick={onClose}
            >
              {item.label}
            </Link>
          ))}
          
          <a href="#" onClick={(e) => { e.preventDefault(); handleInvite(); }} className="quick-tour-button" style={{color: 'var(--umbil-brand-teal)'}}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>
            Invite a Colleague
          </a>

          <a href="#" onClick={(e) => { e.preventDefault(); handleStartTour(); }} className="quick-tour-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            Quick Tour
          </a>
        </nav>
        
        {userEmail && profile && (
            <div style={{ padding: '16px 0', borderTop: '1px solid var(--umbil-divider)', marginTop: 'auto' }}>
                <div className="profile-info-sidebar">
                    <span className="user-name">{profile.full_name || email || 'User Profile'}</span> 
                    {profile.grade && <span className="user-role">{profile.grade}</span>}
                </div>
                <button className="btn btn--outline" onClick={handleSignOut} style={{ marginTop: '12px', width: '100%' }}>Sign out</button>
            </div>
        )}

        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--umbil-divider)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 500 }}>{isDarkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}</span>
            <label className="switch">
              <input type="checkbox" checked={isDarkMode} onChange={toggleDarkMode} />
              <span className="slider round"></span>
            </label>
        </div>
      </div>
      
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      <style jsx global>{`
        .quick-tour-button { display: flex !important; align-items: center; padding: 12px 16px; font-size: 1rem; font-weight: 500; color: var(--umbil-text); border-radius: var(--umbil-radius-sm); transition: background-color 0.2s; cursor: pointer; }
        .quick-tour-button:hover, .quick-tour-button.active { background-color: var(--umbil-hover-bg); }
        .profile-info-sidebar { display: flex; flex-direction: column; padding: 0 16px; margin-bottom: 8px; }
        .profile-info-sidebar .user-name { font-weight: 600; font-size: 1rem; color: var(--umbil-text); }
        .profile-info-sidebar .user-role { font-size: 0.8rem; color: var(--umbil-muted); margin-top: 4px; }
        .streak-display-sidebar { padding: 12px 16px; font-size: 1rem; color: var(--umbil-brand-teal); background-color: var(--umbil-hover-bg); border-radius: var(--umbil-radius-sm); margin: 0 0 16px 0; text-align: center; transition: opacity 0.3s, background-color 0.2s; display: block; text-decoration: none; cursor: pointer; }
        .streak-display-sidebar:hover { background-color: var(--umbil-divider); }
        .streak-display-sidebar.faded-streak { opacity: 0.5; }
        .switch { position: relative; display: inline-block; width: 40px; height: 24px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--umbil-card-border); transition: 0.4s; border-radius: 24px; }
        .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 4px; bottom: 4px; background-color: var(--umbil-surface); transition: 0.4s; border-radius: 50%; }
        input:checked + .slider { background-color: var(--umbil-brand-teal); }
        input:checked + .slider:before { transform: translateX(16px); }
        .dark .slider { background-color: var(--umbil-divider); }
        .dark .slider:before { background-color: var(--umbil-hover-bg); }
        .history-item:hover { background-color: var(--umbil-hover-bg) !important; }
      `}</style>
    </>
  );
}