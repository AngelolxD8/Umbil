"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getMyProfile, Profile } from "@/lib/profile";
import Link from "next/link";

export default function AuthButtons() {
  const [user, setUser] = useState<{ email: string | null; profile: Partial<Profile> | null }>({
    email: null,
    profile: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // For all auth state changes, re-fetch user and profile to ensure consistency
      handleAuthChange();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser({ email: null, profile: null });
  };

  if (loading) {
    // Return a simple loading state or an empty div to prevent layout shift
    return <div className="user-profile"></div>;
  }

  if (user.email) {
    return (
      <div className="user-profile">
        {user.profile?.full_name ? (
          <div className="profile-info">
            <span className="user-name">{user.profile.full_name}</span>
            {user.profile.grade && <span className="user-role">{user.profile.grade}</span>}
          </div>
        ) : null}
        <button className="btn btn--primary" onClick={signOut}>Sign out</button>
      </div>
    );
  }

  return (
    <div className="user-profile">
      <a className="btn btn--primary" href="/auth">Sign in</a>
    </div>
  );
}