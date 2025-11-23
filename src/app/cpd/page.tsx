// src/app/cpd/page.tsx
"use client";

import { useEffect, useState } from "react";
import { CPDEntry, getCPD, getCPDPage, deleteCPD } from "@/lib/store"; 
import { useUserEmail } from "@/hooks/useUser";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const PAGE_SIZE = 10;

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
  const [loading, setLoading] = useState(true);
  
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  
  const [allTags, setAllTags] = useState<string[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);

  const [isDownloading, setIsDownloading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [debouncedQ, setDebouncedQ] = useState(q);
  const [debouncedTag, setDebouncedTag] = useState(tag);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQ(q);
      setDebouncedTag(tag);
    }, 500); 
    return () => clearTimeout(handler);
  }, [q, tag]);

  useEffect(() => {
    setCurrentPage(0);
  }, [debouncedQ, debouncedTag]);

  useEffect(() => {
    const fetchAllTags = async () => {
      setTagsLoading(true);
      const allEntries = await getCPD(); 
      const tags = Array.from(new Set(allEntries.flatMap((e) => e.tags || []))).sort();
      setAllTags(tags);
      setTagsLoading(false);
    };
    fetchAllTags();
  }, []); 

  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      const { entries, count, error } = await getCPDPage({
        page: currentPage,
        limit: PAGE_SIZE,
        q: debouncedQ || undefined,
        tag: debouncedTag || undefined,
      });

      if (error) {
        console.error("Error fetching CPD page:", error);
        setList([]);
        setTotalCount(0);
      } else {
        setList(entries);
        setTotalCount(count);
      }
      setLoading(false);
    };

    fetchPage();
  }, [currentPage, debouncedQ, debouncedTag]); 

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const download = async () => {
    setIsDownloading(true);
    const { entries, error } = await getCPDPage({
      page: 0,
      limit: 10000, 
      q: debouncedQ || undefined,
      tag: debouncedTag || undefined,
    });

    if (error) {
      alert("Failed to download CSV data.");
      setIsDownloading(false);
      return;
    }

    const csvContent = toCSV(entries);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cpd_log.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsDownloading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry? This cannot be undone.")) return;
    
    setDeletingId(id);
    const { error } = await deleteCPD(id);
    
    if (error) {
        alert("Failed to delete entry. Please try again.");
        console.error(error);
    } else {
        setList(prev => prev.filter(item => item.id !== id));
        setTotalCount(prev => prev - 1);
    }
    setDeletingId(null);
  };

  return (
    <section className="main-content">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2>My CPD Learning Log</h2>
          {totalCount > 0 && (
            <button className="btn btn--outline" onClick={download} disabled={isDownloading}>
              {isDownloading ? "Generating..." : "📥 Download CSV"}
            </button>
          )}
        </div>

        <div className="filters" style={{ marginBottom: 32 }}>
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
            disabled={tagsLoading}
          >
            <option value="">{tagsLoading ? "Loading tags..." : "All tags"}</option>
            {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="cpd-entries">
          {loading && <p>Loading entries...</p>}
          {!loading && totalCount === 0 && (
            <div className="card"><div className="card__body">
              {q || tag ? "No entries matched your search criteria." : "No entries found. Log something new on the Ask page!"}
            </div></div>
          )}
          
          {!loading && list.map((e, idx) => (
            <div key={e.id || idx} className="card" style={{ marginBottom: 24 }}>
              <div className="card__body" style={{ padding: '20px' }}>
                <div style={{ marginBottom: 16, borderBottom: '1px solid var(--umbil-divider)', paddingBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--umbil-muted)' }}>
                      {new Date(e.timestamp).toLocaleString()}
                    </div>
                    <div style={{ fontWeight: 600, marginTop: 8, fontSize: '1.1rem' }}>{e.question}</div>
                  </div>
                  
                  {e.id && (
                      <button 
                        onClick={() => handleDelete(e.id!)}
                        disabled={deletingId === e.id}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--umbil-muted)',
                            opacity: deletingId === e.id ? 0.5 : 1,
                            padding: '4px'
                        }}
                        title="Delete Entry"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                  )}
                </div>
                <div style={{ fontSize: '0.9rem' }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{e.answer}</ReactMarkdown>
                </div>
                {e.reflection && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--umbil-divider)', fontStyle: 'italic', color: 'var(--umbil-muted)', fontSize: '0.9rem' }}>
                    <strong>Reflection:</strong> {e.reflection}
                  </div>
                )}
                <div style={{ marginTop: 12 }}>
                  {(e.tags || []).map((t) => (
                    <span key={t} style={{ marginRight: 8, padding: '4px 8px', borderRadius: 12, backgroundColor: 'var(--umbil-hover-bg)', fontSize: '0.8rem', color: 'var(--umbil-text)', fontWeight: 500 }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
            <button 
              className="btn btn--outline"
              onClick={() => setCurrentPage(p => p - 1)}
              disabled={currentPage === 0 || loading}
            >
              Previous
            </button>
            <span style={{ color: 'var(--umbil-muted)', fontSize: '0.9rem' }}>
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              className="btn btn--outline"
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage >= totalPages - 1 || loading}
            >
              Next
            </button>
          </div>
        )}

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