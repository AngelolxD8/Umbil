// src/app/auth/callback/CallbackHandler.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { AuthSession, AuthTokenResponse } from '@supabase/supabase-js';

/**
 * CallbackHandler
 * - Parses both query string and URL hash (fragment) because Supabase sometimes returns tokens in the fragment.
 * - If access_token is present in the URL, call supabase.auth.setSession(...) to establish the session.
 * - If a session exists and the flow is a password recovery, redirect to /auth/update-password.
 * - Otherwise redirect to home.
 */
export default function CallbackHandler() {
  const router = useRouter();
  const [debugMsg, setDebugMsg] = useState<string | null>(null);

  useEffect(() => {
    const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

    const handleAuthCallback = async () => {
      try {
        const qs = new URLSearchParams(window.location.search);
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, "?"));

        const pick = (name: string): string | null => qs.get(name) ?? hash.get(name) ?? null;
        const access_token = pick("access_token") ?? pick("accessToken") ?? pick("token");
        const refresh_token = pick("refresh_token") ?? pick("refreshToken") ?? pick("refresh");
        const recoveryType = pick("type") ?? pick("action") ?? null;

        console.info("Auth callback params:", {
          access_token: !!access_token,
          refresh_token: !!refresh_token,
          recoveryType,
        });
        
        setDebugMsg(
          `Params: access_token=${!!access_token}, refresh_token=${!!refresh_token}, type=${recoveryType}`
        );

        if (access_token) {
          const sessionPayload = {
            access_token,
            ...(refresh_token ? { refresh_token } : {})
          } as Parameters<typeof supabase.auth.setSession>[0];
          await supabase.auth.setSession(sessionPayload);
        }

        let session: AuthSession | null = null;
        for (let i = 0; i < 6; i++) {
          await wait(500);
          const { data: sessionData } = await supabase.auth.getSession();
          session = sessionData?.session ?? null;
          if (session) break;
        }

        if (session && recoveryType === "recovery") {
          router.replace("/auth/update-password");
          return;
        }

        if (session) {
          router.replace("/");
          return;
        }

        console.warn("No session established after callback.", {
          hasAccessToken: !!access_token,
          hasRefreshToken: !!refresh_token,
          recoveryType,
        });
        
        setDebugMsg(
          "No session found after callback. Ensure the redirect URL registered in Supabase exactly matches your app origin."
        );

        await wait(2500);
        router.replace("/");
      } catch (err) {
        console.error("Auth callback handling failed:", err);
        setDebugMsg("Unexpected error handling callback. See console.");
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
        {debugMsg && (
          <div style={{ marginTop: 12, color: "#666", fontSize: 14, maxWidth: 720, margin: "12px auto" }}>
            {debugMsg}
          </div>
        )}
      </div>
    </div>
  );
}