"use client";

import { clearAll } from "@/lib/store";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const v = localStorage.getItem("no_phi_ack");
    setAccepted(v === "yes");
  }, []);

  const saveAck = () => {
    localStorage.setItem("no_phi_ack", accepted ? "yes" : "no");
  };

  const clear = () => {
    if (!confirm("This will remove all locally saved CPD and PDP data on this device. Continue?")) return;
    clearAll();
    alert("Local data cleared.");
  };

  return (
    <section className="main-content">
      <div className="container">
        <h2>Settings</h2>
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card__body">
            <h3>Safety</h3>
            <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
              <input type="checkbox" checked={accepted} onChange={(e)=>setAccepted(e.target.checked)} />
              I understand I must not enter patient-identifiable information (GDPR).
            </label>
            <button className="btn btn--primary" style={{ marginTop: 12 }} onClick={saveAck}>Save</button>
          </div>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <div className="card__body">
            <h3>Data</h3>
            <p className="section-description">Clear all CPD/PDP data stored locally in this browser.</p>
            <button className="btn btn--outline" onClick={clear}>🗑️ Clear local data</button>
          </div>
        </div>
      </div>
    </section>
  );
}
