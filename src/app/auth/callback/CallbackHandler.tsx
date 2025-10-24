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
      // 1. Get the session (this handles setting cookies for Supabase)
      const { data: { session } } = await supabase.auth.getSession();

      // 2. Check the URL for the recovery type
      const type = searchParams.get('type');
      
      // If it was a password recovery event AND the session is active,
      // redirect them to the /profile page to set their new password.
      if (session && type === 'recovery') {
        router.push("/profile");
      } else {
        // For all other successful flows (sign-in, sign-up), just go home
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