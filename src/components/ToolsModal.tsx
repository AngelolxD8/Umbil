// src/components/ToolsModal.tsx
"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ToolType = 'referral' | 'safety_netting' | 'discharge_summary' | 'sbar';

type ToolsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const TOOLS = [
  { id: 'referral', label: 'Referral Letter', icon: '✉️', placeholder: "29F. Severe back pain > L leg. Saddle anaesthesia. Bloods normal. Analgesia tried.", desc: "Generates a professional GP referral letter." },
  { id: 'sbar', label: 'SBAR Handover', icon: '📢', placeholder: "78M, confusion, UTI, BP 80/50. Needs admission.", desc: "Structured handover for urgent calls." },
  { id: 'safety_netting', label: 'Safety Netting', icon: '🛡️', placeholder: "Viral child, fever, eating ok.", desc: "Text block for notes advising when to return." },
  { id: 'discharge_summary', label: 'Discharge Condenser', icon: '🏥', placeholder: "Paste long daily ward notes here...", desc: "Extracts diagnosis, meds, and follow-up." },
];

export default function ToolsModal({ isOpen, onClose }: ToolsModalProps) {
  const [activeTool, setActiveTool] = useState<ToolType>('referral');
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setOutput("");

    try {
      const res = await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolType: activeTool, input }),
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

  const currentTool = TOOLS.find(t => t.id === activeTool)!;

  return (
    <div className="modal-overlay">
      <div className="modal-content tools-modal-content">
        
        {/* Header */}
        <div className="tools-header">
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>🛠️</span> Clinical Tools
          </h3>
          <button onClick={onClose} className="close-button" style={{ position: 'static' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="tools-body">
          
          {/* Responsive Sidebar (Left on Desktop, Top Scroll on Mobile) */}
          <div className="tools-sidebar">
            {TOOLS.map((t) => (
              <button
                key={t.id}
                className={`tool-button ${activeTool === t.id ? 'active' : ''}`}
                onClick={() => { setActiveTool(t.id as ToolType); setInput(""); setOutput(""); }}
              >
                <span className="tool-icon">{t.icon}</span> 
                <span className="tool-label">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="tools-main">
            
            <div className="input-section">
              <label className="form-label" style={{ marginBottom: '8px' }}>Input ({currentTool.label})</label>
              <p style={{ fontSize: '0.85rem', color: 'var(--umbil-muted)', marginBottom: '12px' }}>{currentTool.desc}</p>
              <textarea
                className="form-control"
                style={{ height: '120px', resize: 'none', fontFamily: 'monospace', fontSize: '0.9rem' }}
                placeholder={currentTool.placeholder}
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button 
                  className="btn btn--primary" 
                  onClick={handleGenerate} 
                  disabled={loading || !input.trim()}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {loading ? 'Generating...' : <>✨ Generate</>}
                </button>
              </div>
            </div>

            {/* Output Area */}
            <div className="output-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="form-label">Generated Output</label>
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
                  backgroundColor: output ? 'var(--umbil-surface)' : 'var(--umbil-bg)',
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.6',
                  minHeight: '150px',
                  width: '100%',
                  maxWidth: '100%',
                  // --- FIX START ---
                  overflowX: 'auto',  // Allow horizontal scrolling for the whole container
                  display: 'block'    // Ensure block layout for scrolling
                  // --- FIX END ---
                }}
              >
                {output ? (
                  <div className="markdown-content-wrapper">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // Table Wrapper: Forces horizontal scroll specifically for tables
                        table: ({ ...props }) => (
                          <div className="table-scroll-wrapper" style={{ overflowX: 'auto', width: '100%', marginBottom: '1em', display: 'block' }}>
                            <table {...props} style={{ borderCollapse: 'collapse', width: '100%', minWidth: 'max-content' }} /> 
                          </div>
                        ),
                        // Code Block Wrapper: Ensures code blocks scroll instead of breaking layout
                        pre: ({ ...props }) => (
                           <div style={{ overflowX: 'auto', width: '100%', backgroundColor: 'rgba(0,0,0,0.03)', padding: '10px', borderRadius: '4px' }}>
                             <pre {...props} />
                           </div>
                        )
                      }}
                    >
                      {output}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <span style={{ color: 'var(--umbil-muted)', fontStyle: 'italic' }}>Output will appear here...</span>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}