// src/app/layout.tsx
"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { useState, useEffect, useCallback } from "react";
import "./globals.css";
import AuthButtons from "@/components/AuthButtons";
import MobileNav from "@/components/MobileNav";
import WelcomeModal from "@/components/WelcomeModal"; // <-- IMPORT NEW MODAL
import Link from "next/link";
import { useUserEmail } from "@/hooks/useUser";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { email, loading: userLoading } = useUserEmail();
  
  // Dark mode state and setter
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Welcome Modal state
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);

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

  // NEW HOOK: Control Welcome Modal Display
  useEffect(() => {
    // Only run this logic once the user loading status is known
    if (!userLoading) {
      const dismissed = localStorage.getItem('welcome_modal_dismissed');
      
      // Show the modal if:
      // 1. The user is NOT logged in (email is null)
      // 2. The user has NOT previously dismissed the modal
      if (!email && dismissed !== 'true') {
        setIsWelcomeModalOpen(true);
      } else {
        setIsWelcomeModalOpen(false);
      }
    }
  }, [email, userLoading]);

  // Function to dismiss the modal and set the flag in local storage
  const handleDismissWelcomeModal = () => {
    localStorage.setItem('welcome_modal_dismissed', 'true');
    setIsWelcomeModalOpen(false);
  }

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
          {/* NEW WELCOME MODAL */}
          <WelcomeModal
            isOpen={isWelcomeModalOpen}
            onClose={handleDismissWelcomeModal}
            onContinueAnonymously={handleDismissWelcomeModal} // Same action: dismisses the modal
          />
        </div>
      </body>
    </html>
  );
}