// src/app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getMyProfile, upsertMyProfile, Profile } from "@/lib/profile";
import { useUserEmail } from "@/hooks/useUser";
import { useRouter } from "next/navigation";

function getErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "An unknown error occurred.";
}

export default function ProfilePage() {
  const { email, loading: userLoading } = useUserEmail();
  const router = useRouter();

  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(true);

  useEffect(() => {
    if (!userLoading && !email) {
      router.push("/auth");
    }
  }, [userLoading, email, router]);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      const userProfile = await getMyProfile();
      if (userProfile) {
        setProfile(userProfile);
        setIsNewUser(false);
      }
      setLoading(false);
    };
    if (email) loadProfile();
  }, [email]);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      await upsertMyProfile(profile);
      setLoading(false);
      router.push("/");
    } catch (e: unknown) {
      setError(getErrorMessage(e));
      setLoading(false);
    }
  };

  if (userLoading || loading) return <p>Loading...</p>;

  return (
    <section className="main-content">
      <div className="container">
        <h2>{isNewUser ? "Complete Your Profile" : "Edit Profile"}</h2>
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card__body">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-control"
                type="text"
                value={profile.full_name || ""}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder="Dr. Rishika Pasupulate"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Position / Grade</label>
              <input
                className="form-control"
                type="text"
                value={profile.grade || ""}
                onChange={(e) => setProfile({ ...profile, grade: e.target.value })}
                placeholder="e.g., FY1 Doctor, GP Trainee"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Professional Body Number</label>
              <input
                className="form-control"
                type="text"
                value={profile.title || ""}
                onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                placeholder="e.g., GMC number"
              />
            </div>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <button className="btn btn--primary" onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}