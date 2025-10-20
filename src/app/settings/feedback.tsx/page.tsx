// src/app/settings/feedback/page.tsx
"use client";

import { useState } from "react";

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) return;

    setSending(true);
    
    // In a real application, you would send this to an API endpoint 
    // that saves the feedback (e.g., to a Supabase table, or emails it).
    // For this example, we simulate a successful send after a brief delay.
    await new Promise(resolve => setTimeout(resolve, 1500));

    setSending(false);
    setIsSent(true);
    setFeedback(""); // Clear the input after setting isSent to true
  };

  return (
    <section className="main-content">
      <div className="container">
        <h2>Send Feedback & Suggestions</h2>
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card__body">
            {isSent ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <h3 style={{color: 'var(--umbil-brand-teal)', marginBottom: 12}}>✅ Thank you for your feedback!</h3>
                <p>Your input helps us improve Umbil for the entire medical community. We appreciate your time.</p>
                <button 
                    className="btn btn--outline" 
                    style={{marginTop: 20}}
                    onClick={() => setIsSent(false)}
                >
                    Submit New Feedback
                </button>
              </div>
            ) : (
              <>
                <p className="section-description" style={{ marginBottom: 16 }}>
                  Have a suggestion, found a bug, or have an idea for a new feature? We want to hear it!
                </p>
                <div className="form-group">
                  <label className="form-label">Your Feedback / Suggestion</label>
                  <textarea
                    className="form-control"
                    rows={8}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="e.g., The search filter should include the reflection text, or, I found an error in the COPD summary."
                    disabled={sending}
                  />
                </div>
                <button 
                  className="btn btn--primary" 
                  onClick={handleSubmit} 
                  disabled={sending || !feedback.trim()}
                >
                  {sending ? "Sending..." : "Submit Feedback"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}