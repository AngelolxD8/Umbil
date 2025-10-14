// src/app/auth/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      await supabase.auth.getSession();
      router.push("/");
    };
    handleAuthCallback();
  }, [router]);

  return (
    <div className="main-content">
      <div className="container" style={{ textAlign: "center" }}>
        <p>Loading...</p>
      </div>
    </div>
  );
}