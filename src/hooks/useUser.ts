"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useUserEmail() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? null);
      setLoading(false);
    };
    init();
    const { data: sub } = supabase.auth.onAuthStateChange(() => init());
    return () => sub?.subscription.unsubscribe();
  }, []);

  return { email, loading };
}
