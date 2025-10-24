// src/app/pdp/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
// We still use getCPD to read entries, which now fetches from the DB
import { PDPGoal, getPDP, savePDP, getCPD, CPDEntry } from "@/lib/store"; 
import { useUserEmail } from "@/hooks/useUser";

// Inner component for the main PDP logic, displayed only when authenticated
function PDPInner() {
  const [goals, setGoals] = useState<PDPGoal[]>([]);
  const [cpdEntries, setCpdEntries] = useState<CPDEntry[]>([]); // New state for remote CPD data
  const [title, setTitle] = useState("");
  const [timeline, setTimeline] = useState("3 months");
  const [activities, setActivities] = useState("");

  // 1. Load saved PDP goals (local) on mount
  useEffect(() => setGoals(getPDP()), []);
  
  // 2. Fetch CPD entries (remote) asynchronously for suggestions logic
  useEffect(() => {
    const fetchCpd = async () => {
      const entries = await getCPD();
      setCpdEntries(entries);
    }
    fetchCpd();
  }, []);

  /**
   * Adds a new goal to the list and saves it to local storage.
   */
  const add = () => {
    if (!title.trim()) return;
    const newGoal: PDPGoal = {
      // Use a crypto-safe UUID for a unique ID
      id: crypto.randomUUID(),
      title,
      timeline,
      // Split activities by newline, clean up empty lines, and save as an array
      activities: activities.split("\n").filter(Boolean),
    };
    // Add new goal to the start of the array
    const next: PDPGoal[] = [newGoal, ...goals];
    
    setGoals(next);
    savePDP(next);
    // Reset form fields after successful save
    setTitle(""); setTimeline("3 months"); setActivities("");
  };

  /**
   * Removes a goal by its ID and updates local storage.
   * @param id - The unique ID of the goal to remove.
   */
  const remove = (id: string) => {
    const next = goals.filter((g) => g.id !== id);
    setGoals(next);
    savePDP(next);
  };

  // Memoize suggested goals to prevent unnecessary recalculations
  const suggestedGoals = useMemo(() => {
    // 1. Count how many times each tag has been used in CPD reflections
    const tagCounts = cpdEntries.flatMap(entry => entry.tags || []).reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 2. Filter tags that meet a minimum count (e.g., 7 times)
    // This heuristic suggests a goal when a topic appears frequently in reflections.
    return Object.entries(tagCounts)
      .filter(([, count]) => count >= 7) 
      // 3. Map the frequent tags into actionable goal titles
      .map(([tag]) => `Strengthen knowledge in ${tag}`);
  }, [cpdEntries]);

  return (
    <section className="main-content">
      <div className="container">
        <h2 style={{ marginBottom: 24 }}>Personal Development Plan</h2>

        <div className="card" style={{ marginBottom: 32 }}>
          <div className="card__body">
            <h3 style={{ marginBottom: 16 }}>Add a New Goal</h3>
            <div className="form-group">
              <label className="form-label">Goal title</label>
              <input
                className="form-control"
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                placeholder="e.g., Strengthen COPD management"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Timeline</label>
              <select
                className="form-control"
                value={timeline}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTimeline(e.target.value)}
              >
                <option>1 month</option>
                <option>3 months</option>
                <option>6 months</option>
                <option>12 months</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Planned activities (one per line)</label>
              <textarea
                className="form-control"
                rows={4}
                value={activities}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setActivities(e.target.value)}
                placeholder="Attend COPD guideline update webinar\nShadow respiratory clinic\nAudit rescue packs"
              />
            </div>
            <button className="btn btn--primary" onClick={add}>➕ Add goal</button>
          </div>
        </div>

        {suggestedGoals.length > 0 && (
          <div className="card" style={{ marginBottom: 32 }}> {/* Increased spacing for aesthetic */}
            <div className="card__body">
              <h3 style={{ marginBottom: 12 }}>Suggested Goals (Based on your CPD)</h3>
              {suggestedGoals.map((sg, idx) => (
                <button
                  key={idx}
                  className="btn btn--outline"
                  style={{ marginRight: 8, marginBottom: 8 }}
                  onClick={() => setTitle(sg)}
                >
                  {sg}
                </button>
              ))}
            </div>
          </div>
        )}

        <h3 style={{ marginBottom: 16 }}>Current Goals</h3> {/* Added section header for existing goals */}
        <div style={{ marginBottom: 40 }}> {/* Added extra bottom spacing to the entire list */}
          {/* FIXED: The unescaped apostrophe causing the build error */}
          {goals.length === 0 && <div className="card"><div className="card__body">You haven&apos;t added any goals yet.</div></div>}
          {goals.map((g) => (
            <div key={g.id} className="card pdp-goal" style={{ marginBottom: 20 }}> {/* Increased spacing between goals */}
              <div className="card__body" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    {/* Increased size of goal title */}
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>{g.title}</h3>
                    <div style={{ fontSize: '0.9rem', color: 'var(--umbil-muted)' }}>Target: {g.timeline}</div>
                  </div>
                  <button className="btn btn--outline" onClick={() => remove(g.id)}>Remove</button>
                </div>
                <h4 style={{ fontSize: '1rem', marginTop: '1.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>Planned Activities:</h4>
                <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem' }}>
                  {g.activities.map((a, i) => <li key={i} style={{ marginBottom: '0.5rem' }}>{a}</li>)}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Wrapper component to check for user authentication before displaying the PDP
export default function PDPPage() {
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

  return <PDPInner />;
}