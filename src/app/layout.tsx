// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// --- SEO METADATA (Updated for Organic Growth Playbook) ---
export const metadata: Metadata = {
  metadataBase: new URL("https://umbil.co.uk"),
  title: "Umbil | Clinical Workflow Assistant & Referral Writer",
  description: "Clinical workflow optimisation tool",
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
    description: "Clinical workflow optimisation tool",
    url: "https://umbil.co.uk",
    siteName: "Umbil",
    locale: "en_GB",
    type: "website",
    images: [
      {
        url: "/umbil_logo.png.png",
        width: 1200,
        height: 630,
        alt: "Umbil Clinical Workflow Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Umbil - The Clinical Workflow Assistant",
    description: "Clinical workflow optimisation tool",
    images: ["/umbil_logo.png.png"],
  },
  verification: {
    google: "Cq148L5NeSJqEJnPluhkDGCJhazxBkdFt5H3VrXqvI4",
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}