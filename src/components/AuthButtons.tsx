"use client";

import Link from "next/link";
import { Profile } from "@/lib/profile";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getMyProfile } from "@/lib/profile";

type AuthButtonsProps = {
  userEmail: string | null;
  userProfile: Partial<Profile> | null;
  loading: boolean;
};

export default function AuthButtons({ userEmail, userProfile, loading }: AuthButtonsProps) {

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return <div className="user-profile"></div>;
  }

  if (userEmail) {
    return (
      <div className="user-profile">
        {userProfile?.full_name ? (
          <div className="profile-info">
            <span className="user-name">{userProfile.full_name}</span>
            {userProfile.grade && <span className="user-role">{userProfile.grade}</span>}
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