// src/app/auth/update-password/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

// The best practice component for handling password recovery redirection.
export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const router = useRouter();

  // --- Core Session Handling Logic ---
  useEffect(() => {
    let mounted = true;

    async function handleSessionCheck() {
      // 1. Get tokens from the URL fragment immediately.
      // This is necessary because some frameworks/browsers strip the #hash.
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      
      console.log("🔑 Checking URL hash for tokens:", { access_token: !!access_token, refresh_token: !!refresh_token });

      // 2. If tokens are present, try to establish the session.
      if (access_token) {
        try {
          // This call stores the tokens in local storage and creates a session.
          await supabase.auth.setSession({
            access_token,
            refresh_token: refresh_token || access_token, // Fallback if refresh token is somehow missed
          });
          
          // Clear the hash from the URL immediately after processing to prevent refresh loop
          window.history.replaceState({}, document.title, window.location.pathname);
          
          console.log("✅ Session established from tokens. Checking final status...");
        } catch (error) {
          console.error("❌ Error setting session:", error);
          // Fall-through to check session status below
        }
      }

      // 3. Final check for an active session (from new login or existing session).
      // We use a small delay to allow localStorage/cookies to fully sync.
      await new Promise(resolve => setTimeout(resolve, 50)); 
      
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      if (mounted) {
        if (currentSession) {
          setSessionActive(true);
          setMsg("Enter your new password below.");
        } else {
          setMsg("⚠️ Invalid or expired reset link. Please request a new one.");
          setTimeout(() => router.replace("/auth"), 5000);
        }
        setLoading(false);
      }
    }

    handleSessionCheck();
    return () => {
      mounted = false;
    };
  }, [router]);

  // --- Handle password update ---
  const handleUpdatePassword = async () => {
    // ... (rest of the logic is unchanged and correct)
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

    console.log("🔄 Updating password...");
    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      console.error("❌ Password update error:", error);
      setMsg(`⚠️ Error updating password: ${error.message}`);
    } else {
      setMsg("✅ Success! Your password has been updated. Redirecting...");
      // Redirect to home/auth/success after a delay
      setTimeout(() => router.replace("/"), 2000); 
    }
  };

  // --- Render Function ---
  return (
    <section className="main-content">
      <div className="container">
        <h2>Set New Password</h2>

        <div className="card" style={{ marginTop: 16 }}>
          <div className="card__body">
            {loading && <p>Loading...</p>}

            {!loading && sessionActive && ( // Changed 'session' state variable name to sessionActive for clarity
              <>
                <p style={{ marginBottom: 16, color: "var(--umbil-text)" }}>
                  {msg}
                </p>

                <div className="form-group">
                  <label className="form-label">New Password (min 6 chars)</label>
                  <input
                    className="form-control"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    className="form-control"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdatePassword();
                    }}
                  />
                </div>

                <button
                  className="btn btn--primary"
                  onClick={handleUpdatePassword}
                  disabled={loading || !password || !confirmPassword}
                >
                  {loading ? "Updating..." : "Update Password"}
                </button>
              </>
            )}

            {!loading && !sessionActive && (
              <p
                style={{
                  color: msg?.startsWith("⚠️") ? "red" : "var(--umbil-brand-teal)",
                }}
              >
                {msg}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}