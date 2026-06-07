// Nightly retention sweep.
// For every job that was closed (status = completed | failed) more than
// RETENTION_DAYS (default 30) days ago, deletes the underlying objects
// from both buckets and clears the path columns. The dpr_jobs row, the
// credit_ledger row, and the audit_log entries all survive — only the
// raw files are purged.
//
// Schedule: 02:00 UTC daily.
//
// Manually testable with:  netlify functions:invoke cron-retention

import { getAdminClient } from './_lib/supabase.js';

const DEFAULT_RETENTION_DAYS = 30;

export default async () => {
  const days = Number(process.env.RETENTION_DAYS) || DEFAULT_RETENTION_DAYS;
  const cutoffIso = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000
  ).toISOString();

  let admin;
  try {
    admin = getAdminClient();
  } catch (err) {
    console.error('[cron-retention] supabase not configured:', err.message);
    return new Response('not configured', { status: 200 });
  }

  // Pull a bounded batch so a single run is predictable. Re-runs keep
  // catching up if there's a backlog.
  const { data: jobs, error } = await admin
    .from('dpr_jobs')
    .select(
      'id, user_id, upload_paths, report_path, audio_path, completed_at, status'
    )
    .in('status', ['completed', 'failed'])
    .lt('completed_at', cutoffIso)
    .or('upload_paths.not.is.null,report_path.not.is.null,audio_path.not.is.null')
    .limit(200);

  if (error) {
    console.error('[cron-retention] query error:', error);
    return new Response('query failed', { status: 500 });
  }

  let touchedJobs = 0;
  let removedUploads = 0;
  let removedReports = 0;
  const errors = [];

  for (const job of jobs ?? []) {
    const uploadPaths = Array.isArray(job.upload_paths) ? job.upload_paths : [];
    const reportPaths = [job.report_path, job.audio_path].filter(Boolean);

    if (uploadPaths.length > 0) {
      const { error: remErr } = await admin.storage
        .from('dpr-uploads')
        .remove(uploadPaths);
      if (remErr) {
        errors.push({ jobId: job.id, bucket: 'dpr-uploads', err: remErr.message });
      } else {
        removedUploads += uploadPaths.length;
      }
    }
    if (reportPaths.length > 0) {
      const { error: remErr } = await admin.storage
        .from('dpr-reports')
        .remove(reportPaths);
      if (remErr) {
        errors.push({ jobId: job.id, bucket: 'dpr-reports', err: remErr.message });
      } else {
        removedReports += reportPaths.length;
      }
    }

    const { error: updErr } = await admin
      .from('dpr_jobs')
      .update({
        upload_paths: null,
        report_path: null,
        audio_path: null,
      })
      .eq('id', job.id);
    if (updErr) {
      errors.push({ jobId: job.id, step: 'clear-paths', err: updErr.message });
      continue;
    }
    touchedJobs += 1;
  }

  await admin.from('audit_log').insert({
    user_id: null,
    action: 'cron_retention',
    metadata: {
      retentionDays: days,
      cutoff: cutoffIso,
      candidates: jobs?.length ?? 0,
      touchedJobs,
      removedUploads,
      removedReports,
      errors,
    },
  });

  const summary = `[cron-retention] days=${days} candidates=${jobs?.length ?? 0} touched=${touchedJobs} uploadFiles=${removedUploads} reportFiles=${removedReports} errors=${errors.length}`;
  console.log(summary);
  return new Response(summary, { status: 200 });
};

export const config = {
  schedule: '0 2 * * *', // 02:00 UTC daily
};
