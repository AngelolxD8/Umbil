import { createClient } from '@supabase/supabase-js';

// Switched to standard createClient to prevent build errors in Server Routes.
// This client is safe for both Browser and Node.js environments.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);