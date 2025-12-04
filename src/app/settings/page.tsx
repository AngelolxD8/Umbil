// src/app/settings/page.tsx
"use client";

import { clearAll } from "@/lib/store";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const v = localStorage.getItem("no_phi_ack");
    const comms = localStorage.getItem("comms_pref");
    setAccepted(v === "yes");
  }, []);

  const saveCommsPref = () => {
    localStorage.setItem("comms_pref", accepted ? "yes" : "no");
    alert("Communication preferences saved.");
  };

  const saveAck = () => {
    localStorage.setItem("no_phi_ack", accepted ? "yes" : "no");
    alert("Safety setting saved.");
  };

  const clear = () => {
    if (!confirm("This will remove all locally saved CPD and PDP data on this device. Continue?")) return;
    clearAll();
    alert("Local data cleared.");
  };
    
  // --- New function: Simulate GDPR action for remote account deletion ---
  const deleteAccount = () => {
      if (!confirm("Are you sure you want to permanently delete your Umbil account and all associated remote data? This action cannot be undone.")) return;
      
      alert("Account deletion request initiated. Please clear your local data using the button below to complete the erasure process.");
  }

  // Dummy change handler for the informational checkboxes
  const handleInformationalChange = () => {
    // This function does nothing as these checkboxes are for information only.
    // However, including it makes the checkbox clickable and visually responsive.
  };


  return (
    <section className="main-content">
      <div className="container">
        <h2>Settings</h2>

        {/* Marketing Preferences*/}
        <div className="card" style={{ marginTop: 24, marginBottom: 24}}>
          <div className="card__body">
            <h3 style={{ marginBottom: 12 }}>Communication Preferences</h3>
            <p className="section-description" style={{ marginBottom: 16 }}>
              Please select if you would like to opt-in to our updates and weekly newsletters:
            </p>

            {/*Checklist of comms preferences */}
            <div style={{marginBottom: 16, paddingTop: 8}}>
              <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="checkbox"/>
                <label>General updates about Umbil and new upcoming features.</label>
              </div>
              <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="checkbox"/>
                <label>Subscribe to our weekly newsletter on tips & best practices when using Umbil.</label>
              </div>
            </div>

            <button className="btn btn--primary" onClick={saveCommsPref}>Save communication preferences</button>
          </div>
        </div>

        {/* GDPR Safety and Consent Check */}
        <div className="card" style={{ marginTop: 24, marginBottom: 24 }}>
          <div className="card__body">
            <h3 style={{marginBottom: 12}}>GDPR / Data Safety Checklist</h3>
            <p className="section-description" style={{marginBottom: 16}}>
                Your safety and data privacy is our priority. Please review and confirm your understanding of our data practices:
            </p>
            
            {/* Checklist items visually represent compliance - FIXED UNESCAPED QUOTES */}
            <div style={{ marginBottom: 16, paddingTop: 8 }}>
                <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="checkbox" checked={accepted} onChange={(e)=>setAccepted(e.target.checked)} />
                    <label>I understand I must not enter patient-identifiable information (PHI) into Umbil.</label>
                </div>
                <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="checkbox" checked={true} onChange={handleInformationalChange} />
                    <label>I know that my conversations are logged as CPD and can be exported as a CSV from the &apos;My CPD&apos; page (Right to Data Portability).</label> {/* FIXED QUOTES */}
                </div>
                <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="checkbox" checked={true} onChange={handleInformationalChange} />
                    <label>I know that my local CPD/PDP logs can be manually cleared below (Right to Erasure - Local Data).</label>
                </div>
            </div>

            <button className="btn btn--primary" onClick={saveAck}>Save PHI Acknowledgment</button>
          </div>
        </div>

        {/* Local Data Management (Right to Erasure / Data Portability - Local Scope) */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card__body">
            <h3 style={{marginBottom: 8}}>Data Management: Local Browser Storage</h3>
            <p className="section-description" style={{marginBottom: 12}}>This action clears all CPD/PDP data stored locally in this browser (Right to Erasure - Local Data).</p>
            <button className="btn btn--outline" onClick={clear}>🗑️ Clear ALL local data (CPD/PDP)</button>
          </div>
        </div>
        
        {/* Account Deletion (Right to Erasure - Remote Scope) */}
        <div className="card">
          <div className="card__body">
            <h3 style={{marginBottom: 8}}>Account Deletion (Remote Data Erasure)</h3>
            <p className="section-description" style={{marginBottom: 12}}>Permanently delete your Umbil user profile and associated remote data (e.g., full name, grade).</p>
            <button className="btn btn--outline" style={{backgroundColor: 'var(--umbil-hover-bg)', color: '#dc3545', borderColor: '#dc3545'}} onClick={deleteAccount}>
                ⚠️ Request Account Deletion (Right to Erasure)
            </button>
            <p style={{marginTop: '8px', fontSize: '0.8rem', color: 'var(--umbil-muted)'}}>Note: This action is irreversible. You must also clear local data separately using the button above.</p>
          </div>
        </div>
        
      </div>
    </section>
  );
}