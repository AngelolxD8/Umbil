// src/app/capture-learning/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addCPD, CPDEntry } from "@/lib/store";
import Link from "next/link";

const GMC_CLUSTERS = [
  "Knowledge Skills & Performance", 
  "Safety & Quality",
  "Communication Partnership & Teamwork",
  "Maintaining Trust",
];

export default function CaptureLearningPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [reflection, setReflection] = useState("");
  const [isOptionalOpen, setIsOptionalOpen] = useState(false);

  // Optional Fields
  const [tags, setTags] = useState("");
  const [duration, setDuration] = useState(10);
  
  // Context now includes conversationId
  const [cpdContext, setCpdContext] = useState<{ 
    question: string; 
    answer: string; 
    conversationId?: string | null 
  } | null>(null);

  useEffect(() => {
    // Load context passed from the Dashboard
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('umbil_cpd_context');
      if (stored) {
        try {
          setCpdContext(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse CPD context", e);
        }
      }
    }
  }, []);

  // UPDATED: Toggle logic for GMC domains
  const toggleTag = (tagToToggle: string) => {
    let tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
    
    if (tagList.includes(tagToToggle)) {
        // Deselect: Remove the tag
        tagList = tagList.filter(t => t !== tagToToggle);
    } else {
        // Select: Add the tag
        tagList.push(tagToToggle);
    }
    
    setTags(tagList.join(", "));
  };

  const handleSave = async () => {
    if (!reflection.trim()) return;
    setLoading(true);

    try {
      const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
      
      const entry: Omit<CPDEntry, 'id' | 'user_id'> = {
        timestamp: new Date().toISOString(),
        question: cpdContext?.question || "Manual Entry",
        answer: cpdContext?.answer || "",
        reflection: reflection,
        tags: tagList,
        duration: duration
      };

      const { error } = await addCPD(entry);

      if (error) {
        alert("Failed to save learning. Please try again.");
        setLoading(false);
      } else {
        // Determine return URL: go back to the specific chat if ID exists
        const returnUrl = cpdContext?.conversationId 
            ? `/dashboard?c=${cpdContext.conversationId}&cpdSaved=true`
            : `/dashboard?cpdSaved=true`;

        sessionStorage.removeItem('umbil_cpd_context');
        router.push(returnUrl); 
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
      setLoading(false);
    }
  };

  // Determine the cancel href (back to specific chat or generic dashboard)
  const cancelHref = cpdContext?.conversationId 
    ? `/dashboard?c=${cpdContext.conversationId}` 
    : "/dashboard";

  return (
    // SCROLL FIX & DARK MODE: Background and scroll wrapper
    <div style={{ height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: 'var(--umbil-bg)' }}>
      <div className="container" style={{ maxWidth: '700px', paddingTop: '60px', paddingBottom: '80px', color: 'var(--umbil-foreground)' }}>
        
        {/* Visual Header / Context */}
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '16px', lineHeight: 1.2 }}>
            Capture what you&apos;ve just learned.
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--umbil-muted)' }}>
            Saved privately. Use later for study, training, or appraisal.
          </p>
        </div>

        {/* Primary Input */}
        <div style={{ marginBottom: '24px' }}>
          <textarea
            className="form-control"
            placeholder="What did you learn or discuss?"
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            style={{ 
              minHeight: '160px', 
              fontSize: '1.1rem', 
              padding: '20px',
              resize: 'vertical',
              boxShadow: 'var(--umbil-shadow-sm)',
              borderRadius: '12px',
              fontFamily: 'inherit',
              // Dark mode friendly styles
              background: 'var(--umbil-input-bg, transparent)', 
              color: 'var(--umbil-foreground)',
              borderColor: 'var(--umbil-border)'
            }}
            autoFocus
          />
        </div>

        {/* Primary Action */}
        <button 
          className="btn btn--primary" 
          onClick={handleSave}
          disabled={loading || !reflection.trim()}
          style={{ 
            width: '100%', 
            padding: '16px', 
            fontSize: '1.1rem', 
            marginBottom: '16px',
            borderRadius: '12px'
          }}
        >
          {loading ? "Saving..." : "Capture learning"}
        </button>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--umbil-muted)' }}>
            You can export this to FourteenFish, Turas, or any portfolio later.
          </p>
        </div>

        {/* Optional Structure Section */}
        <div style={{ borderTop: '1px solid var(--umbil-divider)', paddingTop: '24px' }}>
          <button 
            onClick={() => setIsOptionalOpen(!isOptionalOpen)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--umbil-brand-teal)', 
              fontWeight: 600, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '1rem',
              width: '100%'
            }}
          >
            {isOptionalOpen ? "− Hide details" : "+ Add structure (optional)"}
          </button>

          {isOptionalOpen && (
            <div className="animate-in fade-in zoom-in-95 duration-300" style={{ marginTop: '24px' }}>
              
              {/* GMC Domains */}
              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--umbil-foreground)' }}>GMC Domain Tags</label>
                <div className="gmc-cluster-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {GMC_CLUSTERS.map((tag) => {
                    const currentTags = tags.split(",").map(t => t.trim());
                    const isActive = currentTags.includes(tag);
                    return (
                      <button 
                        key={tag} 
                        type="button"
                        onClick={() => toggleTag(tag)}
                        style={{
                            background: isActive ? 'var(--umbil-brand-teal)' : 'transparent',
                            color: isActive ? '#fff' : 'var(--umbil-muted)',
                            border: isActive ? '1px solid var(--umbil-brand-teal)' : '1px dashed var(--umbil-divider)',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            transition: 'all 0.2s'
                        }}
                      >
                        {isActive ? `✓ ${tag}` : `+ ${tag}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tags Input */}
              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--umbil-foreground)' }}>Additional Tags (comma-separated)</label>
                <input
                  type="text"
                  className="form-control"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g., cardiology, guidelines"
                  style={{
                      background: 'var(--umbil-input-bg, transparent)',
                      color: 'var(--umbil-foreground)',
                      borderColor: 'var(--umbil-border)'
                  }}
                />
              </div>

              {/* Time Spent */}
              <div className="form-group">
                 <label className="form-label" style={{ color: 'var(--umbil-foreground)' }}>Time Spent</label>
                 <select 
                    className="form-control"
                    value={duration} 
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    style={{
                        background: 'var(--umbil-input-bg, transparent)',
                        color: 'var(--umbil-foreground)',
                        borderColor: 'var(--umbil-border)'
                    }}
                 >
                    <option value="5">5 min</option>
                    <option value="10">10 min</option>
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">1 hr</option>
                    <option value="90">1.5 hrs</option>
                    <option value="120">2 hrs</option>
                 </select>
              </div>

            </div>
          )}
        </div>

        <div style={{ marginTop: '40px', textAlign: 'center' }}>
           <Link href={cancelHref} style={{ color: 'var(--umbil-muted)', fontSize: '0.9rem', textDecoration: 'underline' }}>
              Cancel and return to chat
           </Link>
        </div>

      </div>
    </div>
  );
}