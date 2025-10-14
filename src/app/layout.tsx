"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { useState } from "react";
import "./globals.css";
import AuthButtons from "@/components/AuthButtons";
import MobileNav from "@/components/MobileNav";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
              <span role="img" aria-label="stethoscope" className="umbil-logo-emoji">🩺</span>
              <h2 className="umbil-logo-text">Umbil</h2>
              <p className="tagline">Your Medical Lifeline</p>
            </div>
            <div className="header-right">
              <AuthButtons />
            </div>
          </header>

          <main>{children}</main>
          <MobileNav isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />
        </div>
      </body>
    </html>
  );
}