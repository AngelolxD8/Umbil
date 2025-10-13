// src/app/page.tsx
"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type AskResponse = { answer?: string; error?: string };

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return "Unknown error";
  }
}

export default function Home() {
  return (
    <main className="main-content">
      {/* GDPR / sources note (now styled as a bubble via .compliance-note) */}
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

          {/* NEW marketing line */}
          <p className="subtagline">
            Clinical intelligence, reflection, and CPD — re-imagined for modern medicine.
          </p>

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
  const [q, setQ] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [reflection, setReflection] = useState<string>("");
  const [tags, setTags] = useState<string>("");
  const [tone, setTone] = useState<"conversational" | "formal" | "reflective">(
    "conversational"
  );

  const ask = async () => {
    if (!q.trim()) return;
    setLoading(true);
    setAnswer(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, tone }),
      });

      const data: AskResponse = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");

      setAnswer(data.answer ?? "");
      setTimeout(
        () =>
          document
            .getElementById("response-section")
            ?.scrollIntoView({ behavior: "smooth" }),
        50
      );
    } catch (err: unknown) {
      setAnswer(`⚠️ ${getErrorMessage(err)}`);
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
      tags: tags
        ? tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
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
      <div className="search-container" role="search" aria-label="Ask Umbil">
        <input
          className="form-control search-input"
          placeholder="Ask a clinical question..."
          value={q}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && ask()}
        />
        <button className="btn btn--primary search-btn" onClick={ask} disabled={loading}>
          {loading ? "Working..." : "Ask Umbil"}
        </button>
      </div>

      {/* Tone toggle */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
        <label style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Tone:</label>
        <label style={{ cursor: "pointer" }}>
          <input
            type="radio"
            name="tone"
            checked={tone === "conversational"}
            onChange={() => setTone("conversational")}
          />{" "}
          Conversational
        </label>
        <label style={{ cursor: "pointer" }}>
          <input
            type="radio"
            name="tone"
            checked={tone === "formal"}
            onChange={() => setTone("formal")}
          />{" "}
          Formal
        </label>
        <label style={{ cursor: "pointer" }}>
          <input
            type="radio"
            name="tone"
            checked={tone === "reflective"}
            onChange={() => setTone("reflective")}
          />{" "}
          Reflective
        </label>
      </div>

      <div id="response-section" className="response-section" style={{ marginTop: 20 }}>
        {loading && (
          <div className="loading" id="loading">
            <div className="spinner" />
            <p>Analyzing your question...</p>
          </div>
        )}

        {!loading && answer && (
          <div id="answer-content" className="answer-content answer-card">
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
                {/* Render Markdown cleanly */}
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {answer}
                </ReactMarkdown>
              </div>

              {/* Reflection + tags + log button */}
              <div className="form-group">
                <label className="form-label">Reflection (optional)</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="How will this influence your practice?"
                  value={reflection}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReflection(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tags (comma separated)</label>
                <input
                  className="form-control"
                  placeholder="e.g. respiratory, COPD"
                  value={tags}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTags(e.target.value)}
                />
              </div>

              <div className="cpd-actions">
                <button className="btn btn--primary" onClick={logToCPD}>
                  📚 Log this learning for CPD
                </button>
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