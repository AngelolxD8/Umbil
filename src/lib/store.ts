// src/lib/store.ts
import { supabase } from "@/lib/supabase";
import { type PostgrestError } from "@supabase/supabase-js";

// --- Types ---

export type CPDEntry = {
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
  user_id?: string; 
  title: string;
  timeline: string;
  activities: string[];
  created_at?: string; 
};

export type ChatHistoryItem = {
  id: string;
  question: string;
  answer?: string; 
  created_at: string;
};

const CPD_TABLE = "cpd_entries";
const HISTORY_TABLE = "chat_history";
const ANALYTICS_TABLE = "app_analytics";
const PDP_TABLE = "pdp_goals";

// --- Remote Functions (CPD) ---

// NEW: Robust fetcher for client-side filtering
export async function getAllLogs(): Promise<{ data: CPDEntry[]; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from(CPD_TABLE)
    .select('*')
    .order("timestamp", { ascending: false });

  if (error) { console.error("Error fetching all logs:", error); }
  return { data: (data as CPDEntry[]) || [], error };
}

export async function getCPD(): Promise<CPDEntry[]> {
  const { data, error } = await supabase
    .from(CPD_TABLE)
    .select("timestamp, tags") 
    .order("timestamp", { ascending: false }); 

  if (error) { console.error("Error fetching CPD:", error); return []; }
  return data as CPDEntry[]; 
}

export async function getCPDPage(options: { page: number; limit: number; q?: string; tag?: string; }): Promise<{ entries: CPDEntry[]; count: number; error: PostgrestError | null }> {
  const { page, limit, q, tag } = options;
  const from = page * limit;
  const to = from + limit - 1;

  let query = supabase.from(CPD_TABLE).select('*', { count: 'exact' });

  if (q) {
    query = query.or(`question.ilike.%${q}%,answer.ilike.%${q}%,reflection.ilike.%${q}%`);
  }
  
  // Fallback: using ilike is often more robust than contains for mixed column types (JSON/Text)
  if (tag) {
    query = query.ilike('tags', `%${tag}%`);
  }

  query = query.order("timestamp", { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  return { entries: (data as CPDEntry[]) || [], count: count ?? 0, error };
}

export async function deleteCPD(id: string): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase.from(CPD_TABLE).delete().eq('id', id);
  return { error };
}

export async function addCPD(entry: Omit<CPDEntry, 'id' | 'user_id'>): Promise<{ data: CPDEntry | null, error: PostgrestError | null }> {
  let userId: string | null = null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) userId = user.id;
  } catch (e) { console.warn((e as Error).message); }

  const payload = {
    timestamp: entry.timestamp,
    question: entry.question,
    answer: entry.answer,
    reflection: entry.reflection || null, 
    tags: entry.tags || [],
    ...(userId && { user_id: userId })
  };

  const { data, error } = await supabase.from(CPD_TABLE).insert(payload).select().single();
    
  if (!error && userId) {
    supabase.from(ANALYTICS_TABLE).insert({
        user_id: userId,
        event_type: 'cpd_saved',
        metadata: { has_reflection: !!entry.reflection, tag_count: entry.tags?.length || 0 }
      }).then(() => {});
  }
  return { data: data as CPDEntry | null, error };
}

// --- History Functions ---

export async function getChatHistory(): Promise<ChatHistoryItem[]> {
  const { data, error } = await supabase
    .from(HISTORY_TABLE)
    .select("id, question, created_at")
    .order("created_at", { ascending: false })
    .limit(50); // Increased limit to support "Show More" feature

  if (error) { console.error("Error fetching history:", error); return []; }
  return data as ChatHistoryItem[];
}

export async function getHistoryItem(id: string): Promise<ChatHistoryItem | null> {
  const { data, error } = await supabase
    .from(HISTORY_TABLE)
    .select("*") 
    .eq("id", id)
    .single();

  if (error) return null;
  return data as ChatHistoryItem;
}

// --- REMOTE PDP Functions ---

export async function getPDP(): Promise<PDPGoal[]> {
  const { data, error } = await supabase
    .from(PDP_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) { 
    console.error("Error fetching PDP:", error); 
    return []; 
  }
  return data as PDPGoal[];
}

export async function addPDP(goal: Omit<PDPGoal, 'id' | 'user_id'>): Promise<{ data: PDPGoal | null, error: PostgrestError | null }> {
  let userId: string | null = null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) userId = user.id;
  } catch (e) { console.warn((e as Error).message); }

  if (!userId) {
      return { 
          data: null, 
          error: { 
              message: "User not logged in", 
              hint: "", 
              details: "", 
              code: "401", 
              name: "AuthError" 
          } 
      };
  }

  const payload = {
    user_id: userId,
    title: goal.title,
    timeline: goal.timeline,
    activities: goal.activities,
  };

  const { data, error } = await supabase.from(PDP_TABLE).insert(payload).select().single();
  return { data: data as PDPGoal | null, error };
}

export async function deletePDP(id: string): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase.from(PDP_TABLE).delete().eq('id', id);
  return { error };
}

export function clearAll() {
  if (typeof window !== "undefined") {
      localStorage.removeItem("cpd_log"); 
      localStorage.removeItem("pdp_goals");
  }
}

// --- NEW: Device ID Utility for Analytics ---
export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server-side';
  
  let id = localStorage.getItem('umbil_device_id');
  if (!id) {
    // Use crypto.randomUUID if available, otherwise a simple fallback
    id = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `device_${Math.random().toString(36).slice(2)}_${Date.now()}`;
      
    localStorage.setItem('umbil_device_id', id);
  }
  return id;
}