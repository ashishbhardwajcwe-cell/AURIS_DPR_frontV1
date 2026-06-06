// DPR Analyzer Pro — browser Supabase client.
// The anon key is safe to expose; RLS in Postgres is what actually protects data.
// The service-role key is NEVER imported here — it lives only in Netlify Functions.

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// During early scaffolding the env vars may be empty. We export `null` instead
// of throwing so the public pages still render, and the auth screens detect
// missing config and show a friendly notice.
export const supabase =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

export const isSupabaseConfigured = () => Boolean(supabase);
