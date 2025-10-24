// src/app/auth/callback/CallbackHandler.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

// This component uses client-side hooks and must be wrapped in <Suspense>
export default function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams(); 

  useEffect(() => {
    const handleAuthCallback = async () => {
      // 1. Get the session (this handles setting cookies for Supabase)
      const { data: { session } } = await supabase.auth.getSession();

      // 2. Check URL parameters
      // Removed unused 'recoveryToken' to fix the ESLint warning.
      const recoveryType = searchParams.get('type');
      
      // If the URL parameters indicate recovery (type is 'recovery')
      // AND we have successfully exchanged it for a session, 
      // redirect them to the dedicated password update page.
      if (session && recoveryType === 'recovery') {
        router.push("/auth/update-password"); 
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