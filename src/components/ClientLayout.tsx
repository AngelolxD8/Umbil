// src/components/ClientLayout.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { ThemeProvider } from "@/hooks/useTheme";
import AuthButtons from "@/components/AuthButtons";
import MobileNav from "@/components/MobileNav";
import { useUserEmail } from "@/hooks/useUser";
import { useCpdStreaks } from "@/hooks/useCpdStreaks";
import { Analytics } from "@vercel/analytics/react";
import styles from "./ClientLayout.module.css";

// --- Helper Component for Streak ---
function GlobalStreakDisplay() {
  const { email } = useUserEmail();
  const { currentStreak, hasLoggedToday, loading } = useCpdStreaks();

  if (loading || !email) return null;

  const streakDisplay = currentStreak > 0 ? currentStreak : 0;
  // NOTE: global-streak is a shared utility class remaining in globals.css
  const className = `global-streak ${hasLoggedToday ? '' : 'faded'}`;
  const title = hasLoggedToday 
    ? "You've captured learning today! Click to view your profile." 
    : "Capture learning today to keep your streak alive! Click to view your profile.";

  return (
    <Link href="/profile" className={className} title={title}>
      {streakDisplay} 🔥
    </Link>
  );
}

// --- Main Wrapper ---
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { email } = useUserEmail();

  return (
    <ThemeProvider>
      <div id="root" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
        <header className={styles.header} style={{ flexShrink: 0 }}>
          <div className={styles.headerLeft}>
            <button
              id="tour-highlight-sidebar-button"
              className={styles.menuButton}
              aria-label="Open sidebar menu"
              onClick={() => setIsMobileNavOpen(true)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className={styles.logoSection}>
            {/* LOGIC CHANGE: If logged in, go to Dashboard. If not, go to Landing Page. */}
            <Link href={email ? "/dashboard" : "/"} className={styles.logoLink}>
              <h2 className={styles.umbilLogoText}>Umbil</h2>
              <p className={styles.tagline}>Your Medical Lifeline</p>
            </Link>
          </div>

          <div className={styles.headerRight}>
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
    </ThemeProvider>
  );
}