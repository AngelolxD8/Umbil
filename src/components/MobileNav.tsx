// src/components/MobileNav.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"; // Import supabase for sign out
import { useUserEmail } from "@/hooks/useUser";
import { getMyProfile, Profile } from "@/lib/profile";
import { useEffect, useState } from "react";
import { useCpdStreaks } from "@/hooks/useCpdStreaks"; 

type MobileNavProps = {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string | null;
  isDarkMode: boolean; // <-- Added
  toggleDarkMode: () => void; // <-- Added
};

export default function MobileNav({ isOpen, onClose, userEmail, isDarkMode, toggleDarkMode }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  const { email } = useUserEmail();
  const [profile, setProfile] = useState<Partial<Profile> | null>(null);
  
  // <-- Fetch streak data
  const { currentStreak, loading: streaksLoading, hasLoggedToday } = useCpdStreaks();

  // Load the user's full name and grade for display
  useEffect(() => {
    const loadProfile = async () => {
      if (email) {
        const userProfile = await getMyProfile();
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
    };
    loadProfile();
  }, [email]);

  /**
   * Resets the chat history and navigates to the home page.
   */
  const handleNewChat = () => {
    onClose();
    // Use a unique key to force a state reset on the home page
    router.push(`/?new-chat=${Date.now()}`);
  };
  
  /**
   * Signs the user out of the application.
   */
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onClose();
    // Redirect to home page after signing out to reset app state
    router.push("/"); 
  };

  // --- REVERTED MENU ORDER with Feedback link in the list ---
  const menuItems = [
    { href: "/about", label: "About Umbil" },
    { href: "/cpd", label: "My CPD", requiresAuth: true },
    { href: "/pdp", label: "My PDP", requiresAuth: true },
    { href: "/profile", label: "My Profile", requiresAuth: true },
    { href: "/pro", label: "Umbil Pro ✨", requiresAuth: false }, 
    { href: "/settings", label: "Settings" },
    // Reinstated in the list
    { href: "/settings/feedback", label: "Send Feedback" }, 
  ];
  // -------------------------------------------------------------

  // Only show auth-gated links if the user is logged in
  const filteredMenuItems = menuItems.filter(item => !item.requiresAuth || userEmail);

  return (
    <>
      {/* Dark overlay that closes the sidebar when clicked outside */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <div className={`sidebar ${isOpen ? "is-open" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="sidebar-header">
          <h3 className="text-lg font-semibold">Navigation</h3>
          <button onClick={onClose} className="menu-button">
            {/* Close icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <button className="new-chat-button" onClick={handleNewChat}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg>
          New Chat
        </button>

        {/* --- MODIFIED: Streak Display is now a Link --- */}
        {userEmail && !streaksLoading && currentStreak > 0 && (
            <Link
                href="/profile"
                className={`streak-display-sidebar ${!hasLoggedToday ? 'faded-streak' : ''}`}
                onClick={onClose}
                title="Click to view your profile"
            >
                <span style={{fontWeight: 700}}>
                    🔥 CPD Streak: {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
                </span>
            </Link>
        )}
        {/* --- END MODIFICATION --- */}
        
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
        </nav>
        
        {/* Removed: Dedicated Feedback Section footer-group */}
        
        {/* START: User Profile and Sign Out Section */}
        {userEmail && profile && (
            // Reinstated padding and top border on the profile section
            <div style={{ padding: '16px 0', borderTop: '1px solid var(--umbil-divider)', marginTop: 'auto' }}>
                <div className="profile-info-sidebar">
                    {/* Display Full Name if available, otherwise fallback to email/default */}
                    <span className="user-name">{profile.full_name || email || 'User Profile'}</span> 
                    {profile.grade && <span className="user-role">{profile.grade}</span>}
                </div>
                <button 
                    className="btn btn--outline" 
                    onClick={handleSignOut}
                    style={{ marginTop: '12px', width: '100%' }}
                >
                    Sign out
                </button>
            </div>
        )}

        {/* DARK MODE TOGGLE FIX: Restored the exact JSX structure required for the switch CSS */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--umbil-divider)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 500 }}>
              {isDarkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </span>
            {/* CORRECTED SWITCH STRUCTURE */}
            <label className="switch">
              <input type="checkbox" checked={isDarkMode} onChange={toggleDarkMode} />
              <span className="slider round"></span>
            </label>
        </div>
        {/* END: Footer Section */}
      </div>
      
      {/* The switch CSS styles remain in the global JSX style block */}
      <style jsx global>{`
        /* Custom styles for profile in sidebar */
        .profile-info-sidebar {
            display: flex;
            flex-direction: column;
            padding: 0 16px;
            margin-bottom: 8px;
        }
        .profile-info-sidebar .user-name {
            font-weight: 600;
            font-size: 1rem;
            color: var(--umbil-text);
        }
        .profile-info-sidebar .user-role {
            font-size: 0.8rem;
            color: var(--umbil-muted);
            margin-top: 4px;
        }
        
        /* NEW STREAK DISPLAY STYLE */
        .streak-display-sidebar {
            padding: 12px 16px;
            font-size: 1rem;
            color: var(--umbil-brand-teal);
            background-color: var(--umbil-hover-bg);
            border-radius: var(--umbil-radius-sm);
            margin: 0 0 16px 0;
            text-align: center;
            transition: opacity 0.3s, background-color 0.2s;
            display: block; /* Make the link a block element */
            text-decoration: none; /* Remove link underline */
            cursor: pointer;
        }

        .streak-display-sidebar:hover {
            background-color: var(--umbil-divider); /* Add a subtle hover */
        }

        .streak-display-sidebar.faded-streak {
             opacity: 0.5; /* Fades the streak if today's log is missing */
        }
        /* End NEW STREAK DISPLAY STYLE */
        
        /* Removed: New style for the feedback button group to ensure spacing consistency */

        /* The switch - the box around the slider */
        .switch {
          position: relative;
          display: inline-block;
          width: 40px;
          height: 24px;
        }

        /* Hide default HTML checkbox */
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        /* The slider */
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--umbil-card-border);
          transition: 0.4s;
          border-radius: 24px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 4px;
          bottom: 4px;
          background-color: var(--umbil-surface);
          transition: 0.4s;
          border-radius: 50%;
        }

        input:checked + .slider {
          background-color: var(--umbil-brand-teal);
        }

        input:checked + .slider:before {
          transform: translateX(16px);
        }
        
        /* Dark mode specific slider color */
        .dark .slider {
             background-color: var(--umbil-divider);
        }

        .dark .slider:before {
             background-color: var(--umbil-hover-bg);
        }
      `}</style>
    </>
  );
}