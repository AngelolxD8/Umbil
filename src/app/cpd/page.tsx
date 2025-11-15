// src/app/cpd/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
// Import BOTH getCPD (for tags) and getCPDPage (for pagination)
import { CPDEntry, getCPD, getCPDPage } from "@/lib/store"; 
import { useUserEmail } from "@/hooks/useUser";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Page size constant
const PAGE_SIZE = 10;

/**
 * Converts the CPD log array into a CSV string for easy export.
 * @param rows - The array of CPD entries to convert.
 * @returns A string representing the CSV content.
 */
function toCSV(rows: CPDEntry[]) {
  const header = ["Timestamp", "Question", "Answer", "Reflection", "Tags"];
  const body = rows.map((r) =>
    [
      r.timestamp,
      // Wrap fields in quotes and escape existing quotes ("" instead of ")
      `"${(r.question || "").replace(/"/g, '""')}"`,
      `"${(r.answer || "").replace(/"/g, '""')}"`,
      `"${(r.reflection || "").replace(/"/g, '""')}"`,
      // Join tags with a semicolon inside the field to avoid conflict with CSV commas
      `"${(r.tags || []).join("; ")}"`,
    ].join(",")
  );
  return [header.join(","), ...body].join("\n");
}

function CPDInner() {
  // State for paged data
  const [list, setList] = useState<CPDEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for filters
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  
  // State for tag dropdown
  const [allTags, setAllTags] = useState<string[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);

  // State for CSV downloading
  const [isDownloading, setIsDownloading] = useState(false);

  // Debounced filter values
  const [debouncedQ, setDebouncedQ] = useState(q);
  const [debouncedTag, setDebouncedTag] = useState(tag);

  // 1. Debounce text and tag filters to avoid excessive API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQ(q);
      setDebouncedTag(tag);
    }, 500); // 500ms delay
    return () => clearTimeout(handler);
  }, [q, tag]);

  // 2. Reset to page 0 when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [debouncedQ, debouncedTag]);

  // 3. Fetch all unique tags ONCE on component mount
  useEffect(() => {
    const fetchAllTags = async () => {
      setTagsLoading(true);
      const allEntries = await getCPD(); // Fetches all entries
      const tags = Array.from(new Set(allEntries.flatMap((e) => e.tags || []))).sort();
      setAllTags(tags);
      setTagsLoading(false);
    };
    fetchAllTags();
  }, []); // Empty dependency array = runs once

  // 4. Fetch the appropriate page of data when page or filters change
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
  }, [currentPage, debouncedQ, debouncedTag]); // Re-fetch on page or filter change

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  /**
   * Generates a CSV file from ALL filtered entries and triggers a browser download.
   */
  const download = async () => {
    setIsDownloading(true);
    // Fetch ALL entries that match the current filter (limit: 10000)
    const { entries, error } = await getCPDPage({
      page: 0,
      limit: 10000, 
      q: debouncedQ || undefined,
      tag: debouncedTag || undefined,
    });

    if (error) {
      console.error("Error fetching data for CSV:", error);
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

  // Display a friendly message while data is loading
  if (loading && list.length === 0) {
    return (
        <section className="main-content">
            <div className="container">
                <p>Loading your professional learning log...</p>
            </div>
        </section>
    );
  }

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
                <div style={{ marginBottom: 16, borderBottom: '1px solid var(--umbil-divider)', paddingBottom: 16 }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--umbil-muted)' }}>
                    {new Date(e.timestamp).toLocaleString()}
                  </div>
                  <div style={{ fontWeight: 600, marginTop: 8, fontSize: '1.1rem' }}>{e.question}</div>
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
                    <span 
                        key={t} 
                        style={{ 
                            marginRight: 8, 
                            padding: '4px 8px', 
                            borderRadius: 12, 
                            backgroundColor: 'var(--umbil-hover-bg)', 
                            fontSize: '0.8rem', 
                            color: 'var(--umbil-text)',
                            fontWeight: 500
                        }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* --- NEW: Pagination Controls --- */}
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

// Wrapper component to check for user authentication before displaying the log
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