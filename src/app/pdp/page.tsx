"use client";

import { useEffect, useState } from "react";
import { PDPGoal, getPDP, savePDP } from "@/lib/store";
import { useUserEmail } from "@/hooks/useUser"; // ✅ auth hook

export default function PDPPage() {
  const [goals, setGoals] = useState<PDPGoal[]>([]);
  const [title, setTitle] = useState("");
  const [timeline, setTimeline] = useState("3 months");
  const [activities, setActivities] = useState("");

  // ✅ Require sign-in
  const { email, loading } = useUserEmail();
  if (loading) return null; // or a spinner
  if (!email) {
    return (
      <section className="main-content">
        <div className="container">
          <div className="card">
            <div className="card__body">
              Please <a href="/auth" className="link">sign in</a> to view this page.
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ✅ Load goals once signed in
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
    setTitle("");
    setTimeline("3 months");
    setActivities("");
  };

  const remove = (id: string) => {
    const next = goals.filter((g) => g.id !== id);
    setGoals(next);
    savePDP(next);
  };

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
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Strengthen COPD management"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Timeline</label>
              <select
                className="form-control"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
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
                onChange={(e) => setActivities(e.target.value)}
                placeholder={
                  "Attend COPD guideline update webinar\nShadow respiratory clinic\nAudit rescue packs"
                }
              />
            </div>
            <button className="btn btn--primary" onClick={add}>➕ Add goal</button>
          </div>
        </div>

        <div className="pdp-content">
          {goals.length === 0 && (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="card__body">No goals yet.</div>
            </div>
          )}
          {goals.map((g) => (
            <div key={g.id} className="pdp-goal">
              <div className="goal-title"><h3>{g.title}</h3></div>
              <div className="goal-timeline">{g.timeline}</div>
              <ul className="goal-activities">
                {g.activities.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
              <div className="pdp-actions">
                <button className="btn btn--outline" onClick={() => remove(g.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
