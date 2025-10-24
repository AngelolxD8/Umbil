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
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn"); // Added state for mode
  const router = useRouter();

  // If user signs in successfully, bounce them home
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") router.push("/");
    });
    return () => sub?.subscription.unsubscribe();
  }, [router]);

  // Unified handler for both Sign In and Sign Up
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
    } else {
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
      setMsg("✅ Success! Check your inbox to confirm your account.");
      // Automatically switch to sign-in mode after successful sign-up
      setMode("signIn"); 
    }
    // No explicit message for successful sign-in, as it auto-redirects
  };
  
  // Keep Google Sign-in as a separate option
  const signInWithGoogle = async () => {
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${baseUrl}/auth/callback` },
    });

    if (error) setMsg(`⚠️ ${error.message}`);
  };

  const isSignInMode = mode === "signIn";
  const buttonText = isSignInMode ? "Sign In" : "Sign Up";

  return (
    <section className="main-content">
      <div className="container">
        <h2>{isSignInMode ? "Sign in to Umbil" : "Create Account"}</h2>

        <div className="card" style={{ marginTop: 16 }}>
          <div className="card__body">
            
            {/* Email Field */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-control"
                type="email"
                placeholder="you@nhs.net"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-control"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAuth()}
              />
            </div>

            <button
              className="btn btn--primary"
              onClick={handleAuth}
              disabled={sending || !email.trim() || !password.trim()}
            >
              {sending ? (isSignInMode ? "Signing In..." : "Signing Up...") : buttonText}
            </button>
            
            {/* Toggle between Sign In and Sign Up */}
            <p style={{ marginTop: 16, textAlign: 'center' }}>
              {isSignInMode ? "New to Umbil?" : "Already have an account?"}
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); setMode(isSignInMode ? "signUp" : "signIn"); setMsg(null); }}
                className="link"
                style={{ marginLeft: 8 }}
              >
                {isSignInMode ? "Create an account" : "Sign in here"}
              </a>
            </p>

            <div style={{ margin: "12px 0", opacity: 0.6, textAlign: 'center' }}>— or —</div>

            <button
              className="btn btn--outline"
              onClick={signInWithGoogle}
              style={{ width: '100%' }}
            >
              Continue with Google
            </button>

            {msg && <p style={{ marginTop: 12, color: msg.startsWith('⚠️') ? 'red' : 'var(--umbil-brand-teal)' }}>{msg}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}