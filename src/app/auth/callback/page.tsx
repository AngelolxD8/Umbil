// src/app/auth/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { AuthSession } from '@supabase/supabase-js';

/**
 * Handles all authentication redirects (Magic Link, OAuth, etc.).
 * It processes session tokens and redirects the user based on the session and flow type.
 */
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Utility to create a promise that waits a specified time
    const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

    const handleAuthCallback = async () => {
      try {
        const qs = new URLSearchParams(window.location.search);
        // Extracts tokens from the URL fragment (hash) which is common for Supabase auth flows
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, "?"));

        // Helper to pick token from either query string or hash
        const pick = (name: string): string | null => qs.get(name) ?? hash.get(name) ?? null;
        const access_token = pick("access_token") ?? pick("accessToken") ?? pick("token");
        const refresh_token = pick("refresh_token") ?? pick("refreshToken") ?? pick("refresh");
        // Custom query parameter to force redirect to /profile (used for Forgot Password flow)
        const customFlow = pick("flow"); 

        if (access_token) {
          const sessionPayload = {
            access_token,
            ...(refresh_token ? { refresh_token } : {})
          } as Parameters<typeof supabase.auth.setSession>[0];
          await supabase.auth.setSession(sessionPayload);
        }

        let session: AuthSession | null = null;
        // Poll briefly to ensure session state is loaded after redirect
        for (let i = 0; i < 6; i++) {
          await wait(500);
          const { data: sessionData } = await supabase.auth.getSession();
          session = sessionData?.session ?? null;
          if (session) break;
        }

        if (session) {
          // --- THIS IS THE FIX ---
          // Set a flag in sessionStorage to indicate a fresh login.
          // HomeContent will read this to decide if it should start the tour.
          sessionStorage.setItem("justLoggedIn", "true");
          // -----------------------

          // If custom flow asks for profile redirect (for magic link 'forgot password'), go there
          if (customFlow === "profile_redirect") {
            router.replace("/profile");
            return;
          }
          
          // Otherwise, default to home page
          router.replace("/");
          return;
        }

        // Final fallback to home on complete failure
        await wait(2500);
        router.replace("/");
      } catch (err) {
        console.error("Auth callback handling failed:", err);
        await wait(1200);
        router.replace("/");
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="main-content">
      <div className="container" style={{ textAlign: "center" }}>
        <p>Finalizing sign-in...</p>
      </div>
    </div>
  );
}