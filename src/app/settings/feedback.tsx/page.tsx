// src/app/settings/feedback/page.tsx
"use client";

import { useState } from "react";

// Placeholder for your actual external feedback form URL (e.g., Google Form, Typeform)
const EXTERNAL_FEEDBACK_FORM_URL = "https://docs.google.com/forms/d/e/YOUR_FORM_ID/viewform";

export default function FeedbackPage() {
  const [hasClicked, setHasClicked] = useState(false); // New state to manage display after click

  const handleClick = () => {
    // In a real application, you might log the click event to Supabase here.
    setHasClicked(true);
    // Note: The external form will open in a new tab/window via the <a> tag,
    // so we don't need explicit routing here.
  };

  return (
    <section className="main-content">
      <div className="container">
        <h2>Send Feedback & Suggestions</h2>
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card__body" style={{ textAlign: 'center', padding: '30px' }}>
            
            {!hasClicked ? (
              <>
                <p className="section-description" style={{ marginBottom: 20 }}>
                  Have a suggestion, found a bug, or have an idea for a new feature? We want to hear it!
                  <br />
                  Click the button below to submit your feedback via our secure external form.
                </p>

                <a 
                  className="btn btn--primary" 
                  href={EXTERNAL_FEEDBACK_FORM_URL}
                  target="_blank" // Opens the form in a new tab
                  rel="noopener noreferrer"
                  onClick={handleClick}
                >
                  📝 Open External Feedback Form
                </a>
              </>
            ) : (
              <div style={{ padding: '20px 0' }}>
                <h3 style={{color: 'var(--umbil-brand-teal)', marginBottom: 12}}>Thank you!</h3>
                <p>The feedback form should have opened in a new window.</p>
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