// /api/cancel-upload
// Called when a client abandons an upload (explicit Cancel button, or
// recovery from an error). Cleans up any partial files in storage and
// deletes the dpr_jobs row so the dashboard doesn't accumulate dead
// "submitted" entries.
//
// Hard guard: refuses to cancel a job that has already been confirmed
// (i.e., a 'dpr_submission' credit_ledger row exists). Confirmed jobs
// belong to the operator workflow — they don't get silently deleted.

import { requireActiveClient } from './_lib/auth.js';
import { errorResponse, httpError, json } from './_lib/response.js';
import { ValidationError } from './_lib/validation.js';

export default async (request) => {
  try {
    if (request.method !== 'POST') {
      throw httpError(405, 'Method not allowed.');
    }

    let body;
    try {
      body = await request.json();
    } catch {
      throw new ValidationError('Request body must be valid JSON.');
    }

    const jobId = Number(body.jobId);
    if (!Number.isFinite(jobId) || jobId <= 0) {
      throw new ValidationError('jobId is required.');
    }

    const { user, admin } = await requireActiveClient(request);

    const { data: job, error: jobErr } = await admin
      .from('dpr_jobs')
      .select('id, user_id, status, upload_paths')
      .eq('id', jobId)
      .maybeSingle();
    if (jobErr) throw httpError(500, 'Could not load job.');
    if (!job) throw httpError(404, 'Job not found.');
    if (job.user_id !== user.id) {
      throw httpError(403, 'You do not own this job.');
    }
    if (job.status !== 'submitted') {
      throw httpError(
        409,
        `Cannot cancel a job that is already "${job.status}".`
      );
    }

    // Hard stop: a confirmed job has a credit deducted and is in the
    // operator's queue. We refuse to delete it silently.
    const { data: existingLedger, error: ledgerErr } = await admin
      .from('credit_ledger')
      .select('id')
      .eq('dpr_job_id', jobId)
      .eq('reason', 'dpr_submission')
      .maybeSingle();
    if (ledgerErr) throw httpError(500, 'Could not read ledger.');
    if (existingLedger) {
      throw httpError(
        409,
        'This submission has already been confirmed and cannot be cancelled here.'
      );
    }

    // Best-effort cleanup of any objects that did land in storage. The
    // Supabase remove() returns an array of removed objects and is
    // idempotent — missing paths are simply skipped.
    const paths = Array.isArray(job.upload_paths) ? job.upload_paths : [];
    if (paths.length > 0) {
      const { error: removeErr } = await admin.storage
        .from('dpr-uploads')
        .remove(paths);
      if (removeErr) {
        // Log but don't abort — orphans get reaped by the retention job
        // (Milestone 10). The point of cancel is to make the dashboard
        // tidy; storage drift is acceptable.
        console.warn('[cancel-upload] partial cleanup:', removeErr);
      }
    }

    await admin.from('audit_log').insert({
      user_id: user.id,
      action: 'upload_cancelled',
      metadata: { jobId, pathCount: paths.length },
    });

    const { error: delErr } = await admin
      .from('dpr_jobs')
      .delete()
      .eq('id', jobId);
    if (delErr) throw httpError(500, 'Could not delete the job.');

    return json({ ok: true, removedPaths: paths.length });
  } catch (err) {
    return errorResponse(err);
  }
};

export const config = {
  path: '/api/cancel-upload',
};
