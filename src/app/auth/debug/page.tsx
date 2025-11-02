"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function DebugAuth() {
  useEffect(() => {
    const hash = window.location.hash;
    console.log("🔍 Full current URL:", window.location.href);
    console.log("🔍 Hash fragment:", hash);

    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      console.log("🧠 supabase.auth.getSession():", sessionData);

      try {
        if (hash && hash.includes("access_token")) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(hash);
          console.log("💾 exchangeCodeForSession result:", { data, error });
        } else {
          console.warn("⚠️ No access_token fragment found in URL");
        }
      } catch (e) {
        console.error("❌ exchangeCodeForSession threw:", e);
      }
    })();
  }, []);

  return (
    <main style={{ padding: 32 }}>
      <h1>Umbil Supabase Debug</h1>
      <p>Open the browser console (F12 → Console tab) to see the logs.</p>
      <p>If <code>access_token</code> is missing, the email link or redirect URL is wrong.</p>
    </main>
  );
}
