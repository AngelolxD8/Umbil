"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserEmail } from "@/hooks/useUser";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import DemoPhone from "./landing/DemoPhone";
import { 
  ProductShowcase, 
  CoreTools, 
  CaptureLearning, 
  FinalCTA, 
  Footer 
} from "./landing/LandingSections";

export default function LandingPage() {
  const { email, loading } = useUserEmail();
  const router = useRouter();

  // Redirect logged-in users
  useEffect(() => {
    if (!loading && email) {
      router.replace("/dashboard");
    }
  }, [loading, email, router]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 overflow-x-hidden font-sans selection:bg-[var(--umbil-brand-teal)]/30 selection:text-teal-900 dark:selection:text-teal-50 transition-colors duration-300">
      
      {/* --- MODERN BACKGROUND --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Subtle Gradient Mesh */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[var(--umbil-brand-teal)]/10 dark:bg-[var(--umbil-brand-teal)]/20 rounded-full blur-[120px] opacity-30 dark:opacity-20 mix-blend-multiply dark:mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-200/40 dark:bg-indigo-900/20 rounded-full blur-[100px] opacity-40 dark:opacity-30 mix-blend-multiply dark:mix-blend-screen"></div>
        {/* Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)]"></div>
      </div>

      <div className="relative z-10">
        
        {/* --- 1. HERO SECTION --- */}
        <section className="pt-48 pb-40 lg:pt-60 lg:pb-52 px-6">
          <div className="container mx-auto max-w-7xl grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            
            {/* Left: Copy */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              {/* Credibility Chips */}
              <div className="flex flex-wrap gap-3 mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider backdrop-blur-sm shadow-sm dark:shadow-none">
                  <span className="w-2 h-2 rounded-full bg-[var(--umbil-brand-teal)] animate-pulse"></span>
                  Live in Browser
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider backdrop-blur-sm shadow-sm dark:shadow-none">
                  No Install Needed
                </div>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-8">
                The Clinical Assistant for <span className="text-[var(--umbil-brand-teal)]">High-Pressure Shifts.</span>
              </h1>
              
              <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed max-w-lg font-light">
                Paste rough notes. Get a calm, consultant-ready document in seconds.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/dashboard" className="px-8 py-4 bg-[var(--umbil-brand-teal)] hover:opacity-90 !text-white font-bold rounded-xl shadow-[0_0_40px_-10px_rgba(20,184,166,0.3)] transition-all transform hover:-translate-y-1 flex items-center gap-2 group text-lg">
                  Try it in Clinic
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                </Link>
                <Link href="/dashboard?tour=true&forceTour=true" className="px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 text-lg shadow-sm">
                  See how it works
                </Link>
              </div>

              <div className="mt-12 flex items-center gap-6 text-sm text-slate-500 dark:text-slate-500 font-medium">
                <span className="flex items-center gap-2"><CheckCircle2 size={18} className="text-[var(--umbil-brand-teal)]" /> Built for UK workflow</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={18} className="text-[var(--umbil-brand-teal)]" /> Zero IT permissions</span>
              </div>
            </motion.div>

            {/* Right: Phone Demo Component */}
            <DemoPhone />

          </div>
        </section>

        {/* --- OTHER SECTIONS --- */}
        <ProductShowcase />
        <CoreTools />
        <CaptureLearning />
        <FinalCTA />
        <Footer />

      </div>
    </div>
  );
}