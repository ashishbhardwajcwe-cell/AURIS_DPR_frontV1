// DPR Analyzer Pro — DPR job helpers.
// Browser-side reads only. INSERTs come from the request-upload Netlify
// Function (so we can also issue signed upload URLs in the same call);
// status UPDATEs come from the admin UI which is also gated by RLS.

import { supabase } from './supabase.js';

export const JOB_STATUS = Object.freeze({
  SUBMITTED: 'submitted',
  IN_REVIEW: 'in_review',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
});

// Friendly labels + colors for status badges. Keep aligned with theme.js.
export const STATUS_META = {
  submitted:  { label: 'Submitted',  color: '#64748B' },
  in_review:  { label: 'In Review',  color: '#D97706' },
  completed:  { label: 'Completed',  color: '#10B981' },
  failed:     { label: 'Failed',     color: '#DC2626' },
  cancelled:  { label: 'Cancelled',  color: '#94A3B8' },
};

export async function listJobsForUser(userId, { limit = 50 } = {}) {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase
    .from('dpr_jobs')
    .select(
      'id, project_name, road_stretch, status, credits_used, total_size_bytes, submitted_at, completed_at, report_path, audio_path, operator_summary'
    )
    .eq('user_id', userId)
    .order('submitted_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('[jobs] listJobsForUser error:', error);
    return [];
  }
  return data ?? [];
}

export async function getJob(jobId) {
  if (!supabase || !jobId) return null;
  const { data, error } = await supabase
    .from('dpr_jobs')
    .select('*')
    .eq('id', jobId)
    .maybeSingle();
  if (error) {
    console.error('[jobs] getJob error:', error);
    return null;
  }
  return data;
}

// Subscribes to live changes on a single user's jobs (status flips, new
// uploads, report availability). Returns the unsubscribe function.
export function subscribeToUserJobs(userId, onChange) {
  if (!supabase || !userId) return () => {};
  const channel = supabase
    .channel(`dpr_jobs:user:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'dpr_jobs',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => onChange?.(payload)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Subscribes to live changes on one specific job. Works for both job
// owners and admins viewing another firm's job — the filter is by job
// id, not by user.
export function subscribeToJob(jobId, onChange) {
  if (!supabase || !jobId) return () => {};
  const channel = supabase
    .channel(`dpr_jobs:job:${jobId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'dpr_jobs',
        filter: `id=eq.${jobId}`,
      },
      (payload) => onChange?.(payload)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
