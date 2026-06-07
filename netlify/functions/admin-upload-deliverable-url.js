// /api/admin/upload-deliverable-url
// Admin mints a Supabase signed upload URL for the report PDF or audio
// MP3 they're about to push into dpr-reports/{user_id}/{job_id}/...
//
// We don't update the dpr_jobs row here — that happens in
// /api/admin/save-job once the upload has succeeded. Keeping the two
// separate means a failed upload doesn't leave a stale path on the job.

import { requireAdmin } from './_lib/auth.js';
import { errorResponse, httpError, json } from './_lib/response.js';
import { safeFilename, ValidationError } from './_lib/validation.js';

const VALID_KINDS = new Set(['report', 'audio']);

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
    const kind = String(body.kind || '');
    const rawFilename = body.filename || '';

    if (!Number.isFinite(jobId) || jobId <= 0) {
      throw new ValidationError('jobId is required.');
    }
    if (!VALID_KINDS.has(kind)) {
      throw new ValidationError("kind must be 'report' or 'audio'.");
    }
    if (!rawFilename || typeof rawFilename !== 'string') {
      throw new ValidationError('filename is required.');
    }

    const { admin } = await requireAdmin(request);

    const { data: job, error: jobErr } = await admin
      .from('dpr_jobs')
      .select('id, user_id')
      .eq('id', jobId)
      .maybeSingle();
    if (jobErr) throw httpError(500, 'Could not load job.');
    if (!job) throw httpError(404, 'Job not found.');

    const safe = safeFilename(rawFilename);
    // Convention: {user_id}/{job_id}/{kind}-{safe_name}
    // The kind prefix ensures the report and audio never collide.
    const path = `${job.user_id}/${job.id}/${kind}-${safe}`;

    const { data: signed, error: signErr } = await admin.storage
      .from('dpr-reports')
      .createSignedUploadUrl(path);
    if (signErr || !signed?.signedUrl) {
      console.error('[upload-deliverable-url] sign error:', signErr);
      throw httpError(500, 'Could not mint upload URL.');
    }

    return json({
      path,
      signedUrl: signed.signedUrl,
      token: signed.token,
      kind,
    });
  } catch (err) {
    return errorResponse(err);
  }
};

export const config = {
  path: '/api/admin/upload-deliverable-url',
};
