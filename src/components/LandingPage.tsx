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
  Sparkles,
  Lock,
  Languages,
  Zap,
  LayoutGrid,
  Stethoscope,
  Command
} from "lucide-react";

// --- LIVE DEMO DATA ---
const DEMO_SCENARIOS = [
  {
    id: "referral",
    label: "Referral Writer",
    icon: <FileText className="w-3 h-3" />,
    input: "54M, dysphagia to solids 6wks. Food sticks mid-chest. 6kg wt loss. Ex-smoker. No haem/melaena. On omeprazole. No scope.",
    output: "Dear Colleague,\n\nI would be grateful for your assessment of this 54-year-old gentleman with a six-week history of progressive dysphagia to solids. He describes food sticking in the mid-chest and has lost approximately 6 kg unintentionally.\n\nHe is an ex-smoker taking omeprazole. There is no history of haematemesis or melaena.\n\nGiven the red flag symptoms, I would appreciate your urgent investigation."
  },
  {
    id: "sbar",
    label: "SBAR Handover",
    icon: <Activity className="w-3 h-3" />,
    input: "78F on ward. CAP. NEWS 3->6. O2 req 2L->4L. Known COPD. On IV abx. No ABG.",
    output: "Situation\n78-year-old female with CAP. NEWS score increased to 6. Rising oxygen requirements.\n\nBackground\nKnown COPD. On IV antibiotics.\n\nAssessment\nO2 requirement up to 4L. Breathless. No ABG yet.\n\nRecommendation\nUrgent review required. Consider ABG and escalation."
  },
  {
    id: "safetynet",
    label: "Safety Netting",
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
        timeout = setTimeout(typeChar, 10 + Math.random() * 15); 
      } else {
        setIsTyping(false);
        // Wait 4 seconds to read output before switching
        timeout = setTimeout(() => {
          setActiveScenario((prev) => (prev + 1) % DEMO_SCENARIOS.length);
        }, 5000); 
      }
    };

    timeout = setTimeout(typeChar, 500);

    return () => clearTimeout(timeout);
  }, [activeScenario]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-emerald-500/30 selection:text-emerald-50 overflow-x-hidden font-sans">
      
      {/* --- AMBIENT BACKGROUND --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full mix-blend-screen opacity-50 animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full mix-blend-screen opacity-50" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      <div className="relative z-10">
        
        {/* --- NAVIGATION --- */}
        <nav className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 font-bold text-xl text-white tracking-tight">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center text-slate-900 shadow-lg shadow-emerald-500/20">
              <Stethoscope size={18} strokeWidth={3} />
            </div>
            Umbil
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/dashboard" className="px-5 py-2.5 bg-white text-slate-900 text-sm font-bold rounded-full hover:bg-slate-200 transition-all shadow-lg shadow-white/5">
              Get Started
            </Link>
          </div>
        </nav>

        {/* --- HERO SECTION --- */}
        <section className="pt-20 pb-20 px-6">
          <div className="container mx-auto max-w-5xl flex flex-col items-center text-center">
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/50 border border-slate-800 text-slate-400 text-xs font-medium mb-8 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Zero-setup clinical AI
              </div>
              
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-8 leading-[1.1]">
                Your clinical admin, <br className="hidden md:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                  finished in seconds.
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                Paste rough notes. Get consultant-ready referrals, safety-netting, and handovers instantly. No installation required.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center mb-16">
                <Link href="/dashboard" className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-xl shadow-emerald-500/20 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 text-lg">
                  Try it in Clinic
                  <ArrowRight size={20} />
                </Link>
                <Link href="/dashboard?tour=true&forceTour=true" className="w-full sm:w-auto px-8 py-4 bg-slate-900 border border-slate-800 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 text-lg">
                  See how it works
                </Link>
              </div>
            </motion.div>

            {/* --- INTERACTIVE DEMO (Floating Window) --- */}
            <motion.div 
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="w-full max-w-4xl mx-auto"
            >
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-black/50 ring-1 ring-white/10">
                
                {/* Window Header */}
                <div className="h-12 bg-slate-900/50 border-b border-white/5 flex items-center px-4 gap-2">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500/20 border border-rose-500/50" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                  </div>
                  <div className="ml-4 flex items-center gap-2 px-3 py-1 rounded-md bg-slate-800/50 text-xs font-mono text-slate-400 border border-white/5">
                    <Lock size={10} className="text-emerald-500" />
                    umbil.co.uk
                  </div>
                </div>

                {/* Window Body */}
                <div className="p-1 grid md:grid-cols-2 min-h-[400px]">
                  
                  {/* LEFT: Input & Context */}
                  <div className="p-6 border-b md:border-b-0 md:border-r border-white/5 flex flex-col gap-6">
                    <div>
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Command size={12} /> Select Workflow
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {DEMO_SCENARIOS.map((scenario, idx) => (
                          <button
                            key={scenario.id}
                            onClick={() => setActiveScenario(idx)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                              activeScenario === idx 
                                ? 'bg-slate-800 text-white ring-1 ring-emerald-500/50 shadow-lg shadow-black/20' 
                                : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'
                            }`}
                          >
                            <span className={activeScenario === idx ? "text-emerald-400" : "opacity-50"}>
                              {scenario.icon}
                            </span>
                            {scenario.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Input Notes</h3>
                      <div className="flex-1 bg-slate-950/50 rounded-lg p-4 font-mono text-sm text-slate-300 leading-relaxed border border-white/5 shadow-inner">
                        {displayedInput}
                        <span className="inline-block w-2 h-4 bg-emerald-500 ml-1 animate-pulse align-middle" />
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: AI Output */}
                  <div className="p-6 bg-slate-950/30 flex flex-col">
                    <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Sparkles size={12} /> Generated Output
                    </h3>
                    
                    <div className="relative flex-1">
                      <AnimatePresence mode="wait">
                        {!isTyping ? (
                          <motion.div 
                            key={activeScenario}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed font-medium"
                          >
                            {DEMO_SCENARIOS[activeScenario].output}
                          </motion.div>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex items-center gap-2 text-slate-600 text-sm">
                              <Zap size={16} className="animate-bounce" />
                              Processing...
                            </div>
                          </div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center text-xs text-slate-500">
                       <span>Formatted to UK Standards</span>
                       <div className="flex gap-2">
                          <div className="w-20 h-2 bg-slate-800 rounded-full" />
                          <div className="w-12 h-2 bg-slate-800 rounded-full" />
                       </div>
                    </div>
                  </div>

                </div>
              </div>
              
              {/* Trust Badges */}
              <div className="mt-8 flex flex-wrap justify-center gap-6 md:gap-12 text-slate-500 text-sm font-medium opacity-60">
                <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> No Patient Data Stored</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> UK Guideline Based</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Free for NHS Staff</span>
              </div>
            </motion.div>

          </div>
        </section>

        {/* --- BENTO GRID FEATURE SECTION --- */}
        <section className="py-32 px-6 border-t border-white/5 bg-slate-900/30">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-16 md:text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Tools tailored for the trenches.</h2>
              <p className="text-slate-400 text-lg">
                Generic AI chatbots hallucinate. Umbil is engineered for specific clinical workflows where accuracy and speed are non-negotiable.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[minmax(180px,auto)]">
              
              {/* Feature 1: Large Referral Card */}
              <div className="md:col-span-2 md:row-span-2 group relative bg-slate-900 border border-white/10 rounded-3xl p-8 overflow-hidden hover:border-emerald-500/30 transition-all duration-300">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <FileText size={120} />
                </div>
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                      <FileText size={24} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">Referral Writer</h3>
                    <p className="text-slate-400 leading-relaxed max-w-md">
                      Turn bullet points into polished, structured referral letters instantly. We handle the formatting, "Dear Colleague," and polite closing—you just provide the clinical facts.
                    </p>
                  </div>
                  <div className="mt-8 flex items-center gap-2 text-sm font-bold text-emerald-400">
                    Try it now <ArrowRight size={16} />
                  </div>
                </div>
              </div>

              {/* Feature 2: Safety Net */}
              <div className="group relative bg-slate-900 border border-white/10 rounded-3xl p-8 overflow-hidden hover:border-rose-500/30 transition-all duration-300">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Shield size={80} />
                </div>
                <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-400 mb-4 group-hover:scale-110 transition-transform">
                  <Shield size={20} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Safety Net</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Generate watertight safety-netting advice for discharge summaries, covering red flags and return triggers.
                </p>
              </div>

              {/* Feature 3: SBAR */}
              <div className="group relative bg-slate-900 border border-white/10 rounded-3xl p-8 overflow-hidden hover:border-blue-500/30 transition-all duration-300">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Activity size={80} />
                </div>
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                  <Activity size={20} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">SBAR Handover</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Structure messy ward notes into clear Situation-Background-Assessment-Recommendation formats.
                </p>
              </div>

              {/* Feature 4: Translator */}
              <div className="md:col-span-1 group relative bg-slate-900 border border-white/10 rounded-3xl p-8 overflow-hidden hover:border-amber-500/30 transition-all duration-300">
                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                  <Languages size={20} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Translator</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Convert complex medical jargon into patient-friendly explanations for letters or texts.
                </p>
              </div>

               {/* Feature 5: CPD (New) */}
               <div className="md:col-span-2 group relative bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-3xl p-8 overflow-hidden flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 mb-4">
                    <LayoutGrid size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">The Quiet By-Product</h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-4">
                    Every case you process can be instantly logged as a learning entry. Build your appraisal portfolio automatically while you work.
                  </p>
                </div>
                <div className="w-full md:w-48 p-4 bg-slate-950/50 rounded-lg border border-white/5 text-xs text-slate-500 font-mono">
                  <div className="flex items-center gap-2 mb-2 text-emerald-400 font-bold"><CheckCircle2 size={12}/> Learning Logged</div>
                  <div className="space-y-2 opacity-50">
                    <div className="h-1.5 w-3/4 bg-slate-700 rounded-full" />
                    <div className="h-1.5 w-full bg-slate-700 rounded-full" />
                    <div className="h-1.5 w-1/2 bg-slate-700 rounded-full" />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* --- SAFETY SECTION --- */}
        <section className="py-24 px-6 border-t border-white/5 bg-slate-950">
           <div className="container mx-auto max-w-4xl text-center">
             <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 mb-8 text-slate-400">
               <Lock size={32} />
             </div>
             <h2 className="text-3xl font-bold text-white mb-12">Built to be boring. On purpose.</h2>
             
             <div className="grid md:grid-cols-2 gap-8 text-left">
               <div className="p-6 rounded-2xl bg-slate-900/50 border border-white/5">
                 <h4 className="font-bold text-white mb-2">No Hallucinated Vitals</h4>
                 <p className="text-sm text-slate-400">We never invent observations. If you didn't type "BP 120/80", we won't write it.</p>
               </div>
               <div className="p-6 rounded-2xl bg-slate-900/50 border border-white/5">
                 <h4 className="font-bold text-white mb-2">Medication Safety Lock</h4>
                 <p className="text-sm text-slate-400">Dosing instructions are only included if explicitly provided in your context.</p>
               </div>
               <div className="p-6 rounded-2xl bg-slate-900/50 border border-white/5">
                 <h4 className="font-bold text-white mb-2">Zero Retention Mode</h4>
                 <p className="text-sm text-slate-400">Input data is processed and discarded. We do not train models on your patient notes.</p>
               </div>
               <div className="p-6 rounded-2xl bg-slate-900/50 border border-white/5">
                 <h4 className="font-bold text-white mb-2">Context First</h4>
                 <p className="text-sm text-slate-400">Prioritises UK-specific guidelines (NICE/CKS) over general web knowledge.</p>
               </div>
             </div>
           </div>
        </section>

        {/* --- FINAL CTA --- */}
        <section className="py-32 px-6 text-center border-t border-white/5 bg-gradient-to-b from-slate-950 to-slate-900">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl font-extrabold text-white mb-6">Think less. Do more.</h2>
            <p className="text-lg text-slate-400 mb-10">
              Open a tab. Start typing. No credit card, no installation, no permissions required.
            </p>
            <Link href="/dashboard" className="inline-flex items-center gap-2 px-10 py-5 bg-white text-slate-900 text-lg font-bold rounded-full hover:bg-slate-200 transition-all shadow-2xl shadow-white/10 transform hover:-translate-y-1">
              Start Free Now
              <ArrowRight size={20} />
            </Link>
          </div>
        </section>

        {/* --- FOOTER --- */}
        <footer className="bg-slate-950 border-t border-white/5 py-12 text-center text-slate-500 text-sm">
           <p>© {new Date().getFullYear()} Umbil. Built for Doctors by Doctors.</p>
        </footer>

      </div>
    </div>
  );
}