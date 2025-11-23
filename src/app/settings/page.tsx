// src/app/settings/page.tsx
"use client";

import { clearAll } from "@/lib/store";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const [accepted, setAccepted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const v = localStorage.getItem("no_phi_ack");
    setAccepted(v === "yes");
  }, []);

  const saveAck = () => {
    localStorage.setItem("no_phi_ack", accepted ? "yes" : "no");
    alert("Safety setting saved.");
  };

  const clear = () => {
    if (!confirm("This will remove all locally saved CPD and PDP data on this device. Continue?")) return;
    clearAll();
    alert("Local data cleared.");
  };
    
  // --- UPDATED: Real Account Deletion Logic ---
  const deleteAccount = async () => {
      if (!confirm("Are you sure you want to permanently delete your Umbil account? This action cannot be undone and all your CPD data will be lost.")) return;
      
      const confirmText = prompt("To confirm, please type 'DELETE' below:");
      if (confirmText !== "DELETE") {
          alert("Deletion cancelled.");
          return;
      }

      setIsDeleting(true);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) {
            alert("You are not logged in.");
            setIsDeleting(false);
            return;
        }

        // Call our new API route
        const res = await fetch("/api/auth/delete-account", {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "Failed to delete account");
        }

        // Cleanup local state
        clearAll();
        await supabase.auth.signOut();
        
        alert("Your account has been deleted. You will now be redirected.");
        router.push("/");

      } catch (err: any) {
          console.error(err);
          alert(`Error: ${err.message}`);
          setIsDeleting(false);
      }
  }

  const handleInformationalChange = () => { };

  return (
    <section className="main-content">
      <div className="container">
        <h2>Settings</h2>

        {/* GDPR Safety and Consent Check */}
        <div className="card" style={{ marginTop: 24, marginBottom: 24 }}>
          <div className="card__body">
            <h3 style={{marginBottom: 12}}>GDPR / Data Safety Checklist</h3>
            <p className="section-description" style={{marginBottom: 16}}>
                Your safety and data privacy is our priority. Please review and confirm your understanding of our data practices:
            </p>
            
            <div style={{ marginBottom: 16, paddingTop: 8 }}>
                <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="checkbox" checked={accepted} onChange={(e)=>setAccepted(e.target.checked)} />
                    <label>I understand I must not enter patient-identifiable information (PHI) into Umbil.</label>
                </div>
                <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="checkbox" checked={true} onChange={handleInformationalChange} />
                    <label>I know that my conversations are logged as CPD and can be exported as a CSV from the &apos;My CPD&apos; page (Right to Data Portability).</label>
                </div>
                <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="checkbox" checked={true} onChange={handleInformationalChange} />
                    <label>I know that my local CPD/PDP logs can be manually cleared below (Right to Erasure - Local Data).</label>
                </div>
            </div>

            <button className="btn btn--primary" onClick={saveAck}>Save PHI Acknowledgment</button>
          </div>
        </div>

        {/* Local Data Management */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card__body">
            <h3 style={{marginBottom: 8}}>Data Management: Local Browser Storage</h3>
            <p className="section-description" style={{marginBottom: 12}}>This action clears all CPD/PDP data stored locally in this browser (Right to Erasure - Local Data).</p>
            <button className="btn btn--outline" onClick={clear}>🗑️ Clear ALL local data (CPD/PDP)</button>
          </div>
        </div>
        
        {/* Account Deletion */}
        <div className="card">
          <div className="card__body">
            <h3 style={{marginBottom: 8}}>Account Deletion (Remote Data Erasure)</h3>
            <p className="section-description" style={{marginBottom: 12}}>Permanently delete your Umbil user profile and all associated remote data.</p>
            <button 
                className="btn btn--outline" 
                style={{backgroundColor: 'var(--umbil-hover-bg)', color: '#dc3545', borderColor: '#dc3545'}} 
                onClick={deleteAccount}
                disabled={isDeleting}
            >
                {isDeleting ? "Deleting..." : "⚠️ Permanently Delete Account"}
            </button>
            <p style={{marginTop: '8px', fontSize: '0.8rem', color: 'var(--umbil-muted)'}}>Note: This action is irreversible.</p>
          </div>
        </div>
        
      </div>
    </section>
  );
}