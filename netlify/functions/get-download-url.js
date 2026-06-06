// /api/get-download-url
// Mints a short-lived (10 minute) Supabase signed URL for a specific file
// attached to a dpr_jobs row. Reports and audio overviews live in the
// dpr-reports bucket; original uploads live in dpr-uploads.
//
// Authorization:
//   kind = 'report' | 'audio'  → job owner OR admin
//   kind = 'upload'            → admin only (the client already has the
//                                original; only the operator needs the
//                                stored copy back for analysis)

import { requireProfile } from './_lib/auth.js';
import { errorResponse, httpError, json } from './_lib/response.js';
import { ValidationError } from './_lib/validation.js';

const EXPIRES_IN_SECONDS = 600; // 10 minutes

const VALID_KINDS = new Set(['report', 'audio', 'upload']);

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
    const forceDownload = Boolean(body.forceDownload);

    if (!Number.isFinite(jobId) || jobId <= 0) {
      throw new ValidationError('jobId is required.');
    }
    if (!VALID_KINDS.has(kind)) {
      throw new ValidationError(
        "kind must be 'report', 'audio', or 'upload'."
      );
    }

    const { user, profile, admin } = await requireProfile(request);
    const isAdmin = profile.role === 'admin';

    const { data: job, error: jobErr } = await admin
      .from('dpr_jobs')
      .select(
        'id, user_id, status, report_path, audio_path, upload_paths, project_name'
      )
      .eq('id', jobId)
      .maybeSingle();
    if (jobErr) throw httpError(500, 'Could not load job.');
    if (!job) throw httpError(404, 'Job not found.');

    const isOwner = job.user_id === user.id;

    // ---- Authorization per kind ------------------------------------
    if (kind === 'upload') {
      if (!isAdmin) {
        throw httpError(403, 'Only the operator can download source files.');
      }
    } else if (!isOwner && !isAdmin) {
      throw httpError(403, 'You do not have access to this job.');
    }

    // ---- Resolve bucket + path -------------------------------------
    let bucket;
    let path;
    let uploadIndex;
    if (kind === 'report') {
      bucket = 'dpr-reports';
      path = job.report_path;
    } else if (kind === 'audio') {
      bucket = 'dpr-reports';
      path = job.audio_path;
    } else {
      bucket = 'dpr-uploads';
      uploadIndex = Number(body.uploadIndex);
      if (!Number.isFinite(uploadIndex) || uploadIndex < 0) {
        throw new ValidationError(
          'uploadIndex is required when kind="upload".'
        );
      }
      const paths = Array.isArray(job.upload_paths) ? job.upload_paths : [];
      if (uploadIndex >= paths.length) {
        throw new ValidationError('uploadIndex is out of range.');
      }
      path = paths[uploadIndex];
    }

    if (!path) {
      throw httpError(
        404,
        `No ${kind} file is available for this job yet.`
      );
    }

    // ---- Mint the signed URL ---------------------------------------
    const { data: signed, error: signErr } = await admin.storage
      .from(bucket)
      .createSignedUrl(path, EXPIRES_IN_SECONDS, {
        download: forceDownload,
      });
    if (signErr || !signed?.signedUrl) {
      console.error('[get-download-url] sign error:', signErr);
      throw httpError(500, 'Could not generate download URL.');
    }

    // ---- Audit log -------------------------------------------------
    await admin.from('audit_log').insert({
      user_id: user.id,
      action: 'download_url_minted',
      metadata: {
        jobId,
        kind,
        bucket,
        path,
        uploadIndex,
        forceDownload,
        actorRole: profile.role,
      },
    });

    return json({
      signedUrl: signed.signedUrl,
      expiresAt: new Date(Date.now() + EXPIRES_IN_SECONDS * 1000).toISOString(),
      kind,
    });
  } catch (err) {
    return errorResponse(err);
  }
};

export const config = {
  path: '/api/get-download-url',
};
