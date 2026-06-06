// /api/confirm-upload
// Called by the browser after every file is successfully in storage.
//   1. Authenticates the user (Bearer JWT) and confirms they own the job
//   2. Idempotently deducts 1 credit (skip if a 'dpr_submission' ledger row
//      already exists for this job — protects against double-fire)
//   3. Stamps total_size_bytes on the job
//   4. Writes an audit log row
//
// Milestone 8 will extend this to also send the operator notification email
// via Resend and fire the optional Make.com webhook.

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
    const totalSizeBytes = Number(body.totalSizeBytes);

    if (!Number.isFinite(jobId) || jobId <= 0) {
      throw new ValidationError('jobId is required.');
    }
    if (!Number.isFinite(totalSizeBytes) || totalSizeBytes < 0) {
      throw new ValidationError('totalSizeBytes is required.');
    }

    const { user, admin } = await requireActiveClient(request);

    // Verify the job belongs to this user.
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

    // Idempotency: if a credit deduction already exists for this job,
    // treat it as already confirmed.
    const { data: existing, error: existsErr } = await admin
      .from('credit_ledger')
      .select('id')
      .eq('dpr_job_id', jobId)
      .eq('reason', 'dpr_submission')
      .maybeSingle();
    if (existsErr) throw httpError(500, 'Could not read ledger.');

    if (existing) {
      return json({ ok: true, alreadyConfirmed: true });
    }

    // Atomic-ish sequence: ledger row, then job update, then audit log.
    // Postgres doesn't give us a single transaction here, but the ledger
    // INSERT is the only step that materially affects the user; if any of
    // the others fails we still want the deduction to stand.
    const { error: ledgerErr } = await admin.from('credit_ledger').insert({
      user_id: user.id,
      delta: -1,
      reason: 'dpr_submission',
      dpr_job_id: jobId,
    });
    if (ledgerErr) {
      throw httpError(500, 'Could not deduct credit.');
    }

    await admin
      .from('dpr_jobs')
      .update({ total_size_bytes: totalSizeBytes })
      .eq('id', jobId);

    await admin.from('audit_log').insert({
      user_id: user.id,
      action: 'dpr_submitted',
      metadata: {
        jobId,
        totalSizeBytes,
        fileCount: Array.isArray(job.upload_paths)
          ? job.upload_paths.length
          : null,
      },
    });

    return json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
};

export const config = {
  path: '/api/confirm-upload',
};
