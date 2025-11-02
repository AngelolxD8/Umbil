"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [mode, setMode] = useState<"signIn" | "signUp" | "forgotPassword">("signIn");
  const router = useRouter();

  // Redirect user if already signed in
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") router.push("/");
    });
    return () => sub?.subscription.unsubscribe();
  }, [router]);

  // --- Sign In / Sign Up Handler
  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      setMsg("Please enter both email and password.");
      return;
    }
    setSending(true);
    setMsg(null);

    let error: any;

    if (mode === "signIn") {
      ({ error } = await supabase.auth.signInWithPassword({ email, password }));
    } else if (mode === "signUp") {
      ({ error } = await supabase.auth.signUp({ email, password }));
    }

    setSending(false);

    if (error) {
      setMsg(`⚠️ ${error.message}`);
    } else if (mode === "signUp") {
      setMsg("✅ Success! Check your inbox to confirm your account.");
      setMode("signIn");
    }
  };

  // --- Forgot Password Handler
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setMsg("Please enter your email address above.");
      return;
    }

    setSending(true);
    setMsg(null);

    const baseUrl = window.location.origin;
    const redirectTo = `${baseUrl}/auth/update-password`;

    console.log("🔗 Sending password reset with redirect:", redirectTo);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    setSending(false);
    setMsg(
      error
        ? `⚠️ ${error.message}`
        : "✅ Password reset link sent! Check your email inbox."
    );
  };

  const isForgot = mode === "forgotPassword";
  const title =
    mode === "signIn"
      ? "Sign in to Umbil"
      : mode === "signUp"
      ? "Create Account"
      : "Reset Password";

  return (
    <section className="main-content">
      <div className="container">
        <h2>{title}</h2>

        <div className="card" style={{ marginTop: 16 }}>
          <div className="card__body">
            {!isForgot && (
              <div style={{ margin: "12px 0", opacity: 0.8, textAlign: "center" }}>
                Continue with your email and password
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-control"
                type="email"
                placeholder="you@nhs.net"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={sending}
              />
            </div>

            {!isForgot && (
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  className="form-control"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                  disabled={sending}
                />
              </div>
            )}

            <div className="flex justify-end mt-4">
              {isForgot ? (
                <button
                  className="btn btn--primary"
                  onClick={handleForgotPassword}
                  disabled={sending || !email.trim()}
                >
                  {sending ? "Sending Link..." : "Send Reset Link"}
                </button>
              ) : (
                <button
                  className="btn btn--primary"
                  onClick={handleAuth}
                  disabled={sending || !email.trim() || !password.trim()}
                >
                  {sending
                    ? mode === "signIn"
                      ? "Signing In..."
                      : "Signing Up..."
                    : mode === "signIn"
                    ? "Sign In"
                    : "Sign Up"}
                </button>
              )}
            </div>

            <p
              style={{
                marginTop: 16,
                textAlign: "center",
                fontSize: "0.9rem",
              }}
            >
              {mode === "signIn" && (
                <>
                  New to Umbil?
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setMode("signUp");
                      setMsg(null);
                    }}
                    className="link"
                    style={{ marginLeft: 8 }}
                  >
                    Create an account
                  </a>
                  <span style={{ margin: "0 8px", color: "var(--umbil-muted)" }}>
                    |
                  </span>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setMode("forgotPassword");
                      setMsg(null);
                    }}
                    className="link"
                  >
                    Forgot Password?
                  </a>
                </>
              )}
              {mode === "signUp" && (
                <>
                  Already have an account?
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setMode("signIn");
                      setMsg(null);
                    }}
                    className="link"
                    style={{ marginLeft: 8 }}
                  >
                    Sign in here
                  </a>
                </>
              )}
              {mode === "forgotPassword" && (
                <>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setMode("signIn");
                      setMsg(null);
                    }}
                    className="link"
                  >
                    ← Back to Sign In
                  </a>
                </>
              )}
            </p>

            {msg && (
              <p
                style={{
                  marginTop: 12,
                  color: msg.startsWith("⚠️")
                    ? "red"
                    : "var(--umbil-brand-teal)",
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
