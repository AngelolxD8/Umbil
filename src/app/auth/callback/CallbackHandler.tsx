// src/app/auth/callback/CallbackHandler.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
        // Combine query params and hash fragment params (some providers / Supabase use the fragment)
        const qs = new URLSearchParams(window.location.search);
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, "?"));

        // collect any relevant token-like params
        const pick = (name: string) => qs.get(name) ?? hash.get(name) ?? null;
        const access_token =
          pick("access_token") ?? pick("accessToken") ?? pick("token");
        const refresh_token =
          pick("refresh_token") ?? pick("refreshToken") ?? pick("refresh");
        const recoveryType = pick("type") ?? pick("action") ?? null;

        // small debug logging
        // eslint-disable-next-line no-console
        console.info("Auth callback params:", {
          access_token,
          refresh_token,
          recoveryType,
        });
        setDebugMsg(
          `Params: access_token=${!!access_token}, refresh_token=${!!refresh_token}, type=${recoveryType}`
        );

        if (access_token) {
          // call setSession even if refresh_token is missing; cast to any to satisfy typings
          // Supabase will accept access_token alone in many flows
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await supabase.auth.setSession({
            access_token,
            refresh_token: (refresh_token ?? undefined),
          } as any);
        }

        // poll for session briefly (helpful if client needs a moment to persist tokens)
        let session = null;
        for (let i = 0; i < 6; i++) {
          // small delay between attempts
          await wait(500);
          // fetch session
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { data: sessionData } = await supabase.auth.getSession();
          session = sessionData?.session ?? null;
          if (session) break;
        }

        if (session && recoveryType === "recovery") {
          // User has a valid session from the recovery link — send them to update-password
          router.replace("/auth/update-password");
          return;
        }

        if (session) {
          router.replace("/");
          return;
        }

        // If we get here no session was established — keep user on a debug page so they can retry / inspect
        // eslint-disable-next-line no-console
        console.warn("No session established after callback.", {
          access_token,
          refresh_token,
          recoveryType,
        });
        setDebugMsg(
          "No session found after callback. If you used a password reset link, ensure the redirect URL exactly matches the one registered in Supabase and that your app origin is allowed. See console for params."
        );

        // After showing debug info for a moment, navigate to home (unsigned)
        await wait(2500);
        router.replace("/");
      } catch (err) {
        // On any unexpected error, log (dev) and redirect home
        // eslint-disable-next-line no-console
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
          <div
            style={{
              marginTop: 12,
              color: "#666",
              fontSize: 14,
              maxWidth: 720,
              margin: "12px auto",
            }}
          >
            {debugMsg}
          </div>
        )}
      </div>
    </div>
  );
}