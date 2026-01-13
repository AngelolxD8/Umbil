import { createBrowserClient } from '@supabase/ssr';

// This is the modern, safe way to create a client on the browser
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);