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

// Bulk balance fetch for the admin client-management view. Aggregates
// client-side so we don't need a per-user RPC roundtrip; for the
// expected scale (10s–100s of firms) this is fine.
export async function getBalancesForUsers(userIds) {
  if (!supabase || !Array.isArray(userIds) || userIds.length === 0) return {};
  const { data, error } = await supabase
    .from('credit_ledger')
    .select('user_id, delta')
    .in('user_id', userIds);
  if (error) {
    console.error('[credits] getBalancesForUsers error:', error);
    return {};
  }
  const map = {};
  for (const row of data ?? []) {
    map[row.user_id] = (map[row.user_id] ?? 0) + row.delta;
  }
  return map;
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
