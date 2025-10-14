// src/components/AuthButtons.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getMyProfile, Profile } from "@/lib/profile";
import Link from "next/link";

export default function AuthButtons() {
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Partial<Profile> | null>(null);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? null);
      if (data.user) {
        const userProfile = await getMyProfile();
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
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

  if (email) {
    return (
      <div className="user-profile">
        {profile?.full_name ? (
          <div style={{ textAlign: 'right' }}>
            <span style={{ display: 'block', fontWeight: 'bold' }}>{profile.full_name}</span>
            {profile.grade && <span style={{ display: 'block', fontSize: '0.8rem', color: '#666' }}>{profile.grade}</span>}
          </div>
        ) : (
          <Link href="/profile" className="btn btn--outline">Complete Profile</Link>
        )}
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