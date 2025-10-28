// src/app/auth/update-password/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation"; // Import useSearchParams

// A dedicated page for users coming from the password reset email link
export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false); 
  const router = useRouter();
  const searchParams = useSearchParams(); // Get URL parameters

  // Use this effect only to check the validity of the recovery token and URL
  useEffect(() => {
    let isMounted = true;
    
    // Check if the URL contains the access token, indicating a recovery session attempt
    const accessToken = searchParams.get('access_token');
    
    if (accessToken) {
        // We have a token in the URL, indicating Supabase is trying to authenticate.
        // We show the form immediately and trust that the session has been set.
        setIsReady(true);
        setMsg("Enter your new password below.");
        setLoading(false);
    } else {
        // If no access_token is present, this page was loaded incorrectly.
        setMsg("⚠️ Invalid access. Please use the password reset link from your email.");
        setLoading(false);

        // Redirect invalid attempts back to the sign-in page
        const redirectTimer = setTimeout(() => {
            if (isMounted) router.replace("/auth");
        }, 5000);

        return () => clearTimeout(redirectTimer);
    }
    
    // Cleanup for mounted status
    return () => {
        isMounted = false;
    };
  }, [searchParams, router]); // Dependency array includes searchParams and router

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

    // This function updates the password for the current session (set by the URL token)
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    setLoading(false);

    if (error) {
      setMsg(`⚠️ Error updating password: ${error.message}`);
      // In case of error, force sign out to clear the bad session
      await supabase.auth.signOut();
    } else {
      setMsg("✅ Success! Your password has been updated. Redirecting to home...");
      // Redirect to home after successful update
      setTimeout(() => router.replace("/"), 2000);
    }
  };

  return (
    <section className="main-content">
      <div className="container">
        <h2>Set New Password</h2>

        <div className="card" style={{ marginTop: 16 }}>
          <div className="card__body">
            
            {loading && <p>{msg || "Loading..."}</p>}
            
            {/* Show form only if we are ready (have the token) */}
            {!loading && isReady && (
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

            {/* Show error message if not ready and not loading (invalid link) */}
            {!loading && !isReady && <p style={{ color: msg?.startsWith('⚠️') ? 'red' : 'var(--umbil-brand-teal)' }}>{msg}</p>}

          </div>
        </div>
      </div>
    </section>
  );
}