// src/app/cpd/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { CPDEntry, getAllLogs, deleteCPD } from "@/lib/store"; 
import { useUserEmail } from "@/hooks/useUser";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const PAGE_SIZE = 10;

// --- 1. SUPER CLEANER (For CSV) ---
// This strips symbols but keeps the text structure readable for Excel
function cleanForCSV(text: string): string {
  if (!text) return "";
  let clean = text;

  // Replace Markdown Tables with a list format
  // e.g. | Drug | Dose | -> Drug: Dose
  clean = clean.replace(/\|/g, " "); 

  // Remove Bold/Italic markers (** or __)
  clean = clean.replace(/\*\*/g, ""); 
  clean = clean.replace(/__/g, "");
  clean = clean.replace(/\*/g, "");

  // Convert Markdown Headers (###) to Uppercase for emphasis in plain text
  clean = clean.replace(/^### (.*$)/gm, (match, p1) => `\n[${p1.toUpperCase()}]`);
  clean = clean.replace(/^## (.*$)/gm, (match, p1) => `\n[${p1.toUpperCase()}]`);

  // Convert Lists (- item) to nice bullet points (• item)
  clean = clean.replace(/^\s*-\s+/gm, "• ");
  clean = clean.replace(/^\s*\*\s+/gm, "• ");

  // Remove links [text](url) -> keep just 'text'
  clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Fix excessive newlines
  clean = clean.replace(/\n{3,}/g, "\n\n");

  return clean.trim();
}

// --- 2. MARKDOWN RESTORER (For PDF/Print) ---
// This ensures the PDF keeps the Bold/Italics that the CSV loses
function formatForPrint(text: string): string {
  if (!text) return "";
  let html = text
    // Escape HTML characters to prevent injection
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    // Convert **bold** to <b>bold</b>
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    // Convert *italic* to <i>italic</i>
    .replace(/\*(.*?)\*/g, '<i>$1</i>')
    // Convert ### Header to <h3>Header</h3>
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    // Convert - List item to <li>List item</li> (simplified)
    .replace(/^\s*-\s+(.*$)/gm, '<li>$1</li>')
    // Convert Newlines to <br>
    .replace(/\n/g, '<br/>');

  return html;
}

function toCSV(rows: CPDEntry[]) {
  // BOM (Byte Order Mark) forces Excel (Mac/Win) to use UTF-8
  const BOM = "\uFEFF"; 
  const header = ["Timestamp", "Question", "Answer", "Reflection", "Tags"];
  
  const body = rows.map((r) => {
    // We use the Super Cleaner here
    const q = cleanForCSV(r.question || "");
    const a = cleanForCSV(r.answer || "");
    const refl = cleanForCSV(r.reflection || "");
    const t = (r.tags || []).join("; ");

    // CSV Formatting: Wrap in quotes, escape existing quotes
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

  // --- HANDLER: Download CSV ---
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

  // --- HANDLER: Print / PDF ---
  const printCPD = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert("Please allow popups to print your CPD log.");
        return;
    }

    // We build a nice HTML page for the print view
    const htmlContent = `
      <html>
        <head>
          <title>Umbil CPD Log - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; max-width: 850px; margin: 0 auto; }
            h1 { color: #0e7490; border-bottom: 3px solid #0e7490; padding-bottom: 15px; margin-bottom: 30px; }
            .meta-info { margin-bottom: 40px; color: #64748b; font-size: 0.9rem; }
            .entry { margin-bottom: 35px; page-break-inside: avoid; border: 1px solid #e2e8f0; padding: 25px; border-radius: 12px; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
            .date { font-size: 0.85rem; color: #94a3b8; margin-bottom: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
            .question { font-weight: 800; font-size: 1.15rem; margin-bottom: 15px; color: #0f172a; }
            .answer { font-size: 0.95rem; line-height: 1.6; margin-bottom: 20px; color: #334155; }
            .answer b { color: #0e7490; font-weight: 700; }
            .answer h3, .answer h2 { margin-top: 10px; margin-bottom: 5px; font-size: 1rem; color: #0e7490; }
            .answer li { margin-bottom: 4px; }
            .reflection { background: #f0f9ff; padding: 15px 20px; border-left: 4px solid #0ea5e9; border-radius: 4px; margin-top: 15px; }
            .reflection-label { font-weight: 700; font-size: 0.85rem; color: #0369a1; margin-bottom: 5px; text-transform: uppercase; }
            .reflection-text { font-style: italic; color: #0c4a6e; font-size: 0.95rem; }
            .tags { margin-top: 15px; display: flex; flex-wrap: wrap; gap: 8px; }
            .tag { background: #f1f5f9; color: #475569; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; border: 1px solid #cbd5e1; }
            @media print { 
              body { padding: 0; background: white; } 
              .no-print { display: none; }
              .entry { box-shadow: none; border: 1px solid #ccc; }
            }
          </style>
        </head>
        <body>
          <h1>My CPD Learning Log</h1>
          <div class="meta-info">
            Generated by Umbil on ${new Date().toLocaleDateString()} <br/>
            ${filteredEntries.length} Entries found.
            <p class="no-print" style="margin-top: 10px; color: #0e7490; font-weight: bold;">
              👉 Press Cmd+P (Mac) or Ctrl+P (Windows) to save as PDF for SOAR/Appraisal.
            </p>
          </div>
          
          ${filteredEntries.map(e => `
            <div class="entry">
              <div class="date">${new Date(e.timestamp).toLocaleDateString()} • ${new Date(e.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
              <div class="question">${e.question}</div>
              <div class="answer">${formatForPrint(e.answer || "")}</div>
              ${e.reflection ? `
                <div class="reflection">
                    <div class="reflection-label">My Reflection</div>
                    <div class="reflection-text">${formatForPrint(e.reflection)}</div>
                </div>` : ''}
              ${e.tags && e.tags.length > 0 ? `<div class="tags">${e.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
            </div>
          `).join('')}
          
          <script>
            window.onload = function() { setTimeout(() => window.print(), 800); }
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
              <button className="btn btn--outline" onClick={printCPD} title="Best format for SOAR/Appraisal">
                🖨️ Save as PDF
              </button>
              <button className="btn btn--outline" onClick={downloadCSV} title="Raw data for spreadsheets">
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
                {/* On screen, we keep it beautiful with ReactMarkdown */}
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