// src/components/ToolsModal.tsx
"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// --- Configuration Types ---
type ToolId = 'referral' | 'safety_netting' | 'discharge_summary' | 'sbar' | 'translate_reflection';

interface ToolField {
  id: string;
  label: string;
  type: 'text' | 'textarea';
  placeholder: string;
  rows?: number;
}

interface ToolConfig {
  id: ToolId;
  title: string;
  icon: string;
  description: string;
  fields: ToolField[];
  color: string; // Accent color for the card
}

// --- Tool Definitions (The "App Store" Config) ---
const TOOLS: ToolConfig[] = [
  {
    id: 'safety_netting',
    title: 'The Safety Netter',
    icon: '🛡️',
    description: 'Generate medico-legal safety netting advice for notes.',
    color: '#10b981', // Emerald
    fields: [
      { id: 'presentation', label: 'Clinical Presentation', type: 'text', placeholder: 'e.g. Feverish child, 3yo, eating ok' },
      { id: 'positives', label: 'Key Negatives/Positives', type: 'textarea', placeholder: 'e.g. No rash, CRT <2s, chest clear', rows: 2 }
    ]
  },
  {
    id: 'referral',
    title: 'Referral Writer',
    icon: '✉️',
    description: 'Draft professional hospital referral letters instantly.',
    color: '#3b82f6', // Blue
    fields: [
      { id: 'patient', label: 'Patient Details', type: 'text', placeholder: 'e.g. 54F, Mrs Smith' },
      { id: 'history', label: 'History & Symptoms', type: 'textarea', placeholder: 'History of presenting complaint...', rows: 4 },
      { id: 'exam', label: 'Examination & Vitals', type: 'textarea', placeholder: 'BP 140/90, Chest clear...', rows: 3 },
      { id: 'pmh', label: 'PMH / Meds', type: 'textarea', placeholder: 'Hypertension, Amlodipine', rows: 2 }
    ]
  },
  {
    id: 'sbar',
    title: 'SBAR Handover',
    icon: '📢',
    description: 'Structured handover for urgent registrar calls.',
    color: '#f59e0b', // Amber
    fields: [
      { id: 'situation', label: 'Situation (Who/Where/What)', type: 'textarea', placeholder: '78M in Bay 4, peri-arrest...', rows: 2 },
      { id: 'background', label: 'Background', type: 'textarea', placeholder: 'Admitted with CAP, Day 3...', rows: 2 },
      { id: 'assessment', label: 'Assessment (Vitals)', type: 'textarea', placeholder: 'BP dropping, Sats 88%...', rows: 2 },
      { id: 'recommendation', label: 'What do you need?', type: 'text', placeholder: 'e.g. Urgent review please' }
    ]
  },
  {
    id: 'discharge_summary',
    title: 'Discharge Condenser',
    icon: '🏥',
    description: 'Turn messy ward notes into a GP summary.',
    color: '#8b5cf6', // Violet
    fields: [
      { id: 'notes', label: 'Paste Daily Notes Here', type: 'textarea', placeholder: 'Paste the full chronological notes...', rows: 8 }
    ]
  },
  {
    id: 'translate_reflection',
    title: 'Reflection Translator',
    icon: '🌍',
    description: 'Translate native-language thoughts into GMC English.',
    color: '#ec4899', // Pink
    fields: [
      { id: 'text', label: 'Your Reflection', type: 'textarea', placeholder: 'Write freely in your first language...', rows: 6 }
    ]
  }
];

type ToolsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ToolsModal({ isOpen, onClose }: ToolsModalProps) {
  const [activeToolId, setActiveToolId] = useState<ToolId | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset state when closing or switching tools
  const handleClose = () => {
    setActiveToolId(null);
    setFormValues({});
    setOutput("");
    onClose();
  };

  const handleBackToGrid = () => {
    setActiveToolId(null);
    setFormValues({});
    setOutput("");
  };

  const handleInputChange = (fieldId: string, value: string) => {
    setFormValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleGenerate = async () => {
    if (!activeToolId) return;
    setLoading(true);
    setOutput("");

    try {
      // We send the 'fields' object directly. The API (Phase 1) will handle combining them.
      const res = await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          toolType: activeToolId, 
          fields: formValues 
        }),
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
    alert("Copied to clipboard!"); // Ideally use a Toast here if available
  };

  if (!isOpen) return null;

  const activeTool = TOOLS.find(t => t.id === activeToolId);

  return (
    <div className="modal-overlay">
      <div className="modal-content tools-modal-content">
        
        {/* --- Header --- */}
        <div className="tools-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {activeTool ? (
              <button onClick={handleBackToGrid} className="action-icon-btn" title="Back to Tools">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              </button>
            ) : (
              <span style={{ fontSize: '1.5rem' }}>🛠️</span>
            )}
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              {activeTool ? activeTool.title : "Medical Tools Library"}
            </h3>
          </div>
          <button onClick={handleClose} className="close-button" style={{ position: 'static' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* --- Body Content --- */}
        <div className="tools-body" style={{ flexDirection: 'column', padding: '0', backgroundColor: 'var(--umbil-bg)' }}>
          
          {/* VIEW 1: TOOL GRID (When no tool selected) */}
          {!activeTool && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
              gap: '16px', 
              padding: '24px',
              overflowY: 'auto'
            }}>
              {TOOLS.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setActiveToolId(tool.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    textAlign: 'left',
                    background: 'var(--umbil-surface)',
                    border: '1px solid var(--umbil-card-border)',
                    borderRadius: '12px',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    boxShadow: 'var(--umbil-shadow-sm)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--umbil-shadow-lg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'var(--umbil-shadow-sm)';
                  }}
                >
                  <div style={{ 
                    position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', 
                    backgroundColor: tool.color 
                  }} />
                  <div style={{ fontSize: '2rem', marginBottom: '12px' }}>{tool.icon}</div>
                  <h4 style={{ fontWeight: 600, marginBottom: '8px', fontSize: '1.1rem' }}>{tool.title}</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--umbil-muted)', lineHeight: '1.5' }}>
                    {tool.description}
                  </p>
                </button>
              ))}
            </div>
          )}

          {/* VIEW 2: ACTIVE TOOL FORM (Split View) */}
          {activeTool && (
            <div className="tools-main" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0' }}>
              
              <div style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', // Mobile default
                overflow: 'hidden'
              }}>
                
                {/* -- Left/Top: Input Form -- */}
                <div style={{ 
                  flex: 1, 
                  padding: '24px', 
                  overflowY: 'auto',
                  borderBottom: '1px solid var(--umbil-divider)',
                  backgroundColor: 'var(--umbil-surface)'
                }}>
                  {activeTool.fields.map((field) => (
                    <div key={field.id} className="form-group">
                      <label className="form-label">{field.label}</label>
                      {field.type === 'textarea' ? (
                        <textarea
                          className="form-control"
                          rows={field.rows || 3}
                          placeholder={field.placeholder}
                          value={formValues[field.id] || ''}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                          style={{ resize: 'vertical' }}
                        />
                      ) : (
                        <input
                          className="form-control"
                          type="text"
                          placeholder={field.placeholder}
                          value={formValues[field.id] || ''}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                  
                  <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      className="btn btn--primary" 
                      onClick={handleGenerate} 
                      disabled={loading}
                      style={{ minWidth: '120px' }}
                    >
                      {loading ? 'Thinking...' : `✨ Generate ${activeTool.title.split(' ')[0]}`}
                    </button>
                  </div>
                </div>

                {/* -- Right/Bottom: Output -- */}
                {(output || loading) && (
                  <div style={{ 
                    flex: 1, 
                    padding: '24px', 
                    backgroundColor: 'var(--umbil-bg)', 
                    borderTop: '1px solid var(--umbil-divider)',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ fontWeight: 600, color: 'var(--umbil-brand-teal)' }}>Generated Output</h4>
                      <button onClick={handleCopy} className="action-button" title="Copy to clipboard">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        Copy
                      </button>
                    </div>
                    
                    <div className="form-control" style={{ 
                      flex: 1, 
                      overflowY: 'auto', 
                      backgroundColor: 'var(--umbil-surface)',
                      fontFamily: 'var(--font-geist-mono), monospace',
                      fontSize: '0.9rem',
                      lineHeight: '1.6',
                      border: '1px solid var(--umbil-card-border)'
                    }}>
                      {output ? (
                        <div className="markdown-content-wrapper">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {output}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--umbil-muted)' }}>
                          <span className="loading-indicator"><span>•</span><span>•</span><span>•</span></span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Responsive adjustments for the split view */}
      <style jsx>{`
        @media (min-width: 768px) {
          .tools-main > div {
            flex-direction: row !important;
          }
          .tools-main > div > div:first-child {
            border-bottom: none !important;
            border-right: 1px solid var(--umbil-divider);
            max-width: 400px;
          }
          .tools-main > div > div:last-child {
            border-top: none !important;
          }
        }
      `}</style>
    </div>
  );
}