// src/app/auth/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  // State to manage the view: signIn, signUp, or forgotPassword
  const [mode, setMode] = useState<"signIn" | "signUp" | "forgotPassword">("signIn"); 
  const router = useRouter();

  // If user signs in successfully, bounce them home
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") router.push("/");
    });
    // Unsubscribe from the listener when the component unmounts
    return () => sub?.subscription.unsubscribe();
  }, [router]);

  // Unified handler for Sign In and Sign Up
  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      setMsg("Please enter both email and password.");
      return;
    }
    setSending(true);
    setMsg(null);

    let error;

    if (mode === "signIn") {
      // Sign In with email and password
      ({ error } = await supabase.auth.signInWithPassword({
        email,
        password,
      }));
    } else if (mode === "signUp") {
      // Sign Up with email and password
      ({ error } = await supabase.auth.signUp({
        email,
        password,
      }));
    }

    setSending(false);

    if (error) {
      setMsg(`⚠️ ${error.message}`);
    } else if (mode === "signUp") {
      // Prompt user to check email if confirmation is ON in Supabase settings
      setMsg("✅ Success! Check your inbox to confirm your account.");
      setMode("signIn"); 
    }
  };
  
  // Handler for Forgot Password (sends email link)
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setMsg("Please enter your email address above.");
      return;
    }
    setSending(true);
    setMsg(null);
    
    // FIX: Ensure correct baseUrl is used, preferring window.location.origin on client-side
    // This is safer than relying on a potentially unset NEXT_PUBLIC_SITE_URL in the browser.
    const baseUrl = window.location.origin;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // Redirect to the callback page, where we check the 'type' to send them to /profile
        redirectTo: `${baseUrl}/auth/callback`, 
    });

    setSending(false);
    setMsg(
        error
          ? `⚠️ ${error.message}`
          : "✅ Password reset link sent! Check your email inbox."
      );
  }
  
  // OAuth Sign-in Handlers removed as requested.

  const isSignInMode = mode === "signIn";
  const isSignUpMode = mode === "signUp";
  const isForgotPasswordMode = mode === "forgotPassword";
  
  const currentTitle = 
    (isSignInMode && "Sign in to Umbil") ||
    (isSignUpMode && "Create Account") ||
    (isForgotPasswordMode && "Reset Password");

  const buttonText = isSignInMode ? "Sign In" : "Sign Up";

  return (
    <section className="main-content">
      <div className="container">
        <h2>{currentTitle}</h2>

        <div className="card" style={{ marginTop: 16 }}>
          <div className="card__body">
            
            {/* The only remaining authentication method is email/password */}
            {!isForgotPasswordMode && (
                <div style={{ margin: "12px 0", opacity: 0.8, textAlign: 'center' }}>
                    Continue with your email and password
                </div>
            )}
            
            {/* Email Field */}
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

            {/* PASSWORD FIELD - Hidden in Forgot Password Mode */}
            {!isForgotPasswordMode && (
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
            
            {/* PRIMARY ACTION BUTTONS */}
            <div className="flex justify-end mt-4" style={{ marginBottom: isForgotPasswordMode ? 0 : 16 }}>
                {isForgotPasswordMode ? (
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
                        {sending ? (isSignInMode ? "Signing In..." : "Signing Up...") : buttonText}
                    </button>
                )}
            </div>

            {/* FOOTER LINKS */}
            <p style={{ marginTop: isForgotPasswordMode ? 16 : 0, textAlign: 'center', fontSize: '0.9rem' }}>
              {isSignInMode && (
                <>
                  New to Umbil?
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); setMode("signUp"); setMsg(null); }}
                    className="link"
                    style={{ marginLeft: 8 }}
                  >
                    Create an account
                  </a>
                  <span style={{ margin: '0 8px', color: 'var(--umbil-muted)' }}>|</span>
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); setMode("forgotPassword"); setMsg(null); }}
                    className="link"
                  >
                    Forgot Password?
                  </a>
                </>
              )}
              {isSignUpMode && (
                <>
                  Already have an account?
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); setMode("signIn"); setMsg(null); }}
                    className="link"
                    style={{ marginLeft: 8 }}
                  >
                    Sign in here
                  </a>
                </>
              )}
              {isForgotPasswordMode && (
                <>
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); setMode("signIn"); setMsg(null); }}
                    className="link"
                  >
                    ← Back to Sign In
                  </a>
                </>
              )}
            </p>

            {msg && <p style={{ marginTop: 12, color: msg.startsWith('⚠️') ? 'red' : 'var(--umbil-brand-teal)' }}>{msg}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}