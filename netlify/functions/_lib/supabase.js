// Shared admin Supabase client for Netlify Functions.
// Uses the service-role key, which lives only in the function environment
// (never in the browser bundle, never in the repo).
//
// We import `ws` and hand it to the realtime client as the WebSocket
// transport. Without this, @supabase/realtime-js throws
//   "Node.js 20 detected without native WebSocket support"
// at createClient() construction time on Node runtimes that don't ship
// a global WebSocket (Node < 22 / Netlify Functions). Passing `ws`
// satisfies the transport requirement on every Node version we'd ever
// see, so the fix doesn't depend on the build- or runtime- Node
// version being just right.

import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

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
    realtime: {
      // Functions never subscribe to channels — they only use storage +
      // postgres. But supabase-js eagerly constructs RealtimeClient
      // anyway, so we have to give it a transport.
      transport: WebSocket,
    },
  });
  return cached;
}

export function getSupabaseUrl() {
  return process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
}
