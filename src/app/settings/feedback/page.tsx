// src/app/settings/feedback/page.tsx
"use client";

import { useState } from "react";

// Placeholder for your actual external feedback form URL (e.g., Google Form, Typeform)
const EXTERNAL_FEEDBACK_FORM_URL = "https://docs.google.com/forms/d/1hDMhLdFbvVte_WHDgz3GaDXm9qQq6ElLuGfGavy98nw/viewform";

export default function FeedbackPage() {
  const [hasClicked, setHasClicked] = useState(false); 

  const handleClick = () => {
    // In a real application, you might log the click event to Supabase here.
    setHasClicked(true);
  };

  return (
    <section className="main-content">
      <div className="container" style={{ textAlign: 'center' }}>
        
        {/* IMPROVEMENT 1: New Title Text and Center Alignment */}
        <h2 style={{ marginBottom: 24, marginTop: 40 }}>Your Feedback & Ideas</h2> 
        
        <div className="card" style={{ maxWidth: 500, margin: '0 auto', padding: '30px' }}>
          <div className="card__body" style={{ textAlign: 'center' }}>
            
            {!hasClicked ? (
              <>
                {/* IMPROVEMENT 2: New Flow Text */}
                <p className="section-description" style={{ marginBottom: 20, fontSize: '1.1rem', fontWeight: 500 }}>
                  Ready to share your insights? We thrive on suggestions, bug reports, and feature ideas from clinicians like you.
                </p>
                <p className="section-description" style={{ marginBottom: 30, color: 'var(--umbil-muted)' }}>
                  Click below to submit your feedback via our secure external form. It only takes a minute!
                </p>

                <a 
                  className="btn btn--primary" 
                  href={EXTERNAL_FEEDBACK_FORM_URL}
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={handleClick}
                >
                  📝 Open Feedback Form
                </a>
              </>
            ) : (
              <div style={{ padding: '20px 0' }}>
                <h3 style={{color: 'var(--umbil-brand-teal)', marginBottom: 12}}>Thank You!</h3>
                <p>The feedback form should have opened in a new window. We appreciate your input.</p>
                <button 
                    className="btn btn--outline" 
                    style={{marginTop: 20}}
                    onClick={() => setHasClicked(false)}
                >
                    Back to Feedback Page
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}