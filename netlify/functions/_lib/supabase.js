// Shared admin Supabase client for Netlify Functions.
// Uses the service-role key, which lives only in the function environment
// (never in the browser bundle, never in the repo).

import { createClient } from '@supabase/supabase-js';

let cached = null;

export function getAdminClient() {
  if (cached) return cached;

  const url =
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    const err = new Error(
      'Supabase environment variables are not configured. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Netlify.'
    );
    err.statusCode = 500;
    throw err;
  }

  cached = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}

export function getSupabaseUrl() {
  return process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
}
