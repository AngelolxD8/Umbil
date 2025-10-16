"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { useState, useEffect } from "react";
import "./globals.css";
import AuthButtons from "@/components/AuthButtons";
import MobileNav from "@/components/MobileNav";
import Link from "next/link";
import { getMyProfile, Profile } from "@/lib/profile";
import { supabase } from "@/lib/supabase";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setEmail(user.email ?? null);
        const userProfile = await getMyProfile();
        setProfile(userProfile);
      } else {
        setEmail(null);
        setProfile(null);
      }
      setLoading(false);
    };

    fetchUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
              <Link href="/?new-chat=true" className="flex items-center" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <h2 className="umbil-logo-text" style={{ fontSize: '24px', fontWeight: '600' }}>Umbil</h2>
                <p className="tagline" style={{ fontSize: '14px', marginLeft: '10px', marginBottom: '3px' }}>Your Medical Lifeline</p>
              </Link>
            </div>
            <div className="header-right">
              <AuthButtons userEmail={email} userProfile={profile} loading={loading} />
            </div>
          </header>

          <main>{children}</main>
          <MobileNav isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} userEmail={email} />
        </div>
      </body>
    </html>
  );
}