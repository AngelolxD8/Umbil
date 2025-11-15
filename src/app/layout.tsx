// src/app/layout.tsx
"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { useState, useEffect, useCallback } from "react";
import "./globals.css";
import AuthButtons from "@/components/AuthButtons";
import MobileNav from "@/components/MobileNav";
import Link from "next/link";
import { useUserEmail } from "@/hooks/useUser";
import { useCpdStreaks } from "@/hooks/useCpdStreaks";
import { Analytics } from "@vercel/analytics/react"; // <-- 1. IMPORT VERCEL ANALYTICS

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// --- NEW Component for Global Streak Display ---
function GlobalStreakDisplay() {
    const { email } = useUserEmail();
    // Fetch only the necessary streak data
    const { currentStreak, hasLoggedToday, loading } = useCpdStreaks(); 
    
    if (loading || !email) return null;

    const streakDisplay = currentStreak > 0 ? currentStreak : 0;
    
    // Determine the style based on whether today's log exists
    const className = `global-streak ${hasLoggedToday ? '' : 'faded'}`;
    const title = hasLoggedToday ? "You've logged CPD today! Click to view your profile." : "Log CPD today to keep your streak alive! Click to view your profile.";
    
    return (
        <Link 
          href="/profile" 
          className={className} 
          title={title}
        >
            {streakDisplay} 🔥
        </Link>
    );
}
// -----------------------------------------------

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { email } = useUserEmail(); 
  
  // Dark mode state and setter
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Hook to safely get initial state from localStorage and respect system preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme) {
        setIsDarkMode(storedTheme === 'dark');
      } else {
        // Fallback to system preference
        setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
      }
    }
  }, []);

  // Handler to toggle and persist the theme
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('theme', newMode ? 'dark' : 'light');
      return newMode;
    });
  }, []);

  // Determine the body class based on dark mode state
  const bodyClassName = `${geistSans.variable} ${geistMono.variable} antialiased ${isDarkMode ? 'dark' : ''}`;

  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={bodyClassName}
      >
        <div id="root">
          <header className="header">
            <div className="header-left">
              <button
                className="menu-button"
                aria-label="Open sidebar menu"
                onClick={() => setIsMobileNavOpen(true)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="logo-section">
              <Link href="/?new-chat=true" className="flex items-center" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <h2 className="umbil-logo-text" style={{ fontSize: '24px', fontWeight: '600' }}>Umbil</h2>
                <p className="tagline" style={{ fontSize: '14px', marginLeft: '10px', marginBottom: '3px' }}>Your Medical Lifeline</p>
              </Link>
            </div>
            <div className="header-right">
              {/* Global Streak Display placed before AuthButtons */}
              <GlobalStreakDisplay />
              <AuthButtons />
            </div>
          </header>

          <main>{children}</main>
          <MobileNav 
            isOpen={isMobileNavOpen} 
            onClose={() => setIsMobileNavOpen(false)} 
            userEmail={email} 
            isDarkMode={isDarkMode} 
            toggleDarkMode={toggleDarkMode} 
          />
        </div>
        <Analytics /> {/* <-- 2. ADD THE ANALYTICS COMPONENT HERE */}
      </body>
    </html>
  );
}