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
  Search, 
  CheckCircle2, 
  Zap, 
  Clock,
  ChevronRight,
  Sparkles
} from "lucide-react";

// --- LIVE DEMO DATA ---
const DEMO_SCENARIOS = [
  {
    id: "referral",
    label: "Referral Writer",
    icon: <FileText className="w-4 h-4" />,
    input: "65M, increasing chest pain on exertion. Hx HTN, smoker. Exam: HR 80 reg, HS normal. GTN spray helps. Needs cardio review.",
    output: "Dear Cardiology Team,\n\nRe: 65-year-old Male\n\nI would be grateful for your urgent review of this gentleman who presents with worsening exertional chest pain.\n\nHistory:\n- Significant for hypertension and smoking history.\n- Symptoms relieved by GTN spray.\n\nExamination:\n- HR 80 bpm, regular.\n- Heart sounds normal.\n\nPlease consider for rapid access chest pain clinic.\n\nSincerely,\nDr. [Name]"
  },
  {
    id: "safetynet",
    label: "Safety Netting",
    icon: <Shield className="w-4 h-4" />,
    input: "3yo child, fever 38.5, eating ok. viral likely. warn parents about rash, breathing, hydration.",
    output: "Safety Netting Advice: Viral Illness\n\nPlease monitor your child for the following Red Flags. Seek urgent medical attention if:\n\n1. Breathing becomes rapid or they have 'sucking in' under the ribs.\n2. A rash appears that does not fade when pressed (glass test).\n3. They are unable to keep fluids down or have no wet nappies for 12 hours.\n\nManage fever with paracetamol as directed."
  },
  {
    id: "sbar",
    label: "SBAR Handover",
    icon: <Activity className="w-4 h-4" />,
    input: "Bed 4, Mrs Jones, pneumonia. O2 dropped to 88%. Started on high flow. Antibiotics given. Needs review in 1hr.",
    output: "SITUATION: Mrs Jones (Bed 4) has deteriorated with oxygen saturation dropping to 88%.\n\nBACKGROUND: Admitted with Pneumonia.\n\nASSESSMENT: Hypoxic despite initial therapy. Currently on high-flow oxygen. IV Antibiotics administered.\n\nRECOMMENDATION: Please review clinically in 1 hour to assess response to high-flow oxygen."
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
        // Random typing speed for realism
        timeout = setTimeout(typeChar, 30 + Math.random() * 50); 
      } else {
        setIsTyping(false);
        // Wait before switching scenario
        timeout = setTimeout(() => {
          setActiveScenario((prev) => (prev + 1) % DEMO_SCENARIOS.length);
        }, 5000); // 5 seconds to read output
      }
    };

    timeout = setTimeout(typeChar, 500);

    return () => clearTimeout(timeout);
  }, [activeScenario]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-sky-100 selection:text-sky-900 overflow-x-hidden">
      
      {/* --- BACKGROUND ELEMENTS --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-sky-200/20 blur-[120px] rounded-full mix-blend-multiply opacity-70 animate-pulse" />
        <div className="absolute top-[-100px] right-0 w-[800px] h-[600px] bg-indigo-200/20 blur-[120px] rounded-full mix-blend-multiply opacity-70" />
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03]" /> 
      </div>

      <div className="relative z-10">
        
        {/* --- NAVBAR --- */}
        <nav className="flex items-center justify-between px-6 py-6 container mx-auto max-w-7xl">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-slate-900">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
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
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-100 text-sky-700 text-xs font-bold uppercase tracking-wider mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                </span>
                Zero-Permission Adoption
              </div>
              
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-6">
                The Clinical Assistant for <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600">High-Pressure Shifts.</span>
              </h1>
              
              <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-lg">
                Write referrals, generate safety-netting, and draft SBAR handovers in seconds. 
                Focus on the patient, not the paperwork.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/dashboard" className="px-8 py-4 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-xl shadow-sky-500/20 hover:shadow-sky-500/30 transition-all transform hover:-translate-y-1 flex items-center gap-2 group">
                  Try in Clinic Now
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
                </Link>
                <Link href="/about" className="px-8 py-4 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2">
                  See how it works
                </Link>
              </div>

              <div className="mt-10 flex items-center gap-4 text-sm text-slate-500 font-medium">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="text-teal-500" size={16} /> NHS-Secure</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="text-teal-500" size={16} /> No installation</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="text-teal-500" size={16} /> Free tier</span>
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
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
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

              {/* Window Frame */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden min-h-[450px] flex flex-col">
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
                <div className="p-6 flex-1 flex flex-col gap-6">
                  
                  {/* Input Simulation */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clinician Input (Rough Notes)</label>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700 font-mono text-sm min-h-[80px]">
                      {displayedInput}
                      <span className="animate-pulse inline-block w-2 h-4 bg-sky-500 align-middle ml-1" />
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center text-slate-300">
                    <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                       <ArrowRight className="rotate-90" />
                    </motion.div>
                  </div>

                  {/* Output Simulation */}
                  <div className="space-y-2 flex-1 relative">
                     <label className="text-xs font-bold text-sky-500 uppercase tracking-wider flex items-center gap-1">
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
                           className="bg-sky-50/50 p-5 rounded-xl border border-sky-100 text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-medium h-full shadow-inner"
                         >
                           {DEMO_SCENARIOS[activeScenario].output}
                         </motion.div>
                       )}
                     </AnimatePresence>
                     
                     {isTyping && (
                       <div className="absolute inset-0 top-6 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
                         <div className="flex gap-1">
                           <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                           <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                           <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce"></span>
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
        <section className="py-24 px-6 bg-slate-50/50">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">The Wedge: Workflow First.</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                We don't sell "learning". We sell survival. Use these tools to clear your patient list faster, and let the learning happen in the background.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <FileText size={120} className="text-blue-500 rotate-12" />
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                  <FileText size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Referral Writer</h3>
                <p className="text-slate-600 leading-relaxed mb-6">
                  Paste rough notes. Get a polite, structured letter instantly. The primary entry point for busy GPs.
                </p>
                <div className="text-sm font-semibold text-blue-600 flex items-center gap-1">
                  Try it <ChevronRight size={14} />
                </div>
              </motion.div>

              {/* Feature 2 */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Shield size={120} className="text-rose-500 rotate-12" />
                </div>
                <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-6 group-hover:scale-110 transition-transform">
                  <Shield size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Safety Net Generator</h3>
                <p className="text-slate-600 leading-relaxed mb-6">
                  Generate defensible safety-netting instructions for patients. Reduces medico-legal anxiety instantly.
                </p>
                <div className="text-sm font-semibold text-rose-600 flex items-center gap-1">
                  Try it <ChevronRight size={14} />
                </div>
              </motion.div>

              {/* Feature 3 */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Activity size={120} className="text-emerald-500 rotate-12" />
                </div>
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                  <Activity size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">SBAR Handover</h3>
                <p className="text-slate-600 leading-relaxed mb-6">
                  Don't rely on memory at 8pm. Turn complex cases into structured summaries for the night team.
                </p>
                <div className="text-sm font-semibold text-emerald-600 flex items-center gap-1">
                  Try it <ChevronRight size={14} />
                </div>
              </motion.div>

              {/* Feature 4 - Full Width */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="md:col-span-3 bg-gradient-to-br from-indigo-900 to-slate-900 p-10 rounded-3xl shadow-2xl text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-10"
              >
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
                <div className="relative z-10 flex-1">
                  <div className="inline-block px-3 py-1 bg-indigo-500/30 border border-indigo-400/30 rounded-full text-indigo-200 text-xs font-bold mb-4">
                    THE MAGICAL BYPRODUCT
                  </div>
                  <h3 className="text-3xl font-bold mb-4">You do the work.<br/>We catch the credit.</h3>
                  <p className="text-indigo-200 text-lg leading-relaxed max-w-lg">
                    While you use Umbil to survive your shift, we automatically log your activity as <strong>Verified CPD</strong>, map it to GMC domains, and draft your reflections.
                  </p>
                </div>
                <div className="relative z-10 w-full md:w-auto bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 max-w-sm">
                   <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-3">
                     <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">✓</div>
                     <div>
                       <div className="text-sm font-bold">CPD Logged</div>
                       <div className="text-xs text-indigo-200">Just now</div>
                     </div>
                   </div>
                   <div className="space-y-2">
                     <div className="h-2 bg-white/20 rounded w-3/4"></div>
                     <div className="h-2 bg-white/20 rounded w-1/2"></div>
                   </div>
                   <div className="mt-4 text-xs text-indigo-300 font-mono bg-black/20 p-2 rounded">
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
                <span className="text-sky-500 text-2xl">“</span>
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
            <Link href="/auth" className="px-10 py-5 bg-slate-900 text-white text-lg font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-900/20 inline-flex items-center gap-3">
              Start Free Now <ArrowRight />
            </Link>
          </motion.div>
        </section>

        {/* --- FOOTER --- */}
        <footer className="bg-slate-900 text-slate-400 py-16 px-6">
          <div className="container mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-8">
             <div className="flex items-center gap-2 font-bold text-white text-xl">
               <Zap size={20} className="text-sky-500" fill="currentColor" /> Umbil
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