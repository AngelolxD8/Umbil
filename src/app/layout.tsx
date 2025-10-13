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
        {/* Header */}
        <header className="header">
          <div className="container">
            <div className="flex items-center justify-between">
              <div className="logo">
                <img src="/umbil_logo.png" alt="Umbil Logo" style={{ height: '40px' }} />
                <h1>Umbil</h1>
                <p className="tagline">Your Medical Co-Pilot</p>
              </div>

              {/* Auth-aware user section */}
              <div className="user-profile">
                <AuthButtons />
              </div>
            </div>
          </div>
        </header>

        {/* Nav Tabs */}
        <NavTabs />

        {/* Page content */}
        <main>{children}</main>
      </body>
    </html>
  );
}