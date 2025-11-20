// src/components/ReflectionModal.tsx
"use client";

import { useState, useEffect } from "react";

// --- Types ---
type ReflectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reflection: string, tags: string[]) => void;
  currentStreak: number;
  cpdEntry: {
    question: string;
    answer: string;
  } | null;
};

// --- Constants ---
// UPDATED: Commas removed to prevent splitting in analytics/charts
const GMC_CLUSTERS = [
  "Knowledge Skills & Performance", 
  "Safety & Quality",
  "Communication Partnership & Teamwork",
  "Maintaining Trust",
];

// --- Helper Functions ---
const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  return "An unexpected error occurred.";
};

// --- Component ---
export default function ReflectionModal({
  isOpen,
  onClose,
  onSave,
  currentStreak,
  cpdEntry,
}: ReflectionModalProps) {
  const [reflection, setReflection] = useState("");
  const [tags, setTags] = useState(""); // Comma-separated string input
  
  const [isGeneratingReflection, setIsGeneratingReflection] = useState(false);
  const [generatedTags, setGeneratedTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Clear state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setReflection("");
      setTags("");
      setGeneratedTags([]);
      setError(null);
      setIsGeneratingReflection(false);
    }
  }, [isOpen]);

  /**
   * Appends a tag to the tags input field, avoiding duplicates.
   */
  const addTag = (tagToAdd: string) => {
    const tagList = tags.split(",").map((t: string) => t.trim()).filter(Boolean);
    if (!tagList.includes(tagToAdd)) {
      setTags((prev) => (prev ? `${prev}, ${tagToAdd}` : tagToAdd));
    }
    setGeneratedTags(prev => prev.filter((t: string) => t !== tagToAdd));
  };

  /**
   * Handles AI Reflection & Tag Generation (Streaming)
   */
  const handleGenerateReflection = async () => {
    if (!cpdEntry) return;
    setIsGeneratingReflection(true);
    setError(null);
    setReflection("");
    setGeneratedTags([]);

    let fullText = ""; 

    try {
      const res = await fetch("/api/generate-reflection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: cpdEntry.question,
          answer: cpdEntry.answer,
        }),
      });

      if (!res.ok || !res.body) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to start reflection stream");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        fullText += decoder.decode(value);

        if (fullText.includes("---TAGS---")) {
          const parts = fullText.split("---TAGS---");
          setReflection(parts[0]); 
        } else {
          setReflection(fullText); 
        }
      }

      // --- Stream is finished, now parse the tags ---
      if (fullText.includes("---TAGS---")) {
        const parts = fullText.split("---TAGS---");
        setReflection(parts[0].trim()); 
        
        const tagText = parts[1].trim();
        
        try {
          const parsedTags = JSON.parse(tagText);
          if (Array.isArray(parsedTags)) {
            const newTags = parsedTags.filter((t: string) => t);
            setGeneratedTags(newTags);
          }
        } catch (e) {
          // Fallback
          const fallbackTags = tagText
            .replace(/[\[\]"]/g, "") 
            .split(",")
            .map((t: string) => t.trim())
            .filter((t: string) => t);
          setGeneratedTags(fallbackTags);
        }
      }
      
    } catch (err) {
      setError(`⚠️ ${getErrorMessage(err)}`);
    } finally {
      setIsGeneratingReflection(false);
    }
  };

  /**
   * Main save handler
   */
  const handleSave = () => {
    const tagList = tags.split(",").map((t: string) => t.trim()).filter(Boolean);
    onSave(reflection, tagList);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Add Reflection to CPD</h3>
          <button onClick={onClose} className="close-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <div className="streak-display-modal">
          <div>
            🔥 Current Learning Streak: {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
          </div>
          <p style={{fontSize: '0.9rem', color: 'var(--umbil-muted)', fontWeight: 400, marginTop: '4px'}}>
            Consistency builds clarity - Keep your learning flow alive!
          </p>
        </div>

        {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

        <div className="form-group">
          <label className="form-label">Your Reflection (GMC-style)</label>
          <textarea
            className="form-control"
            rows={8}
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="e.g., What did I learn? How will this change my practice? Click 'Generate' for help!"
            disabled={isGeneratingReflection}
          />
        </div>

        <div className="generate-button-container">
          <button
            className="generate-button"
            onClick={handleGenerateReflection}
            disabled={isGeneratingReflection || !cpdEntry}
          >
            {isGeneratingReflection ? (
              "Generating..."
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8-5.8 1.9 5.8 1.9L12 18l1.9-5.8 5.8-1.9-5.8-1.9Z"></path></svg>
                Generate Reflection & Tags
              </>
            )}
          </button>
        </div>


        <div className="form-group">
          <label className="form-label">GMC Domain Tags (Click to add)</label>
          <div className="gmc-cluster-container">
            {GMC_CLUSTERS.map((tag) => (
              <button key={tag} className="gmc-button" onClick={() => addTag(tag)}>
                + {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Tags (comma-separated)</label>
          <input
            type="text"
            className="form-control"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g., gynaecology, diabetes"
          />
          {generatedTags.length > 0 && (
            <>
              <div className="tag-button-container">
                {generatedTags.map((tag: string) => ( 
                  <button key={tag} className="tag-button" onClick={() => addTag(tag)}>
                    {tag}
                  </button>
                ))}
              </div>
              <span className="auto-tag-label">Auto-generated tags (click to add)</span>
            </>
          )}
        </div>
        
        <div className="flex justify-end mt-4">
          <button onClick={handleSave} className="btn btn--primary">
            Save to My CPD
          </button>
        </div>
      </div>
    </div>
  );
}