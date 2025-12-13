// src/app/admin/page.tsx
"use client";

import { useState } from "react";

export default function AdminIngestionPage() {
	const [text, setText] = useState("");
	const [source, setSource] = useState("");
	const [password, setPassword] = useState("");
	const [status, setStatus] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleIngestion = async () => {
		// Simple front end for now. In prod, must secure API route.
		if (password !== "umbilYedmin#55739") {
			setStatus("Wrong admin password entered, process aborted");
			return;
		}
		if (!text.trim() || !source.trim()) {
			setStatus("Please provide both text and a source name.");
			return;
		}

		setLoading(true);
		setStatus("Processing text.. (Chunking & Embedding text)");

		try {
			const response = await fetch("/api/admin/ingest", {
				method: "POST",
				headers: { "Content-Type": "application/json"},
				body: JSON.stringify({ text, source }),
			});

			const data = await response.json();

			if (!response.ok) throw new Error(data.error || "Failed to complete ingestion process");
			
			setStatus(`Success! Processed ${data.chunksProcessed} chunks from "${source}".`);
			setText(""); // clears text for next process
		} catch (err: any) {
			console.error(err);
			setStatus(`Error: ${err.message}`);
		} finally {
			setLoading(false);
		}
	};

	return (
    <section className="main-content">
      <div className="container" style={{ maxWidth: "800px", marginTop: "40px" }}>
        <h2 style={{ marginBottom: "24px" }}>Admin: Ingest Clinical Guidance</h2>

        <div className="card">
          <div className="card__body">
            
            <div className="form-group">
              <label className="form-label">Admin Password</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Source Name (Citation)</label>
              <input
                className="form-control"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g., NICE NG80: Asthma (Diagnosis), Page 4-5"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Content Text</label>
              <textarea
                className="form-control"
                rows={15}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste the full text from the PDF/Webpage here..."
              />
            </div>

            <button
              className="btn btn--primary"
              onClick={handleIngestion}
              disabled={loading}
              style={{ width: "100%" }}
            >
              {loading ? "Ingesting..." : "💾 Save to Knowledge Base"}
            </button>

            {status && (
              <div style={{ 
                marginTop: "16px", 
                padding: "12px", 
                borderRadius: "8px", 
                backgroundColor: status.startsWith("✅") ? "#ecfdf5" : "#fef2f2",
                color: status.startsWith("✅") ? "#047857" : "#dc2626",
                fontWeight: 600
              }}>
                {status}
              </div>
            )}

          </div>
        </div>
      </div>
    </section>
  );
}