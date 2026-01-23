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
  Menu
} from "lucide-react";

// --- LIVE DEMO DATA (Specific Clinical Scenarios) ---
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
        
        {/* --- HERO SECTION --- */}
        <section className="pt-16 pb-24 px-6">
          <div className="container mx-auto max-w-7xl grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left: Copy */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--umbil-brand-teal)]/10 border border-[var(--umbil-brand-teal)]/20 text-[var(--umbil-brand-teal)] text-xs font-bold uppercase tracking-wider mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--umbil-brand-teal)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--umbil-brand-teal)]"></span>
                </span>
                Zero-Permission Adoption
              </div>
              
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-[var(--umbil-text)] leading-[1.1] mb-6">
                The Clinical Assistant for <span className="text-[var(--umbil-brand-teal)]">High-Pressure Shifts.</span>
              </h1>
              
              <p className="text-lg md:text-xl text-[var(--umbil-text)] opacity-80 mb-10 leading-relaxed max-w-lg">
                Write referrals, generate safety-netting, and draft SBAR handovers in seconds. 
                Focus on the patient, not the paperwork.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/dashboard" className="px-8 py-5 bg-[var(--umbil-brand-teal)] hover:opacity-90 text-white font-bold rounded-md shadow-xl shadow-[var(--umbil-brand-teal)]/30 transition-all transform hover:-translate-y-1 flex items-center gap-2 group text-lg">
                  Try in Clinic Now
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                </Link>
                <Link href="/about" className="px-8 py-5 bg-[var(--umbil-surface)] border border-[var(--umbil-card-border)] text-[var(--umbil-text)] font-semibold rounded-md hover:bg-[var(--umbil-hover-bg)] transition-colors flex items-center gap-2 text-lg">
                  See how it works
                </Link>
              </div>

              <div className="mt-10 flex items-center gap-4 text-sm text-[var(--umbil-text)] opacity-70 font-medium">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="text-[var(--umbil-brand-teal)]" size={16} /> NHS-Secure</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="text-[var(--umbil-brand-teal)]" size={16} /> No installation</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="text-[var(--umbil-brand-teal)]" size={16} /> Free tier</span>
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
               <div className="relative border-gray-900 bg-gray-900 border-[12px] rounded-[3rem] h-[640px] w-[320px] shadow-2xl flex flex-col overflow-hidden">
                 {/* Camera / Speaker Notch area (Simulated by top border thickness but adding a small bar inside) */}
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[20px] w-[120px] bg-gray-900 rounded-b-xl z-20"></div>

                 {/* Screen Content */}
                 <div className="flex-1 bg-[var(--umbil-surface)] overflow-hidden flex flex-col w-full h-full relative">
                    
                    {/* Fake Browser Address Bar */}
                    <div className="bg-[var(--umbil-hover-bg)] p-3 pt-8 pb-3 border-b border-[var(--umbil-card-border)] flex items-center justify-between gap-2 z-10">
                      <Menu size={16} className="text-[var(--umbil-muted)]" />
                      <div className="flex-1 bg-[var(--umbil-surface)] rounded-full h-8 flex items-center justify-center px-4 shadow-sm border border-[var(--umbil-card-border)]">
                         <Lock size={10} className="text-emerald-500 mr-1.5" />
                         <span className="text-xs font-medium text-[var(--umbil-text)]">umbil.co.uk</span>
                      </div>
                      <div className="w-4" /> {/* Spacer */}
                    </div>

                    {/* App Interface Inside Phone */}
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col">
                      
                      {/* Mobile Tabs */}
                      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide no-scrollbar -mx-2 px-2">
                        {DEMO_SCENARIOS.map((scenario, idx) => (
                          <button
                            key={scenario.id}
                            onClick={() => setActiveScenario(idx)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                              activeScenario === idx 
                                ? 'bg-[var(--umbil-text)] text-[var(--umbil-surface)] shadow-md' 
                                : 'bg-[var(--umbil-hover-bg)] text-[var(--umbil-text)] border border-[var(--umbil-card-border)] opacity-70'
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
                        <div className="bg-[var(--umbil-hover-bg)] p-3 rounded-lg border border-[var(--umbil-card-border)] text-[var(--umbil-text)] font-mono text-xs min-h-[100px] whitespace-pre-wrap leading-relaxed shadow-inner">
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

        {/* --- FEATURES GRID (THE WEDGE) --- */}
        <section className="py-24 px-6 bg-[var(--umbil-hover-bg)]">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--umbil-text)] mb-4">The Wedge: Workflow First.</h2>
              <p className="text-lg text-[var(--umbil-text)] opacity-80 max-w-2xl mx-auto">
                We don't sell "learning". We sell survival. Use these tools to clear your patient list faster, and let the learning happen in the background.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-[var(--umbil-surface)] p-8 rounded-lg border border-[var(--umbil-card-border)] shadow-xl shadow-black/5 group relative overflow-hidden"
              >
                <div className="w-12 h-12 bg-[var(--umbil-brand-teal)]/10 rounded-md flex items-center justify-center text-[var(--umbil-brand-teal)] mb-6 group-hover:scale-110 transition-transform">
                  <FileText size={24} />
                </div>
                <h3 className="text-xl font-bold text-[var(--umbil-text)] mb-3">Referral Writer</h3>
                <p className="text-[var(--umbil-text)] opacity-70 leading-relaxed mb-6">
                  Paste rough notes. Get a polite, structured letter instantly. The primary entry point for busy GPs.
                </p>
                <div className="text-sm font-bold text-[var(--umbil-brand-teal)] flex items-center gap-1">
                  Try it <ChevronRight size={14} />
                </div>
              </motion.div>

              {/* Feature 2 */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-[var(--umbil-surface)] p-8 rounded-lg border border-[var(--umbil-card-border)] shadow-xl shadow-black/5 group relative overflow-hidden"
              >
                <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-md flex items-center justify-center text-rose-500 mb-6 group-hover:scale-110 transition-transform">
                  <Shield size={24} />
                </div>
                <h3 className="text-xl font-bold text-[var(--umbil-text)] mb-3">Safety Net Generator</h3>
                <p className="text-[var(--umbil-text)] opacity-70 leading-relaxed mb-6">
                  Generate defensible safety-netting instructions for patients. Reduces medico-legal anxiety instantly.
                </p>
                <div className="text-sm font-bold text-rose-500 flex items-center gap-1">
                  Try it <ChevronRight size={14} />
                </div>
              </motion.div>

              {/* Feature 3 */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-[var(--umbil-surface)] p-8 rounded-lg border border-[var(--umbil-card-border)] shadow-xl shadow-black/5 group relative overflow-hidden"
              >
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-md flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                  <Activity size={24} />
                </div>
                <h3 className="text-xl font-bold text-[var(--umbil-text)] mb-3">SBAR Handover</h3>
                <p className="text-[var(--umbil-text)] opacity-70 leading-relaxed mb-6">
                  Don't rely on memory at 8pm. Turn complex cases into structured summaries for the night team.
                </p>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  Try it <ChevronRight size={14} />
                </div>
              </motion.div>

              {/* Feature 4 - Full Width */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="md:col-span-3 bg-slate-900 p-10 rounded-lg shadow-2xl text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-10 border border-slate-800"
              >
                <div className="relative z-10 flex-1">
                  <div className="inline-block px-3 py-1 bg-[var(--umbil-brand-teal)]/20 border border-[var(--umbil-brand-teal)]/30 rounded-full text-[var(--umbil-brand-teal)] text-xs font-bold mb-4">
                    THE MAGICAL BYPRODUCT
                  </div>
                  <h3 className="text-3xl font-bold mb-4">You do the work.<br/>We catch the credit.</h3>
                  <p className="text-slate-400 text-lg leading-relaxed max-w-lg">
                    While you use Umbil to survive your shift, we automatically log your activity as <strong>Verified CPD</strong>, map it to GMC domains, and draft your reflections.
                  </p>
                </div>
                <div className="relative z-10 w-full md:w-auto bg-white/5 backdrop-blur-md p-6 rounded-lg border border-white/10 max-w-sm">
                   <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-3">
                     <div className="w-10 h-10 rounded-full bg-[var(--umbil-brand-teal)] flex items-center justify-center text-slate-900 font-bold">✓</div>
                     <div>
                       <div className="text-sm font-bold text-white">CPD Logged</div>
                       <div className="text-xs text-slate-400">Just now</div>
                     </div>
                   </div>
                   <div className="space-y-2 opacity-50">
                     <div className="h-2 bg-white rounded w-3/4"></div>
                     <div className="h-2 bg-white rounded w-1/2"></div>
                   </div>
                   <div className="mt-4 text-xs text-[var(--umbil-brand-teal)] font-mono bg-black/30 p-2 rounded">
                     +1 Clinical Impact Point
                   </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* --- SOCIAL PROOF TICKER --- */}
        <section className="py-12 border-y border-[var(--umbil-card-border)] bg-[var(--umbil-surface)] overflow-hidden">
          <div className="container mx-auto px-6 mb-8 text-center">
            <h4 className="text-sm font-bold text-[var(--umbil-text)] opacity-50 uppercase tracking-widest">Used in clinics across the UK</h4>
          </div>
          <div className="flex gap-12 animate-scroll whitespace-nowrap px-6">
            {[
              "Cleared my 2-hour admin block in 20 mins.",
              "The SBAR tool saved me during a night shift.",
              "Finally, a tool that actually understands GP workflow.",
              "I didn't realize I had 40 hours of CPD logged automatically.",
              "Safety-netting text generation is a game changer."
            ].map((quote, i) => (
              <div key={i} className="text-lg font-medium text-[var(--umbil-text)] opacity-80 flex items-center gap-4">
                <span className="text-[var(--umbil-brand-teal)] text-2xl">“</span>
                {quote}
              </div>
            ))}
          </div>
        </section>

        {/* --- FINAL CTA --- */}
        <section className="py-32 px-6 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--umbil-text)] mb-8">Think less. Do more.</h2>
            <p className="text-xl text-[var(--umbil-text)] opacity-70 mb-10">
              Open a tab. Start typing. No installation, no credit card, no permission required.
            </p>
            <Link href="/auth" className="px-10 py-5 bg-[var(--umbil-brand-teal)] hover:opacity-90 text-white text-lg font-bold rounded-md shadow-2xl shadow-[var(--umbil-brand-teal)]/30 inline-flex items-center gap-3 transition-all">
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