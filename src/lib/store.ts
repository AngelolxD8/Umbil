// src/lib/store.ts
import { supabase } from "@/lib/supabase";
import { type PostgrestError } from "@supabase/supabase-js";

// ... (keep your CPDEntry and PDPGoal types)
export type CPDEntry = {
  // ...
  id?: string; 
  user_id?: string;
  timestamp: string;
  question: string;
  answer: string;
  reflection?: string;
  tags?: string[];
};

export type PDPGoal = {
  // ...
  id: string;
  title: string;
  timeline: string;
  activities: string[];
};

const CPD_TABLE = "cpd_entries";
const ANALYTICS_TABLE = "app_analytics"; // <-- DEFINE ANALYTICS TABLE
const PDP_GOALS_KEY = "pdp_goals";

// --- Remote CPD Functions ---

/**
 * Fetches all CPD entries... (keep existing function)
 */
export async function getCPD(): Promise<CPDEntry[]> {
  // ... (no changes to this function)
  const { data, error } = await supabase
    .from(CPD_TABLE)
    .select("*")
    .order("timestamp", { ascending: false }); 

  if (error) {
    console.error("Error fetching CPD log:", error);
    return [];
  }
  
  return data as CPDEntry[]; 
}

/**
 * Adds a new CPD entry to the remote database.
 */
export async function addCPD(entry: Omit<CPDEntry, 'id' | 'user_id'>): Promise<{ data: CPDEntry | null, error: PostgrestError | null }> {
  // --- ADDED: Get user ID for analytics ---
  let userId: string | null = null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
    }
  } catch (e) {
    console.warn("Could not get user for analytics logging.");
  }
  // ------------------------------------

  const payload = {
    timestamp: entry.timestamp,
    question: entry.question,
    answer: entry.answer,
    reflection: entry.reflection || null, 
    tags: entry.tags || [],
    // user_id is handled by RLS, but we need it for analytics
    ...(userId && { user_id: userId }) 
  };
  
  // Make sure to only insert fields your RLS policy/table expects
  // If user_id is NOT in your cpd_entries table, remove it from payload
  // (Assuming RLS handles it automatically and it's a column)
  const { data, error } = await supabase
    .from(CPD_TABLE)
    .insert(payload)
    .select()
    .single();
    
  // --- ADDED: Log analytics event on success ---
  if (!error && userId) {
    // We don't await this, let it run in the background.
    supabase
      .from(ANALYTICS_TABLE)
      .insert({
        user_id: userId,
        event_type: 'cpd_saved',
        metadata: {
          has_reflection: !!entry.reflection,
          tag_count: entry.tags?.length || 0
        }
      })
      .then(({ error: analyticsError }) => {
        if (analyticsError) {
          console.error("[Umbil] CPD Analytics log error:", analyticsError.message);
        }
      });
  }
  // ------------------------------------------
    
  return { data: data as CPDEntry | null, error };
}

// --- Local PDP Functions (Keep as-is) ---
// ...