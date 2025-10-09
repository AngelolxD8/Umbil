"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  // If user signs in successfully, bounce them home
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") router.push("/");
    });
    return () => sub?.subscription.unsubscribe();
  }, [router]);

  const signInWithEmail = async () => {
    if (!email.trim()) return;
    setSending(true);
    setMsg(null);

    // Use NEXT_PUBLIC_SITE_URL for correct redirect (Vercel & local)
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${baseUrl}/auth/callback` },
    });

    setSending(false);
    setMsg(
      error
        ? `⚠️ ${error.message}`
        : "✅ Check your inbox for a login link."
    );
  };

  const signInWithGoogle = async () => {
    // Use same redirect strategy for Google login
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${baseUrl}/auth/callback` },
    });

    if (error) setMsg(`⚠️ ${error.message}`);
  };

  return (
    <section className="main-content">
      <div className="container">
        <h2>Sign in</h2>

        <div className="card" style={{ marginTop: 16 }}>
          <div className="card__body">
            <div className="form-group">
              <label className="form-label">Email for magic link</label>
              <input
                className="form-control"
                type="email"
                placeholder="you@nhs.net"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              className="btn btn--primary"
              onClick={signInWithEmail}
              disabled={sending}
            >
              {sending ? "Sending…" : "Send magic link"}
            </button>

            <div style={{ margin: "12px 0", opacity: 0.6 }}>— or —</div>

            <button
              className="btn btn--outline"
              onClick={signInWithGoogle}
            >
              Continue with Google
            </button>

            {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
