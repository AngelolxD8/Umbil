// src/components/AuthButtons.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthButtons() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? null);
    };
    getSession();

    // keep in sync on auth changes
    const { data: sub } = supabase.auth.onAuthStateChange(() => getSession());
    return () => sub?.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setEmail(null);
  };

  if (email) {
    return (
      <div className="user-profile">
        <button className="btn btn--outline" onClick={signOut}>Sign out</button>
      </div>
    );
  }

  return (
    <div className="user-profile">
      <a className="btn btn--primary" href="/auth">Sign in</a>
    </div>
  );
}