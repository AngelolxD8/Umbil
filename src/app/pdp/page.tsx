// src/app/pdp/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { PDPGoal, getPDP, savePDP, getCPD } from "@/lib/store";
import { useUserEmail } from "@/hooks/useUser";

function PDPInner() {
  const [goals, setGoals] = useState<PDPGoal[]>([]);
  const [title, setTitle] = useState("");
  const [timeline, setTimeline] = useState("3 months");
  const [activities, setActivities] = useState("");

  useEffect(() => setGoals(getPDP()), []);

  const add = () => {
    if (!title.trim()) return;
    const next: PDPGoal[] = [
      {
        id: crypto.randomUUID(),
        title,
        timeline,
        activities: activities.split("\n").filter(Boolean),
      },
      ...goals,
    ];
    setGoals(next);
    savePDP(next);
    setTitle(""); setTimeline("3 months"); setActivities("");
  };

  const remove = (id: string) => {
    const next = goals.filter((g) => g.id !== id);
    setGoals(next);
    savePDP(next);
  };

  const cpdEntries = getCPD();
  const suggestedGoals = useMemo(() => {
    const tagCounts = cpdEntries.flatMap(entry => entry.tags || []).reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(tagCounts)
      .filter(([, count]) => count >= 7) // Suggest a goal if a tag appears 7 or more times
      .map(([tag]) => `Strengthen knowledge in ${tag}`);
  }, [cpdEntries]);

  return (
    <section className="main-content">
      <div className="container">
        <h2>Personal Development Plan</h2>

        <div className="card" style={{ marginTop: 16 }}>
          <div className="card__body">
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
          <div className="card" style={{ marginTop: 24 }}>
            <div className="card__body">
              <h3 style={{ marginBottom: 12 }}>Suggested Goals</h3>
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

        <div style={{ marginTop: 24 }}>
          {goals.length === 0 && <div className="card"><div className="card__body">No goals yet.</div></div>}
          {goals.map((g) => (
            <div key={g.id} className="card pdp-goal" style={{ marginBottom: 16 }}>
              <div className="card__body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{g.title}</h3>
                    <div style={{ fontSize: '0.875rem', color: 'var(--umbil-muted)' }}>{g.timeline}</div>
                  </div>
                  <button className="btn btn--outline" onClick={() => remove(g.id)}>Remove</button>
                </div>
                <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginTop: '1rem' }}>
                  {g.activities.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

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