// src/app/cpd/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { CPDEntry, getAllLogs, deleteCPD } from "@/lib/store"; 
import { useUserEmail } from "@/hooks/useUser";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const PAGE_SIZE = 10;

// --- SUPER CLEANER FUNCTION ---
// This strips all Markdown symbols so the CSV is plain and clean for SOAR.
function cleanText(text: string): string {
  if (!text) return "";
  
  let clean = text;

  // 1. Remove Table structure lines (e.g. |---|---|)
  clean = clean.replace(/\|[\s-]+\|[\s-|]+/g, "");
  
  // 2. Replace Table pipes (|) with a simple separator
  clean = clean.replace(/\|/g, " - ");

  // 3. Remove Bold/Italic markers (** or __ or *)
  clean = clean.replace(/\*\*/g, ""); // Remove double stars
  clean = clean.replace(/__/g, "");   // Remove double underscores
  clean = clean.replace(/\*/g, "");   // Remove single stars

  // 4. Remove Headers (### Title -> Title)
  clean = clean.replace(/^#+\s+/gm, "");

  // 5. Turn list items (- item) into bullets (• item)
  clean = clean.replace(/^\s*-\s+/gm, "• ");

  // 6. Remove Links [text](url) -> keep just 'text'
  clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // 7. Remove Horizontal Rules (---)
  clean = clean.replace(/^-{3,}/gm, "");

  // 8. Remove Code blocks (`)
  clean = clean.replace(/`/g, "");

  // 9. Collapse multiple newlines into just one or two
  clean = clean.replace(/\n{3,}/g, "\n\n");

  return clean.trim();
}

function toCSV(rows: CPDEntry[]) {
  // BOM (Byte Order Mark) to force Excel to read UTF-8 correctly
  const BOM = "\uFEFF"; 
  
  const header = ["Timestamp", "Question", "Answer", "Reflection", "Tags"];
  
  const body = rows.map((r) => {
    // Run the Super Cleaner on every text field
    const q = cleanText(r.question || "");
    const a = cleanText(r.answer || "");
    const refl = cleanText(r.reflection || "");
    const t = (r.tags || []).join("; ");

    // Escape double quotes by doubling them (" -> "") to prevent CSV breaking
    return [
      r.timestamp,
      `"${q.replace(/"/g, '""')}"`,
      `"${a.replace(/"/g, '""')}"`,
      `"${refl.replace(/"/g, '""')}"`,
      `"${t.replace(/"/g, '""')}"`,
    ].join(",");
  });

  return BOM + [header.join(","), ...body].join("\n");
}

function CPDInner() {
  const [allEntries, setAllEntries] = useState<CPDEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  
  const [currentPage, setCurrentPage] = useState(0);
  
  const [allTags, setAllTags] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data, error } = await getAllLogs();
      
      if (error) {
        console.error("Error fetching CPD logs:", error);
      } else {
        setAllEntries(data);
        const tags = Array.from(new Set(data.flatMap((e) => e.tags || []))).sort();
        setAllTags(tags);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredEntries = useMemo(() => {
    return allEntries.filter((e) => {
      const matchesSearch = !q || (
        (e.question || "").toLowerCase().includes(q.toLowerCase()) ||
        (e.answer || "").toLowerCase().includes(q.toLowerCase()) ||
        (e.reflection || "").toLowerCase().includes(q.toLowerCase())
      );
      
      const matchesTag = !tag || (e.tags || []).includes(tag);
      
      return matchesSearch && matchesTag;
    });
  }, [allEntries, q, tag]);

  const paginatedList = useMemo(() => {
    const start = currentPage * PAGE_SIZE;
    return filteredEntries.slice(start, start + PAGE_SIZE);
  }, [filteredEntries, currentPage]);

  const totalCount = filteredEntries.length;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(0);
  }, [q, tag]);

  // --- CSV DOWNLOAD ---
  const downloadCSV = () => {
    const csvContent = toCSV(filteredEntries);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `umbil_cpd_log_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- PRINT / PDF ---
  const printCPD = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert("Please allow popups to print your CPD log.");
        return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>Umbil CPD Log - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
            h1 { color: #1fb8cd; border-bottom: 2px solid #eee; padding-bottom: 10px; }
            .entry { margin-bottom: 30px; page-break-inside: avoid; border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
            .meta { font-size: 0.85rem; color: #666; margin-bottom: 10px; }
            .question { font-weight: bold; font-size: 1.1rem; margin-bottom: 10px; }
            .answer { font-size: 0.95rem; line-height: 1.5; margin-bottom: 15px; white-space: pre-wrap; }
            .reflection { background: #f9f9f9; padding: 15px; border-left: 4px solid #1fb8cd; font-style: italic; }
            .tags { margin-top: 10px; font-size: 0.8rem; }
            .tag { background: #eee; padding: 2px 8px; border-radius: 4px; margin-right: 5px; border: 1px solid #ddd; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <h1>My CPD Log</h1>
          <p>Generated by Umbil on ${new Date().toLocaleDateString()}</p>
          <p class="no-print"><em>Press Cmd+P (Mac) or Ctrl+P (Windows) to save as PDF.</em></p>
          
          ${filteredEntries.map(e => {
             // We run basic cleaning for PDF view too, but keep newlines
             const cleanA = cleanText(e.answer || "").replace(/\n/g, '<br/>');
             const cleanR = cleanText(e.reflection || "").replace(/\n/g, '<br/>');
             return `
            <div class="entry">
              <div class="meta">${new Date(e.timestamp).toLocaleString()}</div>
              <div class="question">${e.question}</div>
              <div class="answer">${cleanA}</div>
              ${e.reflection ? `<div class="reflection"><strong>Reflection:</strong><br/>${cleanR}</div>` : ''}
              ${e.tags && e.tags.length > 0 ? `<div class="tags">${e.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
            </div>
          `}).join('')}
          
          <script>
            window.onload = function() { setTimeout(() => window.print(), 500); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry? This cannot be undone.")) return;
    
    setDeletingId(id);
    const { error } = await deleteCPD(id);
    
    if (error) {
        alert("Failed to delete entry. Please try again.");
        console.error(error);
    } else {
        setAllEntries(prev => prev.filter(item => item.id !== id));
    }
    setDeletingId(null);
  };

  return (
    <section className="main-content">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: '10px' }}>
          <h2>My CPD Learning Log</h2>
          {totalCount > 0 && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn--outline" onClick={printCPD} title="Save as PDF via Print">
                🖨️ Print / Save PDF
              </button>
              <button className="btn btn--outline" onClick={downloadCSV} title="Download for Excel">
                📥 Download CSV
              </button>
            </div>
          )}
        </div>

        <div className="filters" style={{ marginBottom: 32 }}>
          <input
            className="form-control"
            placeholder="Search text…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="form-control"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
          >
            <option value="">All tags</option>
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
          
          {!loading && paginatedList.map((e, idx) => (
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
                {/* IN THE UI, WE STILL USE REACT MARKDOWN SO IT LOOKS PRETTY */}
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