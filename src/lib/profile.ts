import { supabase } from "@/lib/supabase";

export type Profile = {
  id: string;
  full_name: string | null;
  title: string | null;
  grade: string | null;
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

  if (error) return null;
  return data as Profile;
}

export async function upsertMyProfile(p: Partial<Profile>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const payload = { id: user.id, ...p };
  const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
  if (error) throw error;
}
