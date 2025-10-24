// src/components/WelcomeModal.tsx
"use client";

import Link from "next/link";

type WelcomeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onContinueAnonymously: () => void;
};

export default function WelcomeModal({ isOpen, onClose, onContinueAnonymously }: WelcomeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 600, padding: 30, textAlign: 'center' }}>
        <h2 style={{ color: 'var(--umbil-brand-teal)', marginBottom: 10 }}>Welcome to Umbil ✨</h2>
        <p style={{ marginBottom: 20, fontSize: '1.1rem' }}>
          Your intelligent clinical co-pilot, designed by doctors.
        </p>
        
        <div style={{ padding: '20px 0', border: '1px solid var(--umbil-card-border)', borderRadius: 'var(--umbil-radius-sm)', marginBottom: 20, backgroundColor: 'var(--umbil-hover-bg)' }}>
            <p style={{ fontWeight: 600, color: 'var(--umbil-muted)' }}>
                [Insert Demo Video Here: YouTube Embed/Placeholder]
            </p>
        </div>

        <p className="section-description" style={{ marginBottom: 20 }}>
          Ask any clinical or educational question to get concise, evidence-based guidance.
          Logging in unlocks personalized features like saving for your **CPD** and **PDP**! {/* CHANGED: Removed extra "your" and ** from CPD/PDP */}
        </p>
        
        {/* Important Safety Reminder */}
        <p className="section-description" style={{ color: 'red', fontWeight: 600, marginBottom: 25 }}>
          ⚠️ Important: Never enter patient-identifiable information (PHI).
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
            <Link href="/auth" className="btn btn--primary" style={{ width: '100%' }} onClick={onClose}>
                Sign In / Sign Up
            </Link>
            <button 
                className="btn btn--outline" 
                onClick={onContinueAnonymously}
                style={{ width: '100%' }}
            >
                Continue Anonymously
            </button>
        </div>
        
        <button 
            onClick={onClose} 
            className="close-button"
            style={{ top: 15, right: 15, position: 'absolute' }}
        >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
      </div>
    </div>
  );
}