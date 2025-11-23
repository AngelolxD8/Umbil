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
  title: string;
  timeline: string;
  activities: string[];
};

// UPDATED: Include answer
export type ChatHistoryItem = {
  id: string;
  question: string;
  answer?: string; 
  created_at: string;
};

const CPD_TABLE = "cpd_entries";
const HISTORY_TABLE = "chat_history";
const ANALYTICS_TABLE = "app_analytics";
const PDP_GOALS_KEY = "pdp_goals";

// --- Remote Functions ---

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

  if (q) query = query.or(`question.ilike.%${q}%,answer.ilike.%${q}%,reflection.ilike.%${q}%`);
  if (tag) query = query.contains('tags', [tag]);

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
  // We only select ID and Question for the list to keep it light
  const { data, error } = await supabase
    .from(HISTORY_TABLE)
    .select("id, question, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) { console.error("Error fetching history:", error); return []; }
  return data as ChatHistoryItem[];
}

// NEW: Fetch full details (Question + Answer) for a single item
export async function getHistoryItem(id: string): Promise<ChatHistoryItem | null> {
  const { data, error } = await supabase
    .from(HISTORY_TABLE)
    .select("*") // Selects answer too
    .eq("id", id)
    .single();

  if (error) return null;
  return data as ChatHistoryItem;
}

// --- Local PDP Functions ---

const isBrowser = typeof window !== "undefined";

export function getPDP(): PDPGoal[] {
  if (!isBrowser) return [];
  return JSON.parse(localStorage.getItem(PDP_GOALS_KEY) || "[]");
}

export function savePDP(list: PDPGoal[]) {
  if (!isBrowser) return;
  localStorage.setItem(PDP_GOALS_KEY, JSON.stringify(list));
}

export function clearAll() {
  if (!isBrowser) return;
  localStorage.removeItem("cpd_log"); 
  localStorage.removeItem(PDP_GOALS_KEY);
}