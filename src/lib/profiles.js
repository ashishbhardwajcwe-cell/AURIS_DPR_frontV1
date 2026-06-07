// Profile reads for the admin client-management view. RLS controls
// visibility — non-admin callers only see their own row.

import { supabase } from './supabase.js';

export async function listAllProfiles({ limit = 500 } = {}) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, company_name, contact_name, email, phone, role, status, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('[profiles] listAllProfiles error:', error);
    return [];
  }
  return data ?? [];
}

export async function getProfile(userId) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    console.error('[profiles] getProfile error:', error);
    return null;
  }
  return data;
}
