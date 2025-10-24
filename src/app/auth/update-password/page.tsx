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
  const [session, setSession] = useState<boolean>(false);
  const router = useRouter();

  // Check if a valid session exists on load (meaning the token worked)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      // If we have a session, the recovery token was successfully exchanged.
      if (session) {
        setSession(true);
        setMsg("Enter your new password below.");
      } else {
        setMsg("⚠️ This reset link is expired or invalid. Please request a new one.");
        // Redirect to sign-in page after a delay if the link is bad
        setTimeout(() => router.push("/auth"), 5000);
      }
      setLoading(false);
    };
    checkSession();
  }, [router]);

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
      // Redirect to home after successful update
      setTimeout(() => router.push("/"), 2000);
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