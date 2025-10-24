// src/app/auth/callback/CallbackHandler.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

// This component uses client-side hooks and will be wrapped in <Suspense>
export default function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams(); 

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Step 1: Handle token verification (Supabase does this automatically)
      // The recovery flow sets a temporary session, and its success is confirmed by a session existing.
      const { data: { session } } = await supabase.auth.getSession();

      // Step 2: Check URL parameters
      const recoveryToken = searchParams.get('token'); // Supabase may use 'token' or check for a session
      const recoveryType = searchParams.get('type');
      
      // If the URL parameters indicate recovery (token is present)
      // AND we have successfully exchanged it for a session, 
      // redirect them to the dedicated password update page.
      if (session && recoveryType === 'recovery') {
        router.push("/auth/update-password"); // <-- NEW REDIRECT LOCATION
      } else {
        // For all other successful flows (sign-in, sign-up, OAuth), just go home
        router.push("/");
      }
    };
    handleAuthCallback();
  }, [router, searchParams]);

  return (
    <div className="main-content">
      <div className="container" style={{ textAlign: "center" }}>
        <p>Finalizing sign-in...</p> 
      </div>
    </div>
  );
}