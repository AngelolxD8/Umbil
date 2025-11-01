// src/app/auth/callback/CallbackHandler.tsx
"use client";

import { useEffect } from "react";
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

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Combine query params and hash fragment params (some providers / Supabase use the fragment)
        const qs = new URLSearchParams(window.location.search);
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, "?"));

        const getParam = (name: string) =>
          qs.get(name) ?? hash.get(name) ?? null;

        const recoveryType = getParam("type");
        const access_token = getParam("access_token");
        const refresh_token = getParam("refresh_token");

        // If tokens are present in the URL fragment, set the session so Supabase client becomes authenticated
        if (access_token) {
          // coerce refresh_token to a string (empty string fallback) so TS no longer complains
          // access_token is truthy here so narrowed to string; refresh_token ?? "" yields a string
          await supabase.auth.setSession({
            access_token,
            refresh_token: refresh_token ?? "",
          });
        }

        // Give Supabase a moment to materialize the session, then fetch it
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData.session;

        if (session && recoveryType === "recovery") {
          // User has a valid session from the recovery link — send them to update-password
          router.replace("/auth/update-password");
          return;
        }

        // Otherwise, go home (or to the default post-login landing)
        router.replace("/");
      } catch (err) {
        // On any unexpected error, log (dev) and redirect home
        // eslint-disable-next-line no-console
        console.error("Auth callback handling failed:", err);
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