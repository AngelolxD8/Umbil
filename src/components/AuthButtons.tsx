// src/components/AuthButtons.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getMyProfile, Profile } from "@/lib/profile";
import Link from "next/link";

export default function AuthButtons() {
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Partial<Profile> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? null);
      if (data.user) {
        const userProfile = await getMyProfile();
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    };
    getSession();

    const { data: sub } = supabase.auth.onAuthStateChange(() => getSession());
    return () => sub?.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setEmail(null);
    setProfile(null);
  };

  if (loading) {
    return <div className="user-profile"></div>; // Or a simple loading spinner
  }

  if (email) {
    return (
      <div className="user-profile">
        {profile?.full_name ? (
          <div className="profile-info">
            <span className="user-name">{profile.full_name}</span>
            {profile.grade && <span className="user-role">{profile.grade}</span>}
          </div>
        ) : null}
        <button className="btn btn--outline" onClick={signOut}>Sign out</button>
      </div>
    );
  }

  return (
    <div className="user-profile">
      <a className="btn btn--primary" href="/auth">Sign in</a>
    </div>
  );
}