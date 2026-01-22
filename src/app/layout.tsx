// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Umbil | Clinical Workflow Assistant & Referral Writer",
  description: "The AI co-pilot for high-pressure shifts. Write referrals, generate safety-netting instructions, and draft SBAR handovers instantly.",
  keywords: [
    "Umbil AI",
    "GP referral writer",
    "clinical safety netting tool",
    "SBAR generator",
    "medical scribe UK",
    "clinical decision support",
    "GMC reflection generator",
    "medical handover tool",
    "trainee doctor toolkit",
    "primary care admin automation",
    "Umbil CPD"
  ],
  openGraph: {
    title: "Umbil | Clinical Workflow Assistant",
    description: "Write referrals and handovers in seconds. The survival tool for busy shifts.",
    url: "https://umbil.co.uk",
    siteName: "Umbil",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Umbil - The Clinical Workflow Assistant",
    description: "Referrals, Safety-Netting, and Handovers done in seconds.",
  },
  verification: {
    google: "Cq148L5NeSJqEJnPluhkDGCJhazxBkdFt5H3VrXqvI4",
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ backgroundColor: 'var(--umbil-bg)', color: 'var(--umbil-text)' }}
      >
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}