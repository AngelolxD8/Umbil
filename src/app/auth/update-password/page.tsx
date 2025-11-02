"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

/**
 * Handles password reset flow for Supabase.
 * Fix: Explicitly parses the URL hash and exchanges tokens manually.
 */
export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [session, setSession] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function handleSessionCheck() {
      console.log("🔍 Checking for Supabase session...");

      // STEP 1: Check existing session
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      if (currentSession) {
        console.log("✅ Found active session");
        if (!mounted) return;
        setSession(true);
        setMsg("Enter your new password below.");
        setLoading(false);
        return;
      }

      // STEP 2: Attempt manual session exchange
      const hash = window.location.hash;
      console.log("⚙️ No session found, checking hash:", hash);

      if (hash && hash.includes("access_token")) {
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(hash);
          if (error) throw error;
          if (data.session) {
            console.log("✅ Manual session exchange success");
            if (!mounted) return;
            setSession(true);
            setMsg("Enter your new password below.");
          } else {
            console.log("⚠️ Exchange did not return a session");
            setMsg("⚠️ This reset link is invalid or expired.");
            setTimeout(() => router.replace("/auth"), 5000);
          }
        } catch (err) {
          console.error("❌ Error exchanging session:", err);
          setMsg("⚠️ Error reading reset link. Please request a new one.");
          setTimeout(() => router.replace("/auth"), 5000);
        }
      } else {
        console.warn("⚠️ No hash fragment found in URL");
        setMsg("⚠️ This reset link is expired or invalid. Please request a new one.");
        setTimeout(() => router.replace("/auth"), 5000);
      }

      setLoading(false);
    }

    handleSessionCheck();
    return () => {
      mounted = false;
    };
  }, [router]);

  // STEP 3: Update password
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

    console.log("🔄 Updating password...");
    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      console.error("❌ Password update error:", error);
      setMsg(`⚠️ Error updating password: ${error.message}`);
    } else {
      setMsg("✅ Success! Your password has been updated. Redirecting...");
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

            {!loading && session && (
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

            {!loading && !session && (
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
