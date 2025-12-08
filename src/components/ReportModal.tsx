// src/components/ReportModal.tsx
"use client";

import { useState } from "react";

type ReportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  entry: { question: string; answer: string } | null;
  onSubmit: (reason: string) => void;
};

export default function ReportModal({ isOpen, onClose, entry, onSubmit }: ReportModalProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !entry) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    await onSubmit(reason);
    setLoading(false);
    setReason(""); // Clear for next time
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '450px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#dc2626' }}>Report Issue</h3>
          <button onClick={onClose} className="close-button" style={{position:'static'}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem', color: '#991b1b' }}>
          <strong>Helping us improve:</strong> Identifying incorrect hallucinations or outdated guidelines helps keep Umbil safe for everyone.
        </div>

        <label className="form-label">What is incorrect or unsafe about this response?</label>
        <textarea
          className="form-control"
          rows={4}
          autoFocus
          placeholder="e.g. The dosage for Amoxicillin listed here is incorrect according to the latest BNF..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={loading}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
          <button className="btn btn--outline" onClick={onClose} disabled={loading}>Cancel</button>
          <button 
            className="btn btn--primary" 
            style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
            onClick={handleSubmit}
            disabled={loading || !reason.trim()}
          >
            {loading ? "Sending..." : "Submit Report"}
          </button>
        </div>
      </div>
    </div>
  );
}