// src/app/cpd/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { CPDEntry, getAllLogs, deleteCPD } from "@/lib/store"; 
import { useUserEmail } from "@/hooks/useUser";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { renderToStaticMarkup } from "react-dom/server"; // <--- THE SECRET INGREDIENT

const PAGE_SIZE = 10;

// --- 1. SUPER CLEANER (For CSV Only) ---
// CSVs are plain text. They CANNOT have tables or bold.
// We must strip everything down to readable text.
function cleanForCSV(text: string): string {
  if (!text) return "";
  let clean = text;

  // Remove Table separator lines (e.g. |---|---|)
  clean = clean.replace(/^\|?[\s-]+\|[\s-]+\|?$/gm, "");
  
  // Replace Table pipes (|) with a simple separator
  clean = clean.replace(/\|/g, " - "); 

  // Remove Bold/Italic markers
  clean = clean.replace(/\*\*/g, ""); 
  clean = clean.replace(/__/g, "");
  clean = clean.replace(/\*/g, "");

  // Convert Headers (###) to Uppercase for emphasis
  clean = clean.replace(/^#{1,6}\s+(.*$)/gm, (match, p1) => `\n[${p1.toUpperCase()}]`);

  // Convert Lists to bullets
  clean = clean.replace(/^\s*[-*]\s+/gm, "• ");

  // Remove links
  clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Collapse newlines
  clean = clean.replace(/\n{3,}/g, "\n\n");

  return clean.trim();
}

function toCSV(rows: CPDEntry[]) {
  const BOM = "\uFEFF"; 
  const header = ["Timestamp", "Question", "Answer", "Reflection", "Tags", "GMC Domains"];
  
  const body = rows.map((r) => {
    const q = cleanForCSV(r.question || "");
    const a = cleanForCSV(r.answer || "");
    const refl = cleanForCSV(r.reflection || "");
    const t = (r.tags || []).join("; ");
    // Default domain if not tagged explicitly
    const gmc = "Knowledge, Skills & Performance"; 

    return [
      r.timestamp,
      `"${q.replace(/"/g, '""')}"`,
      `"${a.replace(/"/g, '""')}"`,
      `"${refl.replace(/"/g, '""')}"`,
      `"${t.replace(/"/g, '""')}"`,
      `"${gmc}"`
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
    a.download = `Umbil_Appraisal_Log_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- HANDLER: Print / PDF (The "Magic" Part) ---
  const printCPD = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert("Please allow popups to print your CPD log.");
        return;
    }

    // 1. Generate HTML for every entry using React's own renderer
    // This preserves Tables, Bold, Italics exactly as they appear in the app!
    const entriesHtml = filteredEntries.map(e => {
        // Render the answer markdown to real HTML
        const answerHtml = renderToStaticMarkup(
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {e.answer || ""}
            </ReactMarkdown>
        );
        
        // Render the reflection markdown to real HTML
        const reflectionHtml = e.reflection ? renderToStaticMarkup(
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {e.reflection}
            </ReactMarkdown>
        ) : "";

        return `
            <div class="entry">
                <div class="entry-header">
                    <div class="date">${new Date(e.timestamp).toLocaleDateString()}</div>
                    <div class="type">Clinical Query / CPD</div>
                </div>
                
                <div class="question">${e.question}</div>
                
                <div class="answer markdown-body">
                    ${answerHtml}
                </div>
                
                ${reflectionHtml ? `
                <div class="reflection-box">
                    <div class="reflection-title">My Reflection</div>
                    <div class="reflection-content markdown-body">${reflectionHtml}</div>
                </div>` : ''}
                
                <div class="tags">
                    <strong>Tags:</strong> ${e.tags && e.tags.length > 0 ? e.tags.join(", ") : "General"}
                </div>
            </div>
        `;
    }).join('');

    // 2. Build the full page with CSS specifically for Tables
    const htmlContent = `
      <html>
        <head>
          <title>Medical Appraisal Log - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; max-width: 850px; margin: 0 auto; line-height: 1.6; }
            h1 { color: #0e7490; border-bottom: 3px solid #0e7490; padding-bottom: 15px; margin-bottom: 10px; }
            .subtitle { font-size: 1.1rem; color: #64748b; margin-bottom: 30px; font-weight: 500; }
            
            /* Report Meta Box */
            .report-meta { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 30px; font-size: 0.9rem; }
            
            /* Entry Card */
            .entry { margin-bottom: 35px; page-break-inside: avoid; border: 1px solid #cbd5e1; padding: 25px; border-radius: 8px; background: white; }
            .entry-header { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; }
            .date { font-weight: 700; color: #0e7490; }
            .type { color: #64748b; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; }
            .question { font-weight: 800; font-size: 1.25rem; margin-bottom: 15px; color: #0f172a; line-height: 1.3; }
            
            /* MARKDOWN CONTENT STYLES (Tables, Bold, etc) */
            .markdown-body { font-size: 0.95rem; color: #334155; }
            .markdown-body strong { color: #0e7490; font-weight: 700; }
            .markdown-body ul, .markdown-body ol { margin-left: 20px; margin-bottom: 10px; }
            .markdown-body h3 { margin-top: 15px; margin-bottom: 5px; font-size: 1.1rem; color: #0e7490; }
            
            /* TABLE STYLES - This fixes your issue! */
            .markdown-body table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 0.9rem; }
            .markdown-body th, .markdown-body td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
            .markdown-body th { background-color: #f1f5f9; font-weight: 700; color: #0f172a; }
            .markdown-body tr:nth-child(even) { background-color: #f8fafc; }

            /* Reflection Box */
            .reflection-box { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; border-radius: 4px; margin-top: 20px; }
            .reflection-title { font-weight: 700; color: #166534; font-size: 0.85rem; text-transform: uppercase; margin-bottom: 5px; }
            .reflection-content { font-style: italic; color: #14532d; }
            
            .tags { margin-top: 15px; font-size: 0.8rem; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 10px; }
            
            @media print { 
              body { padding: 0; background: white; } 
              .no-print { display: none; }
              .entry { box-shadow: none; border: 1px solid #ccc; }
              /* Ensure backgrounds print */
              .reflection-box, .markdown-body th, .markdown-body tr:nth-child(even) { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <h1>Medical Appraisal CPD Log</h1>
          <div class="subtitle">Continuing Professional Development Portfolio</div>
          
          <div class="report-meta">
            <strong>Generated by:</strong> Umbil Clinical Assistant<br/>
            <strong>Date:</strong> ${new Date().toLocaleDateString()}<br/>
            <strong>Total Entries:</strong> ${filteredEntries.length}<br/>
            <div class="no-print" style="margin-top: 10px; color: #0e7490; font-weight: 600;">
              👉 Action: Press Print (Cmd+P / Ctrl+P) and choose "Save as PDF". <br/>
              This file retains all formatting (tables, bold, etc.) for upload to FourteenFish / SOAR.
            </div>
          </div>
          
          ${entriesHtml}
          
          <script>
            // Auto-trigger print dialog
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
              <button className="btn btn--outline" onClick={printCPD} title="Download PDF for Appraisal">
                🖨️ Export PDF Report
              </button>
              <button className="btn btn--outline" onClick={downloadCSV} title="Download raw data for Excel">
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