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
    if (!confirm("This will remove all locally saved PDP goals and cached data on this device. Continue?")) return;
    clearAll();
    alert("Local data cleared.");
  };
    
  // --- Account Deletion Logic ---
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

        const res = await fetch("/api/auth/delete-account", {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        // FIX 1: Safely handle the response parsing
        let errData;
        const text = await res.text(); // Get raw text first
        try {
            // Try to parse as JSON if text exists
            errData = text ? JSON.parse(text) : {}; 
        } catch {
            // If parsing fails, assume generic error
            errData = { error: "Invalid server response" };
        }

        if (!res.ok) {
            throw new Error(errData.error || "Failed to delete account");
        }

        // FIX 2: Automatically clear local storage (PDP goals) on account delete
        clearAll();
        await supabase.auth.signOut();
        
        alert("Your account has been permanently deleted. Redirecting to home.");
        router.push("/");

      } catch (err: unknown) {
          console.error(err);
          const msg = err instanceof Error ? err.message : "An unknown error occurred";
          alert(`Error: ${msg}`);
      } finally {
          setIsDeleting(false);
      }
  }

  const handleInformationalChange = () => { };

  return (
    <section className="main-content">
      <div className="container">
        <h2>Settings</h2>

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
                    <label>I know that my local PDP goals can be manually cleared below (Right to Erasure - Local Data).</label>
                </div>
            </div>

            <button className="btn btn--primary" onClick={saveAck}>Save PHI Acknowledgment</button>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card__body">
            <h3 style={{marginBottom: 8}}>Local Data Management</h3>
            <p className="section-description" style={{marginBottom: 12}}>
                Your Personal Development Plan (PDP) goals are currently stored only on this device. Use this to wipe them.
            </p>
            <button className="btn btn--outline" onClick={clear}>🗑️ Clear local PDP goals</button>
          </div>
        </div>
        
        <div className="card" style={{ borderColor: '#fee2e2', backgroundColor: 'var(--umbil-surface)' }}>
          <div className="card__body">
            <h3 style={{marginBottom: 8, color: '#dc2626'}}>Danger Zone: Account Deletion</h3>
            <p className="section-description" style={{marginBottom: 12}}>
                Permanently delete your Umbil user profile and all associated remote CPD data. This will also wipe your local data.
            </p>
            <button 
                className="btn btn--outline" 
                style={{
                    backgroundColor: '#fef2f2', 
                    color: '#dc2626', 
                    borderColor: '#dc2626'
                }} 
                onClick={deleteAccount}
                disabled={isDeleting}
            >
                {isDeleting ? "Deleting..." : "⚠️ Permanently Delete Account"}
            </button>
            <p style={{marginTop: '8px', fontSize: '0.8rem', color: 'var(--umbil-muted)'}}>
                Note: This action is irreversible.
            </p>
          </div>
        </div>
        
      </div>
    </section>
  );
}