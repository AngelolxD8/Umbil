import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavTabs from "@/components/NavTabs";
import AuthButtons from "@/components/AuthButtons";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Umbil – Your Medical Co-Pilot",
  description: "Clinical intelligence, reflection, and CPD — re-imagined for modern medicine.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* New Header */}
        <header className="header">
          <div className="header-left">
            <button className="menu-button" aria-label="Open sidebar menu">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <div className="logo-section">
            <img src="/umbil_logo.png" alt="Umbil Logo" style={{ height: '36px', marginRight: '10px' }} />
            <h2 style={{ fontSize: '24px', fontWeight: '600' }}>Umbil</h2>
            <p className="tagline" style={{ fontSize: '14px', marginLeft: '10px' }}>Your Medical Co-Pilot</p>
          </div>
          <div className="header-right">
            <button className="login-button">Log in</button>
          </div>
        </header>
        
        <main>{children}</main>
      </body>
    </html>
  );
}