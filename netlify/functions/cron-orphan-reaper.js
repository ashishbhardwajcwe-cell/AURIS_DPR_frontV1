// Nightly orphan sweep.
// Deletes "submitted" dpr_jobs rows that are older than ORPHAN_AGE_HOURS
// (default 24) AND have no corresponding 'dpr_submission' credit_ledger
// entry — i.e., uploads the user abandoned before /api/confirm-upload ran.
// The user's /api/cancel-upload endpoint already handles the active case;
// this cron is the safety net for browser closes, dropped connections, etc.
//
// Confirmed jobs (status=submitted but with a deducted credit) are left
// alone — they belong to the operator queue, not this sweep.
//
// Schedule: 02:30 UTC daily.

import { getAdminClient } from './_lib/supabase.js';

const DEFAULT_ORPHAN_AGE_HOURS = 24;

export default async () => {
  const ageHours =
    Number(process.env.ORPHAN_AGE_HOURS) || DEFAULT_ORPHAN_AGE_HOURS;
  const cutoffIso = new Date(
    Date.now() - ageHours * 60 * 60 * 1000
  ).toISOString();

  let admin;
  try {
    admin = getAdminClient();
  } catch (err) {
    console.error('[cron-orphan-reaper] supabase not configured:', err.message);
    return new Response('not configured', { status: 200 });
  }

  const { data: candidates, error } = await admin
    .from('dpr_jobs')
    .select('id, user_id, upload_paths, submitted_at')
    .eq('status', 'submitted')
    .lt('submitted_at', cutoffIso)
    .limit(200);

  if (error) {
    console.error('[cron-orphan-reaper] query error:', error);
    return new Response('query failed', { status: 500 });
  }

  let reaped = 0;
  let confirmedSkipped = 0;
  let removedFiles = 0;
  const errors = [];

  for (const job of candidates ?? []) {
    // Skip if confirmed (has a credit deduction)
    const { data: ledger } = await admin
      .from('credit_ledger')
      .select('id')
      .eq('dpr_job_id', job.id)
      .eq('reason', 'dpr_submission')
      .maybeSingle();
    if (ledger) {
      confirmedSkipped += 1;
      continue;
    }

    const paths = Array.isArray(job.upload_paths) ? job.upload_paths : [];
    if (paths.length > 0) {
      const { error: remErr } = await admin.storage
        .from('dpr-uploads')
        .remove(paths);
      if (remErr) {
        errors.push({ jobId: job.id, step: 'remove-files', err: remErr.message });
      } else {
        removedFiles += paths.length;
      }
    }

    const { error: delErr } = await admin
      .from('dpr_jobs')
      .delete()
      .eq('id', job.id);
    if (delErr) {
      errors.push({ jobId: job.id, step: 'delete-job', err: delErr.message });
      continue;
    }
    reaped += 1;
  }

  await admin.from('audit_log').insert({
    user_id: null,
    action: 'cron_orphan_reaper',
    metadata: {
      orphanAgeHours: ageHours,
      cutoff: cutoffIso,
      candidates: candidates?.length ?? 0,
      reaped,
      confirmedSkipped,
      removedFiles,
      errors,
    },
  });

  const summary = `[cron-orphan-reaper] ageHrs=${ageHours} candidates=${candidates?.length ?? 0} reaped=${reaped} confirmedSkipped=${confirmedSkipped} files=${removedFiles} errors=${errors.length}`;
  console.log(summary);
  return new Response(summary, { status: 200 });
};

export const config = {
  schedule: '30 2 * * *', // 02:30 UTC daily
};
