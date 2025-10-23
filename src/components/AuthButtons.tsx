// src/components/AuthButtons.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getMyProfile, Profile } from "@/lib/profile";

export default function AuthButtons() {
  const [user, setUser] = useState<{ email: string | null; profile: Partial<Profile> | null }>({
    email: null,
    profile: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Function to fetch the user and their profile data from Supabase
    const handleAuthChange = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const userProfile = await getMyProfile();
        setUser({ email: user.email ?? null, profile: userProfile });
      } else {
        setUser({ email: null, profile: null });
      }
      setLoading(false);
    };

    handleAuthChange();
    
    // Subscribe to auth state changes to keep the UI in sync
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      handleAuthChange();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // We are moving the sign-out functionality and profile display to MobileNav
  // so we no longer need the signOut function here.
  
  if (loading) {
    // Return an empty div to reserve space/prevent layout shift during load
    return <div className="user-profile"></div>;
  }

  if (user.email) {
    // If signed in, return an empty fragment. The Sign out button is now in MobileNav.
    return <></>; 
  }

  // If signed out, return the Sign in button
  return (
    <div className="user-profile">
      <a className="btn btn--primary" href="/auth">Sign in</a>
    </div>
  );
}