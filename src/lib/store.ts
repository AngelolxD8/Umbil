// src/lib/store.ts
import { supabase } from "@/lib/supabase";
import { type PostgrestError } from "@supabase/supabase-js";

// Type definition for CPD entries matching the new database table
export type CPDEntry = {
  // These fields are optional because they are database-generated/managed
  id?: string; 
  user_id?: string;
  timestamp: string;
  question: string;
  answer: string;
  reflection?: string;
  tags?: string[];
};

export type PDPGoal = {
  id: string;
  title: string;
  timeline: string;
  activities: string[];
};

const CPD_TABLE = "cpd_entries";
const PDP_GOALS_KEY = "pdp_goals";

// --- Remote CPD Functions ---

/**
 * Fetches all CPD entries for the current logged-in user from the remote database.
 * The RLS policy ensures only the user's data is returned.
 * @returns A promise that resolves to an array of CPD entries, or an empty array on error.
 */
export async function getCPD(): Promise<CPDEntry[]> {
  const { data, error } = await supabase
    .from(CPD_TABLE)
    .select("*")
    // Order by newest first, so the log feels correct
    .order("timestamp", { ascending: false }); 

  if (error) {
    console.error("Error fetching CPD log:", error);
    return [];
  }
  
  // The retrieved data matches CPDEntry structure
  return data as CPDEntry[]; 
}

/**
 * Adds a new CPD entry to the remote database.
 * The RLS policy automatically links the entry to the authenticated user.
 * @param entry - The CPD entry data (excluding DB-generated fields like id/user_id).
 * @returns An object containing the inserted entry data or an error object.
 */
export async function addCPD(entry: Omit<CPDEntry, 'id' | 'user_id'>): Promise<{ data: CPDEntry | null, error: PostgrestError | null }> {
  const payload = {
    timestamp: entry.timestamp,
    question: entry.question,
    answer: entry.answer,
    // Use null for empty optional fields for database cleanliness
    reflection: entry.reflection || null, 
    // Supabase can store a JSON array of strings
    tags: entry.tags || [],
  };

  const { data, error } = await supabase
    .from(CPD_TABLE)
    .insert(payload)
    .select() // Tells the API to return the newly inserted row
    .single(); // Expects one row back
    
  return { data: data as CPDEntry | null, error };
}

// --- Local PDP Functions (Kept in localStorage for simplicity) ---

const isBrowser = typeof window !== "undefined";

export function getPDP(): PDPGoal[] {
  if (!isBrowser) return [];
  return JSON.parse(localStorage.getItem(PDP_GOALS_KEY) || "[]");
}

export function savePDP(list: PDPGoal[]) {
  if (!isBrowser) return;
  localStorage.setItem(PDP_GOALS_KEY, JSON.stringify(list));
}

// --- Local Clear Function Update ---

/**
 * Clears all local data (PDP goals). Remote CPD deletion needs a dedicated, explicit API call.
 */
export function clearAll() {
  if (!isBrowser) return;
  // Note: We leave the old cpd_log key here just in case a user has legacy data
  localStorage.removeItem("cpd_log"); 
  localStorage.removeItem(PDP_GOALS_KEY);
}