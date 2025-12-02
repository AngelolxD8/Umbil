// src/components/ToolsModal.tsx
"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ToolId = 'referral' | 'safety_netting' | 'discharge_summary' | 'sbar';

interface ToolConfig {
  id: ToolId;
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  desc: string;
}

// Professional SVG Icons
const Icons = {
  Referral: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  Shield: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Sbar: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>,
  Discharge: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M10 13h4"/><path d="M12 11v4"/></svg>,
};

const TOOLS: ToolConfig[] = [
  { 
    id: 'referral', 
    label: 'Referral Writer', 
    icon: Icons.Referral, 
    placeholder: "e.g., 54F. 3 weeks hoarse voice. Smoker. Exam: Neck normal. Request ENT 2WW.", 
    desc: "Drafts a professional GP referral letter from shorthand notes." 
  },
  { 
    id: 'safety_netting', 
    label: 'Safety Netting', 
    icon: Icons.Shield, 
    placeholder: "e.g., 3yo child, fever 38.5, drinking ok, no rash. Viral URTI.", 
    desc: "Generates medico-legal advice and specific red flags for the patient." 
  },
  { 
    id: 'sbar', 
    label: 'SBAR Handover', 
    icon: Icons.Sbar, 
    placeholder: "e.g., 78M, Bay 4. BP 80/50, Sats 88%. Peri-arrest. Need Reg review.", 
    desc: "Structured situation-background-assessment-recommendation for urgent calls." 
  },
  { 
    id: 'discharge_summary', 
    label: 'Discharge Condenser', 
    icon: Icons.Discharge, 
    placeholder: "Paste the long list of daily ward rounds here...", 
    desc: "Extracts diagnosis, med changes, and follow-up from messy notes." 
  },
];

type ToolsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ToolsModal({ isOpen, onClose }: ToolsModalProps) {
  const [activeToolId, setActiveToolId] = useState<ToolId>('referral');
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const activeTool = TOOLS.find(t => t.id === activeToolId)!;

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setOutput("");

    try {
      const res = await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolType: activeToolId, input }),
      });

      if (!res.ok || !res.body) throw new Error("Failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setOutput((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch (e) {
      console.error(e);
      setOutput("⚠️ Error generating content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    alert("Copied to clipboard!");
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content tools-modal-content">
        
        {/* Header */}
        <div className="tools-header">
          <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
             <span style={{ fontSize: '1.2rem' }}>✨</span>
             <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Clinical Tools</h3>
          </div>
          <button onClick={onClose} className="close-button" style={{ position: 'static' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="tools-body">
          
          {/* Sidebar (Gemini Style Selection) */}
          <div className="tools-sidebar">
            {TOOLS.map((t) => (
              <button
                key={t.id}
                className={`tool-button ${activeToolId === t.id ? 'active' : ''}`}
                onClick={() => { setActiveToolId(t.id); setInput(""); setOutput(""); }}
              >
                <span className="tool-icon" style={{ opacity: activeToolId === t.id ? 1 : 0.7 }}>{t.icon}</span> 
                <span className="tool-label">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="tools-main">
            
            {/* Input Section */}
            <div className="input-section">
              <div style={{ marginBottom: '12px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>{activeTool.label}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--umbil-muted)' }}>{activeTool.desc}</p>
              </div>
              
              <textarea
                className="form-control"
                style={{ 
                    height: '140px', 
                    resize: 'none', 
                    fontSize: '0.95rem',
                    backgroundColor: 'var(--umbil-bg)',
                    border: '1px solid var(--umbil-divider)' 
                }}
                placeholder={activeTool.placeholder}
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button 
                  className="btn btn--primary" 
                  onClick={handleGenerate} 
                  disabled={loading || !input.trim()}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 20px' }}
                >
                  {loading ? 'Working...' : <>Generate <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2z"/></svg></>}
                </button>
              </div>
            </div>

            {/* Output Section */}
            <div className="output-section" style={{ borderTop: '1px solid var(--umbil-divider)', paddingTop: '20px', marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label className="form-label" style={{marginBottom:0}}>Result</label>
                {output && (
                  <button onClick={handleCopy} className="action-button">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    Copy
                  </button>
                )}
              </div>
              
              <div 
                className="form-control" 
                style={{ 
                  flex: 1, 
                  overflowY: 'auto', 
                  backgroundColor: 'var(--umbil-surface)',
                  minHeight: '200px',
                  border: 'none',
                  padding: 0
                }}
              >
                {output ? (
                  <div className="markdown-content-wrapper">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
                  </div>
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--umbil-muted)', opacity: 0.5 }}>
                    <span style={{ fontSize: '0.9rem' }}>Output will appear here</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}