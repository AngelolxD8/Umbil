// src/app/layout.tsx
"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthButtons from "@/components/AuthButtons";
import MobileNav from "@/components/MobileNav";
import Link from "next/link";
import { useUserEmail } from "@/hooks/useUser";
import { useCpdStreaks } from "@/hooks/useCpdStreaks";
import { Analytics } from "@vercel/analytics/react"; 
import { ThemeProvider } from "@/hooks/useTheme";
import { useState } from "react";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

function GlobalStreakDisplay() {
    const { email } = useUserEmail();
    const { currentStreak, hasLoggedToday, loading } = useCpdStreaks(); 
    
    if (loading || !email) return null;

    const streakDisplay = currentStreak > 0 ? currentStreak : 0;
    
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { email } = useUserEmail(); 

  return (
    <html lang="en">
      <ThemeProvider>
        <body
          suppressHydrationWarning
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          style={{ height: '100dvh', overflow: 'hidden', margin: 0 }} 
        >
          <div id="root" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
            <header className="header" style={{ flexShrink: 0 }}>
              <div className="header-left">
                <button
                  id="tour-highlight-sidebar-button" 
                  className="menu-button"
                  aria-label="Open sidebar menu"
                  onClick={() => setIsMobileNavOpen(true)}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              
              {/* UPDATED LOGO SECTION */}
              <div className="logo-section">
                <Link href="/?new-chat=true" className="logo-link">
                  <h2 className="umbil-logo-text">Umbil</h2>
                  <p className="tagline">Your Medical Lifeline</p>
                </Link>
              </div>

              <div className="header-right">
                <GlobalStreakDisplay />
                <AuthButtons />
              </div>
            </header>

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
              {children}
            </main>
            
            <MobileNav 
              isOpen={isMobileNavOpen} 
              onClose={() => setIsMobileNavOpen(false)} 
              userEmail={email} 
            />
          </div>
          <Analytics /> 
        </body>
      </ThemeProvider>
    </html>
  );
}