// src/app/cpd/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { CPDEntry, getAllLogs, deleteCPD } from "@/lib/store"; 
import { useUserEmail } from "@/hooks/useUser";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const PAGE_SIZE = 10;
const DEFAULT_CREDITS = 1; // Assume 1 hour per reflective entry

// --- 1. SUPER CLEANER (For Excel/CSV) ---
function cleanForCSV(text: string): string {
  if (!text) return "";
  let clean = text;
  clean = clean.replace(/\|/g, " - "); 
  clean = clean.replace(/\*\*/g, ""); 
  clean = clean.replace(/__/g, "");
  clean = clean.replace(/\*/g, "");
  clean = clean.replace(/^#{1,6}\s+(.*$)/gm, (match, p1) => `\n[${p1.toUpperCase()}]`);
  clean = clean.replace(/^\s*[-*]\s+/gm, "• ");
  clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  clean = clean.replace(/\n{3,}/g, "\n\n");
  return clean.trim();
}

// --- 2. MARKDOWN RESTORER (For PDF) ---
function formatForPrint(text: string): string {
  if (!text) return "";
  let html = text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/^### (.*$)/gm, '<h3 style="color:#0e7490; margin-top:12px; margin-bottom:4px; font-size:1rem;">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 style="color:#0e7490; margin-top:16px; margin-bottom:8px; font-size:1.1rem;">$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.*?)\*/g, '<i>$1</i>')
    .replace(/^\s*[-*]\s+(.*$)/gm, '<div style="margin-left:15px; margin-bottom:2px;">• $1</div>')
    .replace(/\n/g, '<br/>');
  return html;
}

// --- 3. SOAR-COMPATIBLE CSV GENERATOR ---
function toCSV(rows: CPDEntry[]) {
  const BOM = "\uFEFF"; 
  // HEADERS MATCHING SOAR / FOURTEENFISH EXPECTATIONS
  const header = [
    "Date", 
    "Learning Activity / Topic", // Maps to 'Question'
    "Description",               // Maps to 'Answer'
    "Reflection",                // Critical for appraisal
    "GMC Domain",                // Mandatory for UK
    "Credits Claimed",           // Mandatory for SOAR
    "Tags"
  ];
  
  const body = rows.map((r) => {
    const q = cleanForCSV(r.question || "");
    const a = cleanForCSV(r.answer || "");
    const refl = cleanForCSV(r.reflection || "");
    const t = (r.tags || []).join("; ");
    
    // Auto-detect Domain from tags, or default
    let domain = "Knowledge, Skills and Performance";
    if (t.toLowerCase().includes("safety")) domain = "Safety and Quality";
    if (t.toLowerCase().includes("communication")) domain = "Communication, Partnership and Teamwork";
    if (t.toLowerCase().includes("trust")) domain = "Maintaining Trust";

    return [
      new Date(r.timestamp).toLocaleDateString(),
      `"${q.replace(/"/g, '""')}"`,
      `"${a.replace(/"/g, '""')}"`,
      `"${refl.replace(/"/g, '""')}"`,
      `"${domain}"`,
      `"${DEFAULT_CREDITS}"`, // Default to 1 credit per entry
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

  // Calculate Summary Stats for the PDF Dashboard
  const totalCredits = filteredEntries.length * DEFAULT_CREDITS;
  const domainCounts = filteredEntries.reduce((acc, curr) => {
    const t = (curr.tags || []).join(" ").toLowerCase();
    let d = "Knowledge, Skills & Performance";
    if (t.includes("safety")) d = "Safety & Quality";
    else if (t.includes("communication")) d = "Communication, Partnership & Teamwork";
    else if (t.includes("trust")) d = "Maintaining Trust";
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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

  // --- HANDLER: Print / PDF (GOLD STANDARD REPORT) ---
  const printCPD = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert("Please allow popups to print your CPD log.");
        return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>Annual Appraisal Summary - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; max-width: 850px; margin: 0 auto; line-height: 1.5; }
            
            /* Header */
            h1 { color: #0e7490; border-bottom: 3px solid #0e7490; padding-bottom: 10px; margin-bottom: 5px; }
            .subtitle { font-size: 1.1rem; color: #64748b; margin-bottom: 30px; font-weight: 500; }
            
            /* Dashboard Box */
            .dashboard { display: flex; gap: 20px; margin-bottom: 40px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; }
            .stat-box { flex: 1; text-align: center; border-right: 1px solid #e2e8f0; }
            .stat-box:last-child { border-right: none; }
            .stat-val { display: block; font-size: 2rem; font-weight: 800; color: #0e7490; }
            .stat-label { font-size: 0.85rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
            
            /* Domain Summary */
            .domain-summary { margin-bottom: 40px; }
            .domain-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #e2e8f0; font-size: 0.9rem; }
            .domain-name { font-weight: 600; color: #334155; }
            
            /* Entry Card */
            .entry { margin-bottom: 30px; page-break-inside: avoid; border: 1px solid #cbd5e1; padding: 25px; border-radius: 8px; background: white; }
            .entry-header { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; }
            .date { font-weight: 700; color: #0e7490; }
            .credits { background: #0e7490; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; }
            
            .question { font-weight: 800; font-size: 1.1rem; margin-bottom: 10px; color: #0f172a; }
            .answer { font-size: 0.9rem; color: #334155; margin-bottom: 15px; }
            
            /* Reflection */
            .reflection-box { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 12px 15px; border-radius: 4px; margin-top: 15px; }
            .reflection-title { font-weight: 700; color: #166534; font-size: 0.8rem; text-transform: uppercase; margin-bottom: 4px; }
            .reflection-content { font-style: italic; color: #14532d; font-size: 0.9rem; }
            
            .footer { margin-top: 50px; text-align: center; font-size: 0.8rem; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            
            @media print { 
              body { padding: 0; background: white; } 
              .no-print { display: none; }
              .dashboard { background: none; border: 1px solid #000; }
              .entry { box-shadow: none; border: 1px solid #ccc; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Appraisal & Revalidation Log</h1>
          <div class="subtitle">Personal Development Portfolio</div>
          
          <div class="dashboard">
            <div class="stat-box">
              <span class="stat-val">${filteredEntries.length}</span>
              <span class="stat-label">Total Activities</span>
            </div>
            <div class="stat-box">
              <span class="stat-val">${totalCredits}</span>
              <span class="stat-label">CPD Credits (Hours)</span>
            </div>
          </div>
          
          <div class="domain-summary">
            <h3 style="font-size: 1rem; color: #475569; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 10px;">GMC Domain Coverage</h3>
            ${Object.entries(domainCounts).map(([k, v]) => `
              <div class="domain-row">
                <span class="domain-name">${k}</span>
                <span>${v} Entries</span>
              </div>
            `).join('')}
          </div>

          <div class="no-print" style="margin-bottom: 20px; color: #0e7490; font-weight: 600; background: #e0f2fe; padding: 10px; border-radius: 6px; text-align: center;">
            👉 <strong>Instructions:</strong> Press Print (Cmd+P) and "Save as PDF".<br/>
            Upload this single file to <strong>SOAR</strong> (Domain 1), <strong>FourteenFish</strong> (Library), or <strong>Clarity</strong>.
          </div>
          
          ${filteredEntries.map(e => {
             // Calculate domain for this specific entry to show on the card
             const t = (e.tags || []).join(" ").toLowerCase();
             let d = "Knowledge, Skills & Performance";
             if (t.includes("safety")) d = "Safety & Quality";
             else if (t.includes("communication")) d = "Communication & Teamwork";
             else if (t.includes("trust")) d = "Maintaining Trust";

             return `
            <div class="entry">
              <div class="entry-header">
                <div class="date">${new Date(e.timestamp).toLocaleDateString()}</div>
                <div class="credits">1 CPD Credit</div>
              </div>
              
              <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 6px; text-transform: uppercase; font-weight: 600;">${d}</div>
              <div class="question">${e.question}</div>
              
              <div class="answer">
                ${formatForPrint(e.answer || "")}
              </div>
              
              ${e.reflection ? `
                <div class="reflection-box">
                    <div class="reflection-title">Reflective Notes</div>
                    <div class="reflection-content">${formatForPrint(e.reflection)}</div>
                </div>` : ''}
              
              <div style="margin-top: 10px; font-size: 0.8rem; color: #94a3b8;">
                <strong>Tags:</strong> ${e.tags && e.tags.length > 0 ? e.tags.join(", ") : "General"}
              </div>
            </div>
          `}).join('')}
          
          <div class="footer">
            Generated by Umbil • Evidence for Annual Appraisal • ${new Date().getFullYear()}
          </div>
          
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
              <button className="btn btn--outline" onClick={printCPD} title="Download 'Appraisal Ready' PDF Report">
                🖨️ Export Appraisal Report
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