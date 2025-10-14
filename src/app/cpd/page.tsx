// src/app/cpd/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { CPDEntry, getCPD } from "@/lib/store";
import { useUserEmail } from "@/hooks/useUser";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function toCSV(rows: CPDEntry[]) {
  const header = ["Timestamp", "Question", "Answer", "Reflection", "Tags"];
  const body = rows.map((r) =>
    [
      r.timestamp,
      `"${(r.question || "").replace(/"/g, '""')}"`,
      `"${(r.answer || "").replace(/"/g, '""')}"`,
      `"${(r.reflection || "").replace(/"/g, '""')}"`,
      `"${(r.tags || []).join("; ")}"`,
    ].join(",")
  );
  return [header.join(","), ...body].join("\n");
}

function CPDInner() {
  const [list, setList] = useState<CPDEntry[]>([]);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");

  useEffect(() => setList(getCPD()), []);

  const filtered = useMemo(() => {
    return list.filter((e) => {
      const hay = (
        (e.question || "") +
        " " +
        (e.answer || "") +
        " " +
        (e.tags || []).join(" ")
      ).toLowerCase();
      const okQ = !q || hay.includes(q.toLowerCase());
      const okTag =
        !tag ||
        (e.tags || []).map((t) => t.toLowerCase()).includes(tag.toLowerCase());
      return okQ && okTag;
    });
  }, [list, q, tag]);

  const allTags = Array.from(new Set(list.flatMap((e) => e.tags || []))).sort();

  const download = () => {
    const blob = new Blob([toCSV(filtered)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cpd_log.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="main-content">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2>My CPD Learning Log</h2>
          <button className="btn btn--outline" onClick={download}>📥 Download CSV</button>
        </div>

        <div className="card card__body" style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <input
            className="form-control"
            placeholder="Search text…"
            value={q}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
          />
          <select
            className="form-control"
            value={tag}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTag(e.target.value)}
          >
            <option value="">All tags</option>
            {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="cpd-entries">
          {filtered.length === 0 && (
            <div className="card"><div className="card__body">No entries yet. Log something on the Ask page.</div></div>
          )}
          {filtered.map((e, idx) => (
            <div key={idx} className="card" style={{ marginBottom: 16 }}>
              <div className="card__body">
                <div style={{ marginBottom: 12, borderBottom: '1px solid var(--umbil-divider)', paddingBottom: 12 }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--umbil-muted)' }}>
                    {new Date(e.timestamp).toLocaleString()}
                  </div>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>{e.question}</div>
                </div>
                <div style={{ fontSize: '0.9rem' }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{e.answer}</ReactMarkdown>
                </div>
                {e.reflection && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--umbil-divider)', fontStyle: 'italic', color: 'var(--umbil-muted)', fontSize: '0.9rem' }}>
                    <strong>Reflection:</strong> {e.reflection}
                  </div>
                )}
                <div style={{ marginTop: 12 }}>
                  {(e.tags || []).map((t) => (
                    <span key={t} style={{ marginRight: 8, padding: '4px 8px', borderRadius: 12, backgroundColor: 'rgba(31, 184, 205, 0.1)', fontSize: '0.8rem', color: 'var(--umbil-brand-teal)' }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function CPDPage() {
  const { email, loading } = useUserEmail();

  if (loading) return null;
  if (!email) {
    return (
      <section className="main-content">
        <div className="container">
          <div className="card"><div className="card__body">Please <a href="/auth" className="link">sign in</a> to view this page.</div></div>
        </div>
      </section>
    );
  }

  return <CPDInner />;
}