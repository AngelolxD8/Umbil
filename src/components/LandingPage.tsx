"use client";

import Link from "next/link";
import Image from "next/image";
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
  Sparkles,
  Lock,
  Languages,
  Search
} from "lucide-react";

// --- LIVE DEMO DATA ---
const DEMO_SCENARIOS = [
  {
    id: "referral",
    label: "Referral",
    icon: <FileText className="w-3.5 h-3.5" />,
    input: "54M, dysphagia to solids 6wks. Food sticks mid-chest. 6kg wt loss. Ex-smoker. No haem/melaena. On omeprazole. No scope.",
    output: "Dear Colleague,\n\nI would be grateful for your assessment of this 54-year-old gentleman with a six-week history of progressive dysphagia to solids. He describes food sticking in the mid-chest and has lost approximately 6 kg unintentionally.\n\nHe is an ex-smoker taking omeprazole. There is no history of haematemesis or melaena.\n\nGiven the red flag symptoms, I would appreciate your urgent investigation."
  },
  {
    id: "sbar",
    label: "SBAR",
    icon: <Activity className="w-3.5 h-3.5" />,
    input: "78F on ward. CAP. NEWS 3->6. O2 req 2L->4L. Known COPD. On IV abx. No ABG.",
    output: "Situation\n78-year-old female with CAP. NEWS score increased to 6. Rising oxygen requirements.\n\nBackground\nKnown COPD. On IV antibiotics.\n\nAssessment\nO2 requirement up to 4L. Breathless. No ABG yet.\n\nRecommendation\nUrgent review required. Consider ABG and escalation."
  },
  {
    id: "safetynet",
    label: "Safety Net",
    icon: <Shield className="w-3.5 h-3.5" />,
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
        // Natural typing speed variation
        timeout = setTimeout(typeChar, 10 + Math.random() * 20); 
      } else {
        setIsTyping(false);
        // Wait longer to read output before switching
        timeout = setTimeout(() => {
          setActiveScenario((prev) => (prev + 1) % DEMO_SCENARIOS.length);
        }, 5000); 
      }
    };

    timeout = setTimeout(typeChar, 500);

    return () => clearTimeout(timeout);
  }, [activeScenario]);

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

            {/* Right: Modern Sleek Demo (The "Phone" Refined) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative flex justify-center lg:justify-end"
            >
               {/* Glass Device Frame - Sleeker, thinner borders */}
               <div className="relative bg-white dark:bg-slate-950 rounded-[2.5rem] w-full max-w-[360px] h-[680px] shadow-2xl ring-1 ring-black/5 dark:ring-white/10 flex flex-col overflow-hidden border-[6px] border-slate-100 dark:border-slate-800/80 backdrop-blur-xl transition-colors duration-300">
                 
                 {/* Top Status Bar Area */}
                 <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 backdrop-blur-md z-10">
                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest">UMBIL AI</div>
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-500/20"></div>
                      <div className="w-2 h-2 rounded-full bg-yellow-500/20"></div>
                      <div className="w-2 h-2 rounded-full bg-green-500/20"></div>
                    </div>
                 </div>

                 {/* App Interface */}
                 <div className="flex-1 overflow-y-auto p-5 flex flex-col bg-slate-50 dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-950">
                    
                    {/* Mode Selector */}
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
                      {DEMO_SCENARIOS.map((scenario, idx) => (
                        <button
                          key={scenario.id}
                          onClick={() => setActiveScenario(idx)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 border ${
                            activeScenario === idx 
                              ? 'bg-[var(--umbil-brand-teal)]/10 border-[var(--umbil-brand-teal)]/50 text-[var(--umbil-brand-teal)] shadow-sm' 
                              : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {scenario.icon}
                          {scenario.label}
                        </button>
                      ))}
                    </div>

                    {/* Input Area - IMPROVED FONT & LOOK */}
                    <div className="space-y-2 mb-4 group">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between">
                        Raw Notes
                        <span className="text-[var(--umbil-brand-teal)]/70 text-[9px]">Paste anywhere</span>
                      </label>
                      <div className="bg-white dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 text-sm leading-relaxed shadow-sm dark:shadow-inner min-h-[120px] transition-colors group-hover:border-slate-300 dark:group-hover:border-slate-600/50 font-sans">
                        {displayedInput}
                        <span className="animate-pulse inline-block w-0.5 h-4 bg-[var(--umbil-brand-teal)] align-middle ml-0.5" />
                      </div>
                    </div>

                    {/* Processing Indicator */}
                    <div className="flex justify-center my-2">
                      <div className={`transition-all duration-500 ${isTyping ? 'opacity-100 scale-100' : 'opacity-30 scale-90'}`}>
                         <div className="w-8 h-8 rounded-full bg-[var(--umbil-brand-teal)]/10 flex items-center justify-center">
                            <ArrowRight className="text-[var(--umbil-brand-teal)] rotate-90" size={14} />
                         </div>
                      </div>
                    </div>

                    {/* Output Area - Sleek Result */}
                    <div className="space-y-2 flex-1 flex flex-col min-h-0">
                       <label className="text-[10px] font-bold text-[var(--umbil-brand-teal)] uppercase tracking-wider flex items-center gap-1.5">
                         <Sparkles size={12} />
                         Formatted Output
                       </label>
                       <div className="relative flex-1 rounded-xl overflow-hidden border border-[var(--umbil-brand-teal)]/20 bg-[var(--umbil-brand-teal)]/5 dark:bg-gradient-to-br dark:from-[var(--umbil-brand-teal)]/5 dark:to-slate-900/50 shadow-sm dark:shadow-lg">
                          <AnimatePresence mode="wait">
                            {!isTyping && (
                              <motion.div 
                                key={activeScenario}
                                initial={{ opacity: 0, filter: 'blur(4px)' }}
                                animate={{ opacity: 1, filter: 'blur(0px)' }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 p-4 overflow-y-auto text-slate-700 dark:text-slate-300 text-xs leading-relaxed whitespace-pre-wrap font-medium"
                              >
                                {DEMO_SCENARIOS[activeScenario].output}
                              </motion.div>
                            )}
                          </AnimatePresence>
                          
                          {/* Typing Loading State */}
                          {isTyping && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm gap-3">
                              <div className="flex gap-1.5">
                                <span className="w-2 h-2 bg-[var(--umbil-brand-teal)] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-2 h-2 bg-[var(--umbil-brand-teal)] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-2 h-2 bg-[var(--umbil-brand-teal)] rounded-full animate-bounce"></span>
                              </div>
                              <span className="text-[10px] text-[var(--umbil-brand-teal)]/70 font-medium uppercase tracking-widest">Generating</span>
                            </div>
                          )}
                       </div>
                    </div>

                    {/* Bottom Nav Hint */}
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex justify-around text-slate-300 dark:text-slate-600">
                       <div className="w-8 h-1 rounded-full bg-slate-200 dark:bg-slate-700/50"></div>
                    </div>

                 </div>
               </div>
            </motion.div>
          </div>
        </section>

        {/* --- 2. NEW: PRODUCT SHOWCASE (Space & Visuals) --- */}
        <section className="py-48 px-6 overflow-hidden">
          <div className="container mx-auto max-w-6xl">
            <motion.div 
               initial={{ opacity: 0, y: 40 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.8 }}
               className="relative"
            >
              <div className="text-center mb-20">
                 <h2 className="text-lg font-semibold text-[var(--umbil-brand-teal)] tracking-wide uppercase">The Complete Platform</h2>
                 <p className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mt-4">Everything you need. Nothing you don't.</p>
              </div>

              {/* Tilted Perspective Container */}
              <div className="relative group perspective-[2000px]">
                 {/* Glow behind image */}
                 <div className="absolute -inset-1 bg-gradient-to-r from-[var(--umbil-brand-teal)] to-indigo-500 rounded-xl blur-2xl opacity-10 dark:opacity-20 group-hover:opacity-20 dark:group-hover:opacity-30 transition duration-1000"></div>
                 
                 {/* Main Dashboard Image */}
                 <div className="relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-2xl overflow-hidden transform transition-transform duration-700 group-hover:rotate-x-2 group-hover:scale-[1.01]">
                    <Image 
                      src="/dashboard-preview-1.png" 
                      alt="Umbil Dashboard Interface" 
                      width={1400} 
                      height={900}
                      className="w-full h-auto object-cover"
                    />
                    
                    {/* Overlay Gradient for depth (Dark mode only) */}
                    <div className="absolute inset-0 dark:bg-gradient-to-t dark:from-slate-950/80 dark:via-transparent dark:to-transparent pointer-events-none"></div>
                 </div>

                 {/* Floating Mobile Image (Parallax) - FIX: Removed 'hidden lg:block' so it shows on mobile now */}
                 <div className="block absolute -bottom-6 -right-4 lg:-bottom-10 lg:-right-10 w-[140px] lg:w-[240px] rounded-[1.2rem] lg:rounded-[2rem] border-[3px] lg:border-[4px] border-white dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl transform rotate-[-6deg] translate-y-6 lg:translate-y-10 group-hover:translate-y-4 lg:group-hover:translate-y-6 transition duration-700">
                    <Image 
                      src="/dashboard-preview-2.png" 
                      alt="Umbil Mobile Interface" 
                      width={300} 
                      height={600}
                      className="w-full h-auto rounded-[1rem] lg:rounded-[1.8rem]"
                    />
                 </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* --- 3. CORE TOOLS (The Wedge) --- */}
        <section className="py-52 px-6 bg-slate-50 dark:bg-slate-900/30 border-y border-slate-200 dark:border-white/5 backdrop-blur-sm">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              
              {/* Feature 1: Referral Writer */}
              <motion.div 
                whileHover={{ y: -8 }}
                className="bg-white dark:bg-slate-900/50 p-8 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-[var(--umbil-brand-teal)]/30 shadow-lg shadow-slate-200/50 dark:shadow-none dark:hover:shadow-[var(--umbil-brand-teal)]/20 transition-all group"
              >
                <div className="w-12 h-12 bg-[var(--umbil-brand-teal)]/10 rounded-xl flex items-center justify-center text-[var(--umbil-brand-teal)] mb-6 group-hover:scale-110 transition-transform">
                  <FileText size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Referral Writer</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Turn shorthand notes into consultant-ready letters in your own voice.
                </p>
              </motion.div>

              {/* Feature 2: Safety Net */}
              <motion.div 
                whileHover={{ y: -8 }}
                className="bg-white dark:bg-slate-900/50 p-8 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-rose-500/30 shadow-lg shadow-slate-200/50 dark:shadow-none dark:hover:shadow-rose-900/20 transition-all group"
              >
                <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-400 mb-6 group-hover:scale-110 transition-transform">
                  <Shield size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Safety Net</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Generates 4 crisp red flags and specific advice for the patient.
                </p>
              </motion.div>

              {/* Feature 3: SBAR Handover */}
              <motion.div 
                whileHover={{ y: -8 }}
                className="bg-white dark:bg-slate-900/50 p-8 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-emerald-500/30 shadow-lg shadow-slate-200/50 dark:shadow-none dark:hover:shadow-emerald-900/20 transition-all group"
              >
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                  <Activity size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">SBAR Handover</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Instantly structure messy ward notes into a clear SBAR for referrals.
                </p>
              </motion.div>

              {/* Feature 4: Patient Translator */}
              <motion.div 
                whileHover={{ y: -8 }}
                className="bg-white dark:bg-slate-900/50 p-8 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-blue-500/30 shadow-lg shadow-slate-200/50 dark:shadow-none dark:hover:shadow-blue-900/20 transition-all group"
              >
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                  <Languages size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Translator</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Convert complex medical jargon into simple, patient-friendly language.
                </p>
              </motion.div>

            </div>
          </div>
        </section>

        {/* --- 4. GUIDELINE Q&A --- */}
        <section className="py-52 px-6">
          <div className="container mx-auto max-w-4xl text-center">
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
              Or just ask a question.
            </h3>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto">
              Get summaries based on UK sources (NICE/CKS/SIGN/BNF).
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {[
                "Red flags for headache?", 
                "Management of CAP in elderly?", 
                "DOAC dosing for AF with renal impairment?"
              ].map((q, i) => (
                <div key={i} className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-full text-base font-medium text-slate-700 dark:text-slate-200 hover:border-[var(--umbil-brand-teal)]/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-default shadow-sm dark:shadow-lg">
                  <Search size={16} className="text-[var(--umbil-brand-teal)]" />
                  {q}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- 5. CAPTURE LEARNING --- */}
        <section className="py-52 px-6 relative overflow-hidden">
          {/* Decorative background blob */}
          <div className="absolute right-0 top-1/4 w-[800px] h-[800px] bg-indigo-100 dark:bg-indigo-900/10 rounded-full blur-[120px] -z-10"></div>

          <div className="container mx-auto max-w-6xl">
            <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md rounded-3xl p-8 md:p-20 text-slate-900 dark:text-white overflow-hidden relative shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-16">
              
              {/* Content */}
              <div className="relative z-10 flex-1">
                <div className="inline-block px-4 py-1.5 bg-[var(--umbil-brand-teal)]/10 border border-[var(--umbil-brand-teal)]/20 rounded-full text-[var(--umbil-brand-teal)] text-xs font-bold mb-8 tracking-wide">
                  AUTOMATED CPD
                </div>
                <h3 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">Capture Learning <br/>Without Trying.</h3>
                <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed mb-10">
                  Turn clinical work into structured learning entries instantly. End the midnight appraisal panic forever.
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-4 text-base font-medium text-slate-700 dark:text-slate-300">
                    <div className="w-6 h-6 rounded-full bg-[var(--umbil-brand-teal)]/20 flex items-center justify-center text-[var(--umbil-brand-teal)]"><CheckCircle2 size={14} /></div>
                    Log learning from real cases
                  </li>
                  <li className="flex items-center gap-4 text-base font-medium text-slate-700 dark:text-slate-300">
                    <div className="w-6 h-6 rounded-full bg-[var(--umbil-brand-teal)]/20 flex items-center justify-center text-[var(--umbil-brand-teal)]"><CheckCircle2 size={14} /></div>
                    One-click reflection assistant
                  </li>
                  <li className="flex items-center gap-4 text-base font-medium text-slate-700 dark:text-slate-300">
                    <div className="w-6 h-6 rounded-full bg-[var(--umbil-brand-teal)]/20 flex items-center justify-center text-[var(--umbil-brand-teal)]"><CheckCircle2 size={14} /></div>
                    Exports to appraisal PDF & SOAR
                  </li>
                </ul>
              </div>

              {/* Visual: Floating Card */}
              <div className="relative z-10 w-full md:w-[380px] bg-slate-50 dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-2xl transform md:rotate-3 transition-transform hover:rotate-0 group">
                 <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10">
                    <FileText size={100} />
                 </div>
                 <div className="flex items-center gap-4 mb-6 border-b border-slate-200 dark:border-white/5 pb-6">
                   <div className="w-12 h-12 rounded-full bg-[var(--umbil-brand-teal)] flex items-center justify-center text-white dark:text-slate-900 font-bold shadow-lg shadow-teal-500/20">
                     <CheckCircle2 size={24} />
                   </div>
                   <div>
                     <div className="text-base font-bold text-slate-900 dark:text-white">Learning Captured</div>
                     <div className="text-xs text-slate-500 dark:text-slate-400">Just now • Clinical Management</div>
                   </div>
                 </div>
                 <div className="space-y-4 opacity-30 dark:opacity-50">
                   <div className="h-2 bg-slate-400 rounded w-3/4"></div>
                   <div className="h-2 bg-slate-400 rounded w-full"></div>
                   <div className="h-2 bg-slate-400 rounded w-5/6"></div>
                 </div>
                 <div className="mt-8 flex gap-2">
                   <div className="text-[10px] font-bold text-slate-500 dark:text-slate-300 bg-slate-200 dark:bg-white/5 border border-transparent dark:border-white/5 px-3 py-1.5 rounded-full">Domain 1</div>
                   <div className="text-[10px] font-bold text-slate-500 dark:text-slate-300 bg-slate-200 dark:bg-white/5 border border-transparent dark:border-white/5 px-3 py-1.5 rounded-full">Domain 2</div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- 6. TRUST & SAFETY --- */}
        <section className="py-52 px-6 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#0B1120]">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">Built to be boring. On purpose.</h2>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                We prioritise clinical safety over clever features.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-x-16 gap-y-12">
              {[
                { title: "No Hallucinated Vitals", desc: "Never invents observations, results, or clinical findings. If you didn't type it, we won't write it." },
                { title: "Medication Safety Lock", desc: "No dosing instructions unless explicitly provided in your notes context." },
                { title: "Emergency Flags", desc: "Recognises clear red flags (like Chest Pain + Sweating) and prompts for emergency action." },
                { title: "Context First", desc: "Prioritises retrieved context from guidelines and labels consensus vs. general information." }
              ].map((item, i) => (
                <div key={i} className="flex gap-6 items-start">
                  <div className="mt-1 min-w-[32px] w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                    <Lock size={14} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-lg mb-2">{item.title}</h4>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- FINAL CTA --- */}
        <section className="py-64 px-6 text-center bg-white dark:bg-gradient-to-b dark:from-[#0B1120] dark:to-slate-900 border-t border-slate-200 dark:border-white/5">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto flex flex-col items-center justify-center"
          >
            <p className="text-2xl md:text-3xl text-slate-700 dark:text-slate-300 mb-12 font-light text-center">
              Open a tab. Start typing. No installation required.
            </p>
            <Link href="/dashboard" className="px-16 py-8 bg-[var(--umbil-brand-teal)] hover:opacity-90 !text-white text-2xl font-bold rounded-2xl shadow-[0_0_60px_-15px_rgba(20,184,166,0.5)] inline-flex items-center gap-3 transition-all transform hover:scale-105 hover:-translate-y-1">
              Start Free Now <ArrowRight size={28} />
            </Link>
          </motion.div>
        </section>

        {/* --- FOOTER --- */}
        <footer className="bg-slate-50 dark:bg-slate-950 text-slate-500 py-16 px-6 border-t border-slate-200 dark:border-white/5">
          <div className="container mx-auto max-w-7xl flex flex-col items-center gap-8">
             <div className="text-sm opacity-50 font-medium">
               © {new Date().getFullYear()} Umbil. Built for Doctors by Doctors.
             </div>
          </div>
        </footer>

      </div>
    </div>
  );
}