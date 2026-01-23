// src/components/LandingPage.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserEmail } from "@/hooks/useUser";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, 
  FileText, 
  Shield, 
  Activity, 
  CheckCircle2, 
  Zap, 
  ChevronRight,
  Sparkles,
  Lock,
  Menu,
  Languages,
  MessageSquare,
  Search
} from "lucide-react";

// --- LIVE DEMO DATA (Short & Punchy) ---
const DEMO_SCENARIOS = [
  {
    id: "referral",
    label: "Referral",
    icon: <FileText className="w-3 h-3" />,
    input: "54M, dysphagia to solids 6wks. Food sticks mid-chest. 6kg wt loss. Ex-smoker. No haem/melaena. On omeprazole. No scope.",
    output: "Dear Colleague,\n\nI would be grateful for your assessment of this 54-year-old gentleman with a six-week history of progressive dysphagia to solids. He describes food sticking in the mid-chest and has lost approximately 6 kg unintentionally.\n\nHe is an ex-smoker taking omeprazole. There is no history of haematemesis or melaena.\n\nGiven the red flag symptoms, I would appreciate your urgent investigation."
  },
  {
    id: "sbar",
    label: "SBAR",
    icon: <Activity className="w-3 h-3" />,
    input: "78F on ward. CAP. NEWS 3->6. O2 req 2L->4L. Known COPD. On IV abx. No ABG.",
    output: "Situation\n78-year-old female with CAP. NEWS score increased to 6. Rising oxygen requirements.\n\nBackground\nKnown COPD. On IV antibiotics.\n\nAssessment\nO2 requirement up to 4L. Breathless. No ABG yet.\n\nRecommendation\nUrgent review required. Consider ABG and escalation."
  },
  {
    id: "safetynet",
    label: "Safety Net",
    icon: <Shield className="w-3 h-3" />,
    input: "Chest discomfort. Normal ECG. No red flags. Conservative mgmt.",
    output: "Advised to seek urgent help if pain becomes severe, prolonged, or associated with breathlessness, collapse, or radiation to arm or jaw.\nTo re-present if symptoms worsen."
  }
];

export default function LandingPage() {
  const { email, loading } = useUserEmail();
  const router = useRouter();
  const [activeScenario, setActiveScenario] = useState(0);
  const [displayedInput, setDisplayedInput] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  // Redirect logged-in users
  useEffect(() => {
    if (!loading && email) {
      router.replace("/dashboard");
    }
  }, [loading, email, router]);

  // Typing Effect Logic
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const currentScenario = DEMO_SCENARIOS[activeScenario];
    
    // Reset
    setDisplayedInput("");
    setIsTyping(true);

    let charIndex = 0;
    
    const typeChar = () => {
      if (charIndex < currentScenario.input.length) {
        setDisplayedInput(currentScenario.input.slice(0, charIndex + 1));
        charIndex++;
        // Faster typing speed (10-25ms)
        timeout = setTimeout(typeChar, 10 + Math.random() * 15); 
      } else {
        setIsTyping(false);
        // Wait 4 seconds to read output before switching
        timeout = setTimeout(() => {
          setActiveScenario((prev) => (prev + 1) % DEMO_SCENARIOS.length);
        }, 4000); 
      }
    };

    timeout = setTimeout(typeChar, 300);

    return () => clearTimeout(timeout);
  }, [activeScenario]);

  return (
    <div className="min-h-screen bg-[var(--umbil-bg)] text-[var(--umbil-text)] selection:bg-[var(--umbil-brand-teal)]/20 selection:text-[var(--umbil-text)] overflow-x-hidden font-sans">
      
      {/* --- BACKGROUND ELEMENTS --- */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[linear-gradient(to_right,rgba(128,128,128,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(128,128,128,0.05)_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="fixed top-0 left-0 right-0 h-32 bg-gradient-to-b from-[var(--umbil-surface)] to-transparent z-10 pointer-events-none"></div>

      <div className="relative z-10">
        
        {/* --- 1. HERO SECTION (Workflow First) --- */}
        <section className="pt-20 pb-32 px-6">
          <div className="container mx-auto max-w-7xl grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left: Copy */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              {/* Credibility Chips - Safer & Specific */}
              <div className="flex flex-wrap gap-2 mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">
                  Runs in your browser
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">
                  No install required
                </div>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-[var(--umbil-text)] leading-[1.1] mb-6">
                The Clinical Assistant for <span className="text-[var(--umbil-brand-teal)]">High-Pressure Shifts.</span>
              </h1>
              
              <p className="text-lg md:text-xl text-[var(--umbil-text)] opacity-80 mb-10 leading-relaxed max-w-lg">
                Paste rough notes. Get a calm, consultant-ready document in seconds.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/dashboard" className="px-8 py-4 bg-[var(--umbil-brand-teal)] hover:opacity-90 text-white font-bold rounded-md shadow-xl shadow-[var(--umbil-brand-teal)]/20 transition-all transform hover:-translate-y-1 flex items-center gap-2 group text-lg">
                  Try it in Clinic
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                </Link>
                <Link href="/dashboard?tour=true&forceTour=true" className="px-8 py-4 bg-[var(--umbil-surface)] border border-[var(--umbil-card-border)] text-[var(--umbil-text)] font-semibold rounded-md hover:bg-[var(--umbil-hover-bg)] transition-colors flex items-center gap-2 text-lg">
                  See how it works
                </Link>
              </div>

              <div className="mt-10 flex items-center gap-4 text-sm text-[var(--umbil-text)] opacity-60 font-medium">
                <span className="flex items-center gap-1.5"><CheckCircle2 size={16} /> Built for UK workflow</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 size={16} /> Zero IT permissions</span>
              </div>
            </motion.div>

            {/* Right: Live Interactive Demo (Mobile Frame) */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative flex justify-center lg:justify-end"
            >
               {/* Phone Frame */}
               <div className="relative border-gray-900 bg-gray-900 border-[12px] rounded-[3rem] h-[640px] w-[320px] shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/10">
                 {/* Camera / Speaker Notch */}
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[20px] w-[120px] bg-gray-900 rounded-b-xl z-20"></div>

                 {/* Screen Content */}
                 <div className="flex-1 bg-[var(--umbil-surface)] overflow-hidden flex flex-col w-full h-full relative">
                    
                    {/* Fake Browser Address Bar - Added pt-12 to clear notch */}
                    <div className="bg-[var(--umbil-hover-bg)] p-3 pt-12 pb-3 border-b border-[var(--umbil-card-border)] flex items-center justify-between gap-2 z-10">
                      <Menu size={16} className="text-[var(--umbil-muted)]" />
                      <div className="flex-1 bg-[var(--umbil-surface)] rounded-full h-8 flex items-center justify-center px-4 shadow-sm border border-[var(--umbil-card-border)]">
                         <Lock size={10} className="text-emerald-500 mr-1.5" />
                         <span className="text-xs font-medium text-[var(--umbil-text)]">umbil.co.uk</span>
                      </div>
                      <div className="w-4" /> {/* Spacer */}
                    </div>

                    {/* App Interface Inside Phone */}
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col">
                      
                      {/* Mobile Tabs - Snapping Active State */}
                      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide no-scrollbar -mx-2 px-2">
                        {DEMO_SCENARIOS.map((scenario, idx) => (
                          <button
                            key={scenario.id}
                            onClick={() => setActiveScenario(idx)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                              activeScenario === idx 
                                ? 'bg-[var(--umbil-text)] text-[var(--umbil-surface)] ring-2 ring-[var(--umbil-brand-teal)] shadow-md translate-y-[-1px]' 
                                : 'bg-[var(--umbil-hover-bg)] text-[var(--umbil-text)] border border-[var(--umbil-card-border)] opacity-60 hover:opacity-100'
                            }`}
                          >
                            {scenario.icon}
                            {scenario.label}
                          </button>
                        ))}
                      </div>

                      {/* Input Area */}
                      <div className="space-y-2 mb-2">
                        <label className="text-[10px] font-bold text-[var(--umbil-muted)] uppercase tracking-wider">Clinical Notes</label>
                        <div className="bg-[var(--umbil-hover-bg)] p-3 rounded-lg border border-[var(--umbil-card-border)] text-[var(--umbil-text)] font-mono text-xs min-h-[100px] whitespace-pre-wrap leading-relaxed shadow-inner opacity-80">
                          {displayedInput}
                          <span className="animate-pulse inline-block w-1.5 h-3 bg-[var(--umbil-brand-teal)] align-middle ml-0.5" />
                        </div>
                      </div>

                      {/* Direction Arrow */}
                      <div className="flex justify-center my-1">
                        <ArrowRight className="rotate-90 text-[var(--umbil-brand-teal)]" size={16} />
                      </div>

                      {/* Output Area */}
                      <div className="space-y-2 flex-1 flex flex-col min-h-0">
                         <label className="text-[10px] font-bold text-[var(--umbil-brand-teal)] uppercase tracking-wider flex items-center gap-1">
                           <Sparkles size={10} />
                           Result
                         </label>
                         <div className="relative flex-1 rounded-lg overflow-hidden border border-[var(--umbil-brand-teal)]/20 bg-[var(--umbil-brand-teal)]/5">
                            <AnimatePresence mode="wait">
                              {!isTyping && (
                                <motion.div 
                                  key={activeScenario}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="absolute inset-0 p-3 overflow-y-auto text-[var(--umbil-text)] text-xs leading-relaxed whitespace-pre-wrap font-medium"
                                >
                                  {DEMO_SCENARIOS[activeScenario].output}
                                </motion.div>
                              )}
                            </AnimatePresence>
                            
                            {isTyping && (
                              <div className="absolute inset-0 flex items-center justify-center bg-[var(--umbil-surface)]/50 backdrop-blur-[1px]">
                                <div className="flex gap-1">
                                  <span className="w-1.5 h-1.5 bg-[var(--umbil-brand-teal)] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                  <span className="w-1.5 h-1.5 bg-[var(--umbil-brand-teal)] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                  <span className="w-1.5 h-1.5 bg-[var(--umbil-brand-teal)] rounded-full animate-bounce"></span>
                                </div>
                              </div>
                            )}
                         </div>
                      </div>

                    </div>
                    
                    {/* Bottom Home Indicator */}
                    <div className="h-1 w-1/3 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-2" />
                 </div>
               </div>
            </motion.div>
          </div>
        </section>

        {/* --- 2. CORE TOOLS (The Wedge) --- */}
        <section className="py-32 px-6 bg-[var(--umbil-hover-bg)] border-y border-[var(--umbil-card-border)]">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--umbil-text)] mb-4">Tools you actually use in clinic.</h2>
              <p className="text-lg text-[var(--umbil-text)] opacity-80 max-w-2xl mx-auto">
                We don&apos;t sell &quot;learning&quot;. We sell survival. Use these tools to clear your patient list faster.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Feature 1: Referral Writer */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-[var(--umbil-surface)] p-6 rounded-lg border border-[var(--umbil-card-border)] shadow-sm hover:shadow-xl transition-all flex flex-col"
              >
                <div className="w-10 h-10 bg-[var(--umbil-brand-teal)]/10 rounded-md flex items-center justify-center text-[var(--umbil-brand-teal)] mb-4">
                  <FileText size={20} />
                </div>
                <h3 className="text-lg font-bold text-[var(--umbil-text)] mb-2">Referral Writer</h3>
                <p className="text-sm text-[var(--umbil-text)] opacity-70 leading-relaxed mb-2 flex-grow">
                  Shorthand → consultant-ready referral in UK GP voice.
                </p>
              </motion.div>

              {/* Feature 2: Safety Net */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-[var(--umbil-surface)] p-6 rounded-lg border border-[var(--umbil-card-border)] shadow-sm hover:shadow-xl transition-all flex flex-col"
              >
                <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 rounded-md flex items-center justify-center text-rose-500 mb-4">
                  <Shield size={20} />
                </div>
                <h3 className="text-lg font-bold text-[var(--umbil-text)] mb-2">Safety Net</h3>
                <p className="text-sm text-[var(--umbil-text)] opacity-70 leading-relaxed mb-2 flex-grow">
                  4 crisp red flags + what to do next.
                </p>
              </motion.div>

              {/* Feature 3: SBAR Handover */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-[var(--umbil-surface)] p-6 rounded-lg border border-[var(--umbil-card-border)] shadow-sm hover:shadow-xl transition-all flex flex-col"
              >
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-md flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                  <Activity size={20} />
                </div>
                <h3 className="text-lg font-bold text-[var(--umbil-text)] mb-2">SBAR Handover</h3>
                <p className="text-sm text-[var(--umbil-text)] opacity-70 leading-relaxed mb-2 flex-grow">
                  Messy notes → clean SBAR in seconds.
                </p>
              </motion.div>

              {/* Feature 4: Patient Translator */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-[var(--umbil-surface)] p-6 rounded-lg border border-[var(--umbil-card-border)] shadow-sm hover:shadow-xl transition-all flex flex-col"
              >
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-md flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                  <Languages size={20} />
                </div>
                <h3 className="text-lg font-bold text-[var(--umbil-text)] mb-2">Translator</h3>
                <p className="text-sm text-[var(--umbil-text)] opacity-70 leading-relaxed mb-2 flex-grow">
                  Clinical text → patient-friendly explanation.
                </p>
              </motion.div>

            </div>
          </div>
        </section>

        {/* --- 3. GUIDELINE Q&A (Secondary Hook) --- */}
        <section className="py-24 px-6 bg-[var(--umbil-surface)]">
          <div className="container mx-auto max-w-4xl text-center">
            <h3 className="text-2xl font-bold text-[var(--umbil-text)] mb-4">
              Or just ask a question.
            </h3>
            <p className="text-[var(--umbil-text)] opacity-70 mb-4 max-w-xl mx-auto">
              Ask quick clinical questions and get summaries based on UK sources (NICE/CKS/SIGN/BNF where available).
            </p>
            
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {[
                "Red flags for headache?", 
                "Management of CAP in elderly?", 
                "DOAC dosing for AF with renal impairment?"
              ].map((q, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-3 bg-[var(--umbil-hover-bg)] border border-[var(--umbil-card-border)] rounded-full text-sm font-medium text-[var(--umbil-text)] hover:border-[var(--umbil-brand-teal)] transition-colors cursor-default shadow-sm">
                  <Search size={14} className="text-[var(--umbil-muted)]" />
                  {q}
                </div>
              ))}
            </div>
            
            <p className="text-xs text-[var(--umbil-muted)] uppercase tracking-wider font-semibold">
              Always verifies context • Links to sources
            </p>
          </div>
        </section>

        {/* --- 4. CAPTURE LEARNING (The Quiet By-Product) --- */}
        <section className="py-32 px-6 bg-[var(--umbil-bg)] border-t border-[var(--umbil-card-border)]">
          <div className="container mx-auto max-w-5xl">
            <div className="bg-slate-900 rounded-2xl p-8 md:p-16 text-white overflow-hidden relative shadow-2xl border border-slate-800 flex flex-col md:flex-row items-center gap-12">
              
              {/* Content */}
              <div className="relative z-10 flex-1">
                <div className="inline-block px-3 py-1 bg-[var(--umbil-brand-teal)]/20 border border-[var(--umbil-brand-teal)]/30 rounded-full text-[var(--umbil-brand-teal)] text-xs font-bold mb-6">
                  THE QUIET BY-PRODUCT
                </div>
                <h3 className="text-3xl md:text-4xl font-extrabold mb-6">Capture Learning.</h3>
                <p className="text-slate-400 text-lg leading-relaxed mb-8">
                  Umbil can turn real clinical work into structured learning entries when you choose. No more midnight admin panic before your appraisal.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-sm font-medium text-slate-300">
                    <CheckCircle2 size={16} className="text-[var(--umbil-brand-teal)]" />
                    Log learning from real cases
                  </li>
                  <li className="flex items-center gap-3 text-sm font-medium text-slate-300">
                    <CheckCircle2 size={16} className="text-[var(--umbil-brand-teal)]" />
                    One-click reflection assistant
                  </li>
                  <li className="flex items-center gap-3 text-sm font-medium text-slate-300">
                    <CheckCircle2 size={16} className="text-[var(--umbil-brand-teal)]" />
                    Exports to appraisal PDF & SOAR
                  </li>
                </ul>
              </div>

              {/* Visual: Card */}
              <div className="relative z-10 w-full md:w-80 bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/10 shadow-2xl transform md:rotate-3 transition-transform hover:rotate-0">
                 <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-4">
                   <div className="w-10 h-10 rounded-full bg-[var(--umbil-brand-teal)] flex items-center justify-center text-slate-900 font-bold shadow-lg">✓</div>
                   <div>
                     <div className="text-sm font-bold text-white">Learning Captured</div>
                     <div className="text-xs text-slate-400">Just now • Clinical Management</div>
                   </div>
                 </div>
                 <div className="space-y-3 opacity-60">
                   <div className="h-2 bg-white rounded w-3/4"></div>
                   <div className="h-2 bg-white rounded w-full"></div>
                   <div className="h-2 bg-white rounded w-5/6"></div>
                 </div>
                 <div className="mt-6 flex gap-2">
                   <div className="text-[10px] font-bold text-white bg-white/10 px-2 py-1 rounded">Domain 1</div>
                   <div className="text-[10px] font-bold text-white bg-white/10 px-2 py-1 rounded">Domain 2</div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- 5. PATIENT FEEDBACK (PSQ) --- */}
        <section className="py-24 px-6 bg-[var(--umbil-hover-bg)]">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageSquare size={24} />
            </div>
            <h3 className="text-2xl font-bold text-[var(--umbil-text)] mb-4">Patient feedback, without the paper chase.</h3>
            <p className="text-[var(--umbil-text)] opacity-70 mb-8 max-w-xl mx-auto">
              Run digital PSQ cycles effortlessly. Track progress toward your response target and export a simple report for your appraisal.
            </p>
            <Link href="/auth?intent=waitlist" className="inline-flex items-center gap-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors px-6 py-3 rounded-full shadow-lg shadow-indigo-500/20">
              Join PSQ Waitlist
            </Link>
          </div>
        </section>

        {/* --- 6. TRUST & SAFETY --- */}
        <section className="py-32 px-6 bg-[var(--umbil-surface)] border-t border-[var(--umbil-card-border)]">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-[var(--umbil-text)] mb-4">Built to be boring. On purpose.</h2>
              <p className="text-[var(--umbil-text)] opacity-70">
                We prioritise clinical safety over clever features.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-10">
              {[
                { title: "No Hallucinated Vitals", desc: "Never invents observations, results, or clinical findings. If you didn't type it, we won't write it." },
                { title: "Medication Safety Lock", desc: "No dosing instructions unless explicitly provided in your notes context." },
                { title: "Emergency Flags", desc: "Recognises clear red flags (like Chest Pain + Sweating) and prompts for emergency action instead of drafting paperwork." },
                { title: "Context First", desc: "Prioritises retrieved context from guidelines and labels consensus vs. general information." }
              ].map((item, i) => (
                <div key={i} className="flex gap-5">
                  <div className="mt-1 min-w-[24px]">
                    <Lock size={24} className="text-[var(--umbil-muted)]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[var(--umbil-text)] text-base mb-2">{item.title}</h4>
                    <p className="text-sm text-[var(--umbil-text)] opacity-70 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- FINAL CTA --- */}
        <section className="py-40 px-6 text-center bg-[var(--umbil-bg)] border-t border-[var(--umbil-card-border)]">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--umbil-text)] mb-8">Think less. Do more.</h2>
            <p className="text-xl text-[var(--umbil-text)] opacity-70 mb-10 mx-auto">
              Open a tab. Start typing. No installation, no credit card, no permission required.
            </p>
            <Link href="/auth" className="px-10 py-5 bg-[var(--umbil-brand-teal)] hover:opacity-90 text-white text-lg font-bold rounded-md shadow-2xl shadow-[var(--umbil-brand-teal)]/30 inline-flex items-center gap-3 transition-all transform hover:scale-105">
              Start Free Now <ArrowRight />
            </Link>
          </motion.div>
        </section>

        {/* --- FOOTER --- */}
        <footer className="bg-slate-900 text-slate-400 py-16 px-6">
          <div className="container mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-8">
             <div className="flex items-center gap-2 font-bold text-white text-xl">
               <Zap size={20} className="text-[var(--umbil-brand-teal)]" fill="currentColor" /> Umbil
             </div>
             <div className="flex gap-8 text-sm font-medium">
               <Link href="/auth" className="hover:text-white transition-colors">Login</Link>
               <Link href="/about" className="hover:text-white transition-colors">About</Link>
               <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
             </div>
             <div className="text-sm opacity-50">
               © {new Date().getFullYear()} Umbil. Built for the NHS.
             </div>
          </div>
        </footer>

      </div>
    </div>
  );
}