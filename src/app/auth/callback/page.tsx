// src/app/auth/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // <-- IMPORT useSearchParams
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // <-- Initialize searchParams

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Step 1: Get the session (this also handles setting cookies for Supabase)
      const { data: { session } } = await supabase.auth.getSession();

      // Step 2: Check the URL for recovery type
      const type = searchParams.get('type');
      
      // If it was a password recovery event, redirect them to the profile page
      // where they can set their new password using the ResetPassword component.
      if (session && type === 'recovery') {
        router.push("/profile");
      } else {
        // For all other flows (sign-in, magic link, OAuth), just go home
        router.push("/");
      }
    };
    handleAuthCallback();
  }, [router, searchParams]); // <-- Add searchParams to dependency array

  return (
    <div className="main-content">
      <div className="container" style={{ textAlign: "center" }}>
        <p>Loading...</p>
      </div>
    </div>
  );
}