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
const ANALYTICS_TABLE = "app_analytics"; // For logging
const PDP_GOALS_KEY = "pdp_goals";

// --- Remote CPD Functions ---

/**
 * Fetches ALL CPD entries for the current logged-in user.
 * Used for PDP suggestions and Streak calculations.
 */
export async function getCPD(): Promise<CPDEntry[]> {
  // --- THIS IS THE FIX ---
  // We only select 'timestamp' and 'tags' instead of '*'
  // This is much faster as it avoids fetching large text fields.
  const { data, error } = await supabase
    .from(CPD_TABLE)
    .select("timestamp, tags") // <-- MODIFIED
    // Order by newest first
    .order("timestamp", { ascending: false }); 

  if (error) {
    console.error("Error fetching all CPD logs:", error);
    return [];
  }
  
  return data as CPDEntry[]; 
}

/**
 * NEW: Fetches a single page of CPD entries with server-side filtering and pagination.
 * Used by the main CPD log page.
 */
export async function getCPDPage(options: {
  page: number;
  limit: number;
  q?: string;
  tag?: string;
}): Promise<{ entries: CPDEntry[]; count: number; error: PostgrestError | null }> {
  
  const { page, limit, q, tag } = options;
  const from = page * limit;
  const to = from + limit - 1;

  // Start building the query. We request 'count' to get the total number of filtered items.
  let query = supabase
    .from(CPD_TABLE)
    .select('*', { count: 'exact' });

  // Add search filter (q)
  if (q) {
    // Searches 'question', 'answer', and 'reflection' columns
    query = query.or(`question.ilike.%${q}%,answer.ilike.%${q}%,reflection.ilike.%${q}%`);
  }

  // Add tag filter
  if (tag) {
    query = query.contains('tags', [tag]);
  }

  // Add ordering and pagination
  query = query
    .order("timestamp", { ascending: false })
    .range(from, to);

  // Execute the query
  const { data, error, count } = await query;

  return {
    entries: (data as CPDEntry[]) || [],
    count: count ?? 0,
    error,
  };
}


/**
 * Adds a new CPD entry to the remote database.
 */
export async function addCPD(entry: Omit<CPDEntry, 'id' | 'user_id'>): Promise<{ data: CPDEntry | null, error: PostgrestError | null }> {
  // Get user ID for analytics
  let userId: string | null = null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
    }
  } catch (e) {
    // --- FIX 3: Use the 'e' variable to fix the ESLint warning ---
    console.warn("Could not get user for analytics logging:", (e as Error).message);
  }

  const payload = {
    timestamp: entry.timestamp,
    question: entry.question,
    answer: entry.answer,
    reflection: entry.reflection || null, 
    tags: entry.tags || [],
    ...(userId && { user_id: userId }) // Add user_id if we have it
  };

  const { data, error } = await supabase
    .from(CPD_TABLE)
    .insert(payload)
    .select()
    .single();
    
  // Log analytics event on success
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
 * Clears all local data (PDP goals).
 */
export function clearAll() {
  if (!isBrowser) return;
  // Note: We leave the old cpd_log key here just in case a user has legacy data
  localStorage.removeItem("cpd_log"); 
  localStorage.removeItem(PDP_GOALS_KEY);
}