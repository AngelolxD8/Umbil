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
  Sparkles
} from "lucide-react";

// --- LIVE DEMO DATA (Specific Clinical Scenarios) ---
const DEMO_SCENARIOS = [
  {
    id: "referral",
    label: "Referral Writer",
    icon: <FileText className="w-4 h-4" />,
    input: "54-year-old male\nProgressive dysphagia to solids for 6 weeks\nSensation of food sticking mid-chest\n6 kg unintentional weight loss\nEx-smoker\nNo haematemesis or melaena recorded\nOn omeprazole 20 mg OD\nNo prior endoscopy",
    output: "Dear Colleague,\n\nI would be grateful for your assessment of this 54-year-old gentleman with a six-week history of progressive dysphagia to solids. He describes food sticking in the mid-chest and has lost approximately 6 kg unintentionally over this period.\n\nHe is an ex-smoker and is currently taking omeprazole 20 mg once daily. There is no recorded history of haematemesis or melaena, and he has not previously undergone endoscopy.\n\nGiven the progression of symptoms and associated weight loss, I would appreciate your urgent opinion and investigation.\n\nKind Regards,\nDr Paul McNamara"
  },
  {
    id: "sbar",
    label: "SBAR Handover",
    icon: <Activity className="w-4 h-4" />,
    input: "Patient on medical ward\n78-year-old female\nAdmitted with community-acquired pneumonia\nNEWS score increased from 3 to 6\nOxygen requirement increased from 2 L to 4 L\nKnown COPD\nOn IV antibiotics\nNo ABG yet",
    output: "Situation\nI’m calling about a 78-year-old woman admitted with community-acquired pneumonia whose NEWS score has increased to 6 over the past hour, with rising oxygen requirements.\n\nBackground\nShe has known COPD and was admitted earlier today. She is currently being treated with IV antibiotics.\n\nAssessment\nHer oxygen requirement has increased from 2 L to 4 L. She appears more breathless, and an arterial blood gas has not yet been performed.\n\nRecommendation\nI’d appreciate urgent review, consideration of ABG, and escalation of care if required."
  },
  {
    id: "safetynet",
    label: "Safety Netting",
    icon: <Shield className="w-4 h-4" />,
    input: "Intermittent central chest discomfort\nNormal ECG today\nNo red flags identified\nManaged conservatively",
    output: "Advised to seek urgent help if pain becomes severe, prolonged, or associated with breathlessness, collapse, or radiation to arm or jaw.\nTo re-present if symptoms worsen or fail to settle."
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
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-[#1fb8cd]/20 selection:text-slate-900 overflow-x-hidden font-sans">
      
      {/* --- BACKGROUND ELEMENTS (Clean Grid, No Blobs) --- */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="fixed top-0 left-0 right-0 h-32 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none"></div>

      <div className="relative z-10">
        
        {/* --- NAVBAR --- */}
        <nav className="flex items-center justify-between px-6 py-6 container mx-auto max-w-7xl">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-slate-900">
            <div className="w-8 h-8 bg-[#1fb8cd] rounded-lg flex items-center justify-center text-white shadow-lg shadow-[#1fb8cd]/20">
              <Zap size={18} fill="currentColor" />
            </div>
            Umbil
          </div>
          <div className="flex items-center gap-6">
            <Link href="/auth" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Login</Link>
            <Link href="/auth" className="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-full hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20">
              Get Started
            </Link>
          </div>
        </nav>

        {/* --- HERO SECTION --- */}
        <section className="pt-12 pb-24 px-6">
          <div className="container mx-auto max-w-7xl grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left: Copy */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ecfeff] border border-[#1fb8cd]/20 text-[#0e7490] text-xs font-bold uppercase tracking-wider mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1fb8cd] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1fb8cd]"></span>
                </span>
                Zero-Permission Adoption
              </div>
              
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-6">
                The Clinical Assistant for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1fb8cd] to-[#0891b2]">High-Pressure Shifts.</span>
              </h1>
              
              <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-lg">
                Write referrals, generate safety-netting, and draft SBAR handovers in seconds. 
                Focus on the patient, not the paperwork.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/dashboard" className="px-8 py-4 bg-[#1fb8cd] hover:bg-[#15aabf] text-white font-bold rounded-xl shadow-xl shadow-[#1fb8cd]/30 hover:shadow-[#1fb8cd]/40 transition-all transform hover:-translate-y-1 flex items-center gap-2 group">
                  Try in Clinic Now
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
                </Link>
                <Link href="/about" className="px-8 py-4 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2">
                  See how it works
                </Link>
              </div>

              <div className="mt-10 flex items-center gap-4 text-sm text-slate-500 font-medium">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="text-[#1fb8cd]" size={16} /> NHS-Secure</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="text-[#1fb8cd]" size={16} /> No installation</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="text-[#1fb8cd]" size={16} /> Free tier</span>
              </div>
            </motion.div>

            {/* Right: Live Interactive Demo */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              {/* Tab selector */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                {DEMO_SCENARIOS.map((scenario, idx) => (
                  <button
                    key={scenario.id}
                    onClick={() => setActiveScenario(idx)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                      activeScenario === idx 
                        ? 'bg-slate-900 text-white shadow-lg' 
                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    {scenario.icon}
                    {scenario.label}
                  </button>
                ))}
              </div>

              {/* Window Frame (Clean Box) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden min-h-[500px] flex flex-col">
                {/* Window Header */}
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <div className="ml-4 px-3 py-1 bg-white rounded-md text-[10px] font-mono text-slate-400 border border-slate-100">
                    umbil-clinical-engine.ai
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-6 flex-1 flex flex-col gap-4">
                  
                  {/* Input Simulation */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clinician Input (Rough Notes)</label>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700 font-mono text-sm min-h-[120px] whitespace-pre-wrap leading-relaxed">
                      {displayedInput}
                      <span className="animate-pulse inline-block w-2 h-4 bg-[#1fb8cd] align-middle ml-1" />
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center text-slate-300">
                    <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                       <ArrowRight className="rotate-90 text-[#1fb8cd]" />
                    </motion.div>
                  </div>

                  {/* Output Simulation */}
                  <div className="space-y-2 flex-1 relative flex flex-col">
                     <label className="text-xs font-bold text-[#1fb8cd] uppercase tracking-wider flex items-center gap-1">
                       <Sparkles size={12} />
                       Umbil Output
                     </label>
                     <AnimatePresence mode="wait">
                       {!isTyping && (
                         <motion.div 
                           key={activeScenario}
                           initial={{ opacity: 0, filter: "blur(4px)" }}
                           animate={{ opacity: 1, filter: "blur(0px)" }}
                           exit={{ opacity: 0 }}
                           className="bg-[#ecfeff] p-5 rounded-xl border border-[#1fb8cd]/20 text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-medium flex-1 shadow-inner"
                         >
                           {DEMO_SCENARIOS[activeScenario].output}
                         </motion.div>
                       )}
                     </AnimatePresence>
                     
                     {isTyping && (
                       <div className="absolute inset-0 top-6 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
                         <div className="flex gap-1">
                           <span className="w-2 h-2 bg-[#1fb8cd] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                           <span className="w-2 h-2 bg-[#1fb8cd] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                           <span className="w-2 h-2 bg-[#1fb8cd] rounded-full animate-bounce"></span>
                         </div>
                       </div>
                     )}
                  </div>

                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* --- FEATURES GRID (THE WEDGE) --- */}
        <section className="py-24 px-6 bg-slate-50">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">The Wedge: Workflow First.</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                We don't sell "learning". We sell survival. Use these tools to clear your patient list faster, and let the learning happen in the background.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/30 group relative overflow-hidden"
              >
                <div className="w-12 h-12 bg-[#ecfeff] rounded-xl flex items-center justify-center text-[#0891b2] mb-6 group-hover:scale-110 transition-transform">
                  <FileText size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Referral Writer</h3>
                <p className="text-slate-600 leading-relaxed mb-6">
                  Paste rough notes. Get a polite, structured letter instantly. The primary entry point for busy GPs.
                </p>
                <div className="text-sm font-bold text-[#0891b2] flex items-center gap-1">
                  Try it <ChevronRight size={14} />
                </div>
              </motion.div>

              {/* Feature 2 */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/30 group relative overflow-hidden"
              >
                <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 mb-6 group-hover:scale-110 transition-transform">
                  <Shield size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Safety Net Generator</h3>
                <p className="text-slate-600 leading-relaxed mb-6">
                  Generate defensible safety-netting instructions for patients. Reduces medico-legal anxiety instantly.
                </p>
                <div className="text-sm font-bold text-rose-500 flex items-center gap-1">
                  Try it <ChevronRight size={14} />
                </div>
              </motion.div>

              {/* Feature 3 */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/30 group relative overflow-hidden"
              >
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                  <Activity size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">SBAR Handover</h3>
                <p className="text-slate-600 leading-relaxed mb-6">
                  Don't rely on memory at 8pm. Turn complex cases into structured summaries for the night team.
                </p>
                <div className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                  Try it <ChevronRight size={14} />
                </div>
              </motion.div>

              {/* Feature 4 - Full Width */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="md:col-span-3 bg-slate-900 p-10 rounded-2xl shadow-2xl text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-10 border border-slate-800"
              >
                <div className="relative z-10 flex-1">
                  <div className="inline-block px-3 py-1 bg-[#1fb8cd]/20 border border-[#1fb8cd]/30 rounded-full text-[#1fb8cd] text-xs font-bold mb-4">
                    THE MAGICAL BYPRODUCT
                  </div>
                  <h3 className="text-3xl font-bold mb-4">You do the work.<br/>We catch the credit.</h3>
                  <p className="text-slate-400 text-lg leading-relaxed max-w-lg">
                    While you use Umbil to survive your shift, we automatically log your activity as <strong>Verified CPD</strong>, map it to GMC domains, and draft your reflections.
                  </p>
                </div>
                <div className="relative z-10 w-full md:w-auto bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/10 max-w-sm">
                   <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-3">
                     <div className="w-10 h-10 rounded-full bg-[#1fb8cd] flex items-center justify-center text-slate-900 font-bold">✓</div>
                     <div>
                       <div className="text-sm font-bold text-white">CPD Logged</div>
                       <div className="text-xs text-slate-400">Just now</div>
                     </div>
                   </div>
                   <div className="space-y-2 opacity-50">
                     <div className="h-2 bg-white rounded w-3/4"></div>
                     <div className="h-2 bg-white rounded w-1/2"></div>
                   </div>
                   <div className="mt-4 text-xs text-[#1fb8cd] font-mono bg-black/30 p-2 rounded">
                     +1 Clinical Impact Point
                   </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* --- SOCIAL PROOF TICKER --- */}
        <section className="py-12 border-y border-slate-200 bg-white overflow-hidden">
          <div className="container mx-auto px-6 mb-8 text-center">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Used in clinics across the UK</h4>
          </div>
          <div className="flex gap-12 animate-scroll whitespace-nowrap px-6">
            {[
              "Cleared my 2-hour admin block in 20 mins.",
              "The SBAR tool saved me during a night shift.",
              "Finally, a tool that actually understands GP workflow.",
              "I didn't realize I had 40 hours of CPD logged automatically.",
              "Safety-netting text generation is a game changer."
            ].map((quote, i) => (
              <div key={i} className="text-lg font-medium text-slate-600 flex items-center gap-4">
                <span className="text-[#1fb8cd] text-2xl">“</span>
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
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-8">Think less. Do more.</h2>
            <p className="text-xl text-slate-600 mb-10">
              Open a tab. Start typing. No installation, no credit card, no permission required.
            </p>
            <Link href="/auth" className="px-10 py-5 bg-[#1fb8cd] hover:bg-[#15aabf] text-white text-lg font-bold rounded-xl shadow-2xl shadow-[#1fb8cd]/30 inline-flex items-center gap-3 transition-all">
              Start Free Now <ArrowRight />
            </Link>
          </motion.div>
        </section>

        {/* --- FOOTER --- */}
        <footer className="bg-slate-900 text-slate-400 py-16 px-6">
          <div className="container mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-8">
             <div className="flex items-center gap-2 font-bold text-white text-xl">
               <Zap size={20} className="text-[#1fb8cd]" fill="currentColor" /> Umbil
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