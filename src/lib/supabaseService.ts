// src/lib/supabaseService.ts
import { createClient } from '@supabase/supabase-js';

// These must be set in your Vercel Environment Variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL or Service Key is not set in environment variables.');
}

// Note: This client has admin privileges.
// ONLY use it in server-side code (like API routes).
export const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});