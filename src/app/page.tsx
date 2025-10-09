"use client";

import { useState } from "react";

export default function Home() {
  return (
    <main className="main-content">
      {/* GDPR / sources note */}
      <div className="container">
        <div className="compliance-note" role="note" aria-label="GDPR notice">
          <strong>Important:</strong> Please don’t enter any patient-identifiable information.
          Umbil summarises trusted sources like <strong>NICE</strong>, <strong>SIGN</strong>, and <strong>CKS</strong>.
          Learning captured here can feed straight into <strong>PDPs</strong> and <strong>appraisals</strong>.
        </div>
      </div>

      {/* Ask section */}
      <div className="container">
        <div className="ask-section">
          <h2>Ask Your Clinical Question</h2>
          <p className="section-description">
            Get evidence-based answers and automatically track your learning for CPD
          </p>

          <AskBox />
        </div>
      </div>
    </main>
  );
}

function AskBox() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [reflection, setReflection] = useState("");
  const [tags, setTags] = useState("");

  const ask = async () => {
    if (!q.trim()) return;
    setLoading(true);
    setAnswer(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setAnswer(data.answer);
      setTimeout(
        () => document.getElementById("response-section")?.scrollIntoView({ behavior: "smooth" }),
        50
      );
    } catch (e: any) {
      setAnswer(`⚠️ ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const logToCPD = async () => {
    const { addCPD } = await import("@/lib/store");
    addCPD({
      timestamp: new Date().toISOString(),
      question: q,
      answer: answer || "",
      reflection: reflection || "",
      tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : [],
    });
    const toast = document.getElementById("toast");
    if (toast) {
      toast.classList.remove("hidden");
      setTimeout(() => toast.classList.add("hidden"), 1800);
    }
    setReflection("");
    setTags("");
  };

  return (
    <>
      <div className="search-container">
        <input
          className="form-control search-input"
          placeholder="Ask a clinical question..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
        />
        <button className="btn btn--primary search-btn" onClick={ask} disabled={loading}>
          {loading ? "Working..." : "Ask Umbil"}
        </button>
      </div>

      <div id="response-section" className="response-section">
        {loading && (
          <div className="loading" id="loading">
            <div className="spinner" />
            <p>Analyzing your question...</p>
          </div>
        )}

        {!loading && answer && (
          <div id="answer-content" className="answer-content">
            <div className="answer-header">
              <h3>{q}</h3>
              <div className="evidence-badges">
                <span className="status status--success">Evidence Level: High</span>
                <span className="domain-badge" style={{ backgroundColor: "#4CAF50" }}>
                  Knowledge, skills and development
                </span>
              </div>
            </div>

            <div className="answer-body">
              <div className="answer-text">
                {answer.split("\n").map((line, i) => (
                  <p key={i} dangerouslySetInnerHTML={{ __html: line }} />
                ))}
              </div>

              {/* Reflection + tags + log button */}
              <div className="form-group">
                <label className="form-label">Reflection (optional)</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="How will this influence your practice?"
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tags (comma separated)</label>
                <input
                  className="form-control"
                  placeholder="e.g. respiratory, COPD"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>

              <div className="cpd-actions">
                <button className="btn btn--primary" onClick={logToCPD}>📚 Log this learning for CPD</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      <div id="toast" className="toast hidden">
        <div className="toast-content">
          <span className="toast-icon">✅</span>
          <span>Saved to CPD log</span>
        </div>
      </div>
    </>
  );
}
