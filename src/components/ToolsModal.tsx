"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Toast from "./Toast";
import { supabase } from "@/lib/supabase";

// --- ICONS ---
const Icons = {
  Close: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Copy: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>,
  Wand: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>,
  // Tool Icons
  Referral: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  Shield: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Heart: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>,
  Sbar: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>,
  Discharge: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M10 13h4"/><path d="M12 11v4"/></svg>,
};

export type ToolId = 'referral' | 'safety_netting' | 'discharge_summary' | 'sbar' | 'patient_friendly';

interface ToolConfig {
  id: ToolId;
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  desc: string;
}

export const TOOLS_CONFIG: ToolConfig[] = [
  { 
    id: 'patient_friendly', 
    label: 'Patient Translator', 
    icon: Icons.Heart, 
    placeholder: "Paste complex medical text here (e.g. 'Patient has idiopathic hypertension...'). The AI will rewrite it for a 5th-grade reading level.", 
    desc: "Simplify jargon for patients" 
  },
  { 
    id: 'referral', 
    label: 'Referral Writer', 
    icon: Icons.Referral, 
    placeholder: "e.g., 54F. 3 weeks hoarse voice. Smoker. Exam: Neck normal. Request ENT 2WW.", 
    desc: "Draft referral letters" 
  },
  { 
    id: 'safety_netting', 
    label: 'Safety Netting', 
    icon: Icons.Shield, 
    placeholder: "e.g., 3yo child, fever 38.5, drinking ok, no rash. Viral URTI.", 
    desc: "Generate safety advice" 
  },
  { 
    id: 'sbar', 
    label: 'SBAR Handover', 
    icon: Icons.Sbar, 
    placeholder: "e.g., 78M, Bay 4. BP 80/50, Sats 88%. Peri-arrest. Need Reg review.", 
    desc: "Urgent handover structure" 
  },
  { 
    id: 'discharge_summary', 
    label: 'Discharge Condenser', 
    icon: Icons.Discharge, 
    placeholder: "Paste the long list of daily ward rounds here...", 
    desc: "Summarize admission" 
  },
];

type ToolsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialTool?: ToolId;
};

export default function ToolsModal({ isOpen, onClose, initialTool = 'referral' }: ToolsModalProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeToolId, setActiveToolId] = useState<ToolId>(initialTool);

  useEffect(() => {
    if (isOpen) {
      setInput("");
      setOutput("");
      setActiveToolId(initialTool);
    }
  }, [isOpen, initialTool]);

  const activeTool = TOOLS_CONFIG.find(t => t.id === activeToolId) || TOOLS_CONFIG[0];

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setOutput("");

    try {
      const res = await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolType: activeTool.id, input }),
      });

      if (!res.ok) throw new Error("Failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          setOutput((prev) => prev + chunk);
        }
      }

      // Save to history (fire and forget)
      supabase.from('tool_history').insert([{ 
          tool_id: activeTool.id,
          tool_name: activeTool.label,
          input: input,
          output: fullText 
      }]).then();

    } catch (e) {
      console.error(e);
      setOutput("⚠️ Error generating content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setToastMessage("Copied to clipboard");
    setTimeout(() => setToastMessage(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      <div className="bg-white dark:bg-zinc-900 w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800">
        
        {/* --- HEADER (Clean - No Dropdown) --- */}
        <div className="h-16 px-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-lg">
              {activeTool.icon}
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                {activeTool.label}
              </h2>
              <p className="text-xs text-zinc-500">
                {activeTool.desc}
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all"
          >
            {Icons.Close}
          </button>
        </div>

        {/* --- BODY --- */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          
          {/* INPUT SECTION */}
          <div className="flex-1 flex flex-col p-6 border-b md:border-b-0 md:border-r border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Input
              </label>
              {input && (
                <button onClick={() => setInput("")} className="text-xs text-zinc-400 hover:text-red-500 transition-colors">
                  Clear
                </button>
              )}
            </div>
            
            <textarea
              className="flex-1 w-full p-4 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none transition-all placeholder:text-zinc-400 text-sm leading-relaxed outline-none"
              placeholder={activeTool.placeholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleGenerate}
                disabled={loading || !input.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-semibold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    {Icons.Wand}
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>

          {/* OUTPUT SECTION */}
          <div className="flex-1 flex flex-col p-6 bg-white dark:bg-zinc-900">
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                AI Response
              </label>
              {output && !loading && (
                <button 
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-teal-600 transition-colors bg-zinc-50 px-2 py-1 rounded-md"
                >
                  {Icons.Copy} Copy
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm">
              {loading ? (
                <div className="flex flex-col gap-3 animate-pulse">
                  <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-3/4"></div>
                  <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-1/2"></div>
                  <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-5/6"></div>
                </div>
              ) : output ? (
                <div className="prose prose-sm dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {output}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-full mb-3 opacity-50">
                    {activeTool.icon}
                  </div>
                  <p className="text-sm">Result will appear here</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}