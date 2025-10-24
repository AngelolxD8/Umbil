// src/hooks/useUser.ts
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useUserEmail() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true; // Flag to prevent state update on unmounted component

    const init = async () => {
      // 1. Initial check: This must run once to pull the session from storage
      const { data } = await supabase.auth.getUser();
      if (isMounted) {
        setEmail(data.user?.email ?? null);
        setLoading(false);
      }
    };
    
    // 2. Subscribe to *future* auth events
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (isMounted) {
        // Use the session or re-run getUser to ensure we get the latest data
        setEmail(session?.user?.email ?? null);
        setLoading(false); // Make sure loading is false after any auth event
      }
    });

    init();

    // Cleanup function: Unsubscribe from auth changes and set the flag
    return () => {
      isMounted = false;
      sub?.subscription.unsubscribe();
    };
  }, []);

  return { email, loading };
}