// DPR Analyzer Pro — credit helpers.
// Reads only. All writes to credit_ledger happen server-side via Netlify
// Functions using the service-role key (per RLS — there is no INSERT policy).

import { supabase } from './supabase.js';

// Returns the live credit balance for a user. Calls the credit_balance(uid)
// SQL function created in Milestone 3 (defense in depth — the function also
// runs SECURITY DEFINER so it works regardless of the caller's ledger RLS).
export async function getCreditBalance(userId) {
  if (!supabase || !userId) return 0;
  const { data, error } = await supabase.rpc('credit_balance', { uid: userId });
  if (error) {
    console.error('[credits] getCreditBalance error:', error);
    return 0;
  }
  return typeof data === 'number' ? data : 0;
}

// Reads the per-row credit history for a user. Used by the Account screen
// and (later) the admin client-management view. RLS limits the caller to
// their own rows unless they are an admin.
export async function listCreditHistory(userId, { limit = 50 } = {}) {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase
    .from('credit_ledger')
    .select('id, delta, reason, dpr_job_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('[credits] listCreditHistory error:', error);
    return [];
  }
  return data ?? [];
}
