import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// --- SEO METADATA ---
export const metadata: Metadata = {
  title: "Umbil | Clinical Learning Tool & CPD Automation for UK Doctors",
  description: "The AI medical co-pilot for UK clinicians. Automate your CPD, generate GMC reflections instantly, and get evidence-based answers from NICE & CKS.",
  keywords: [
    "Umbil AI",
    "clinical learning tool",
    "clinical learning platform UK",
    "medical education AI",
    "CPD tool for doctors UK",
    "CPD automation UK",
    "GMC reflection tool",
    "GMC reflective template",
    "appraisal preparation tool",
    "ARCP preparation tool",
    "medical CPD app",
    "CPD for GPs",
    "CPD for FY2",
    "trainee doctor learning tool",
    "NICE clinical summaries",
    "Umbil medical",
    "Umbil CPD"
  ],
  openGraph: {
    title: "Umbil | Clinical Learning Tool & CPD Automation",
    description: "Turn clinical questions into CPD instantly. The AI co-pilot for UK doctors.",
    url: "https://umbil.co.uk",
    siteName: "Umbil",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Umbil - Your Medical Education Lifeline",
    description: "Automated CPD and Clinical Intelligence for UK Doctors.",
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
        style={{ height: '100dvh', overflow: 'hidden', margin: 0 }}
      >
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}