// src/app/auth/update-password/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

// A dedicated page for users coming from the password reset email link
export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [session, setSession] = useState(false); // Tracks if a valid session exists
  const router = useRouter();

  // Use a brief delay to ensure the session is properly loaded from cookies/storage
  useEffect(() => {
    let isMounted = true; 
    
    // Use a delay to ensure the Supabase client has initialized and loaded the session
    const delayCheck = setTimeout(async () => {
        // The URL fragments (tokens) from the reset email link are automatically read and stored 
        // by the Supabase client on page load. We just need to wait a moment for that to happen.
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (isMounted) {
            if (currentSession) {
                setSession(true);
                setMsg("Enter your new password below.");
            } else {
                setMsg("⚠️ This reset link is expired or invalid. Please request a new one.");
                // Redirect to the auth page after a delay
                setTimeout(() => router.replace("/auth"), 5000); 
            }
            setLoading(false);
        }
    }, 500); // 500ms delay to let session cookies settle

    // Cleanup function: Clear the timeout and set the flag
    return () => {
      isMounted = false;
      clearTimeout(delayCheck);
    };
  }, [router]); // Only re-run when router changes

  const handleUpdatePassword = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      setMsg("Please enter and confirm your new password.");
      return;
    }
    if (password !== confirmPassword) {
      setMsg("⚠️ Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setMsg("⚠️ Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setMsg(null);

    // This is the core function: it updates the password for the current (temporary) session
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    setLoading(false);

    if (error) {
      setMsg(`⚠️ Error updating password: ${error.message}`);
    } else {
      setMsg("✅ Success! Your password has been updated. Redirecting to home...");
      // Use replace for the final push home
      setTimeout(() => router.replace("/"), 2000);
    }
  };

  return (
    <section className="main-content">
      <div className="container">
        <h2>Set New Password</h2>

        <div className="card" style={{ marginTop: 16 }}>
          <div className="card__body">
            
            {loading && <p>Loading...</p>}
            
            {/* Show form only if a valid session exists from the link */}
            {!loading && session && (
                <>
                    <p style={{marginBottom: 16, color: 'var(--umbil-text)'}}>{msg}</p>
                    <div className="form-group">
                        <label className="form-label">New Password (Min 6 chars)</label>
                        <input
                            className="form-control"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Confirm New Password</label>
                        <input
                            className="form-control"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={loading}
                            onKeyDown={(e) => e.key === "Enter" && handleUpdatePassword()}
                        />
                    </div>
                    <button 
                        className="btn btn--primary" 
                        onClick={handleUpdatePassword} 
                        disabled={loading || !password || !confirmPassword}
                    >
                        Update Password
                    </button>
                </>
            )}

            {/* Show message if link is bad or after success */}
            {!loading && !session && <p style={{ color: msg?.startsWith('⚠️') ? 'red' : 'var(--umbil-brand-teal)' }}>{msg}</p>}

          </div>
        </div>
      </div>
    </section>
  );
}