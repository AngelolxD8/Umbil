// src/lib/profile.ts
import { supabase } from "@/lib/supabase";

export type Profile = {
  id: string;
  full_name: string | null;
  grade: string | null;
  // title: string | null; // <-- This was correctly removed
  dob: string | null; // ISO date
};

export async function getMyProfile(): Promise<Profile | null> {
  const { data: { user }, error: uErr } = await supabase.auth.getUser();
  if (uErr || !user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    // --- FIX: Check if this is a new user from sign-up ---
    // The user exists in auth, but not in profiles yet.
    // We check 'user_metadata' (not 'raw_user_meta_data')
    if (user && user.user_metadata && user.user_metadata.grade) {
      return {
        id: user.id,
        full_name: user.user_metadata.full_name || null,
        grade: user.user_metadata.grade || null,
        dob: null,
      } as Profile;
    }
    return null;
  }
  return data as Profile;
}

export async function upsertMyProfile(p: Partial<Profile>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  
  // Ensure 'title' is not part of the payload
  const { title, ...payload } = { id: user.id, ...p } as any; // Use 'any' to safely destructure 'title' out
  
  const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
  if (error) throw error;
}