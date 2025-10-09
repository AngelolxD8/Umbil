// src/app/cpd/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { CPDEntry, getCPD } from "@/lib/store";
import { useUserEmail } from "@/hooks/useUser";

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
      <div className="container cpd-log-section">
        <div className="section-header">
          <h2>My CPD Learning Log</h2>
          <div className="header-actions">
            <button className="btn btn--outline" onClick={download}>📥 Download CSV</button>
          </div>
        </div>

        <div className="filters">
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
            <div key={idx} className="cpd-entry">
              <div className="entry-header">
                <div>
                  <div className="entry-date">{new Date(e.timestamp).toLocaleString()}</div>
                  <div className="entry-question">{e.question}</div>
                </div>
                <div className="status status--info">{(e.tags || []).join(" • ") || "No tags"}</div>
              </div>
              <div className="entry-details">
                <div
                  className="learning-points"
                  dangerouslySetInnerHTML={{ __html: (e.answer || "").replace(/\n/g, "<br/>") }}
                />
                {e.reflection && <div className="reflection">{e.reflection}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function CPDPage() {
  const { email, loading } = useUserEmail(); // hook runs unconditionally

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
