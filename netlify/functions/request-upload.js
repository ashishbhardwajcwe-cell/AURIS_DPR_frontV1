// /api/request-upload
// Pre-flight for a DPR submission:
//   1. Authenticates the user (Bearer JWT) and confirms status='active'
//   2. Validates project name + file metadata + size caps + extensions
//   3. Confirms credit_balance(user) >= 1
//   4. Inserts the dpr_jobs row (status='submitted', credits_used=1)
//   5. Mints a Supabase signed upload URL for each file
//
// What it does NOT do:
//   - Touch file bytes (the browser uploads straight to storage)
//   - Parse, sniff, or sample the upload contents — ever
//   - Deduct the credit (that happens in /api/confirm-upload, only after
//     the browser reports a successful upload)

import { requireActiveClient } from './_lib/auth.js';
import { errorResponse, httpError, json } from './_lib/response.js';
import {
  safeFilename,
  validateFiles,
  ValidationError,
} from './_lib/validation.js';
import { estimateCredits, isValidBand } from './_lib/estimateCredits.js';

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

    const projectName = String(body.projectName || '').trim();
    const roadStretch = body.roadStretch
      ? String(body.roadStretch).trim()
      : null;
    const notes = body.notes ? String(body.notes).trim() : null;
    const files = Array.isArray(body.files) ? body.files : [];

    const lengthBand = body.lengthBand ? String(body.lengthBand) : 'standard';
    const packagesRaw = Number(body.packages);
    const packages = Number.isFinite(packagesRaw) && packagesRaw >= 1
      ? Math.floor(packagesRaw)
      : 1;
    const hasStructures = Boolean(body.hasStructures);

    if (!projectName) {
      throw new ValidationError('Project name is required.');
    }
    if (projectName.length > 200) {
      throw new ValidationError('Project name is too long (max 200 chars).');
    }
    if (!isValidBand(lengthBand)) {
      throw new ValidationError('Invalid road length band.');
    }

    validateFiles(files);

    // Server-side estimate is authoritative — never trust whatever the
    // client computed. Same helper, same inputs, same answer.
    const estimatedCredits = estimateCredits({
      lengthBand,
      packages,
      hasStructures,
    });

    const { user, admin } = await requireActiveClient(request);

    // Live balance read — defense in depth even though the client also
    // checks. The credit_balance() RPC is SECURITY DEFINER so the service
    // role can call it directly.
    const { data: balance, error: balErr } = await admin.rpc(
      'credit_balance',
      { uid: user.id }
    );
    if (balErr) throw httpError(500, 'Could not read credit balance.');
    if ((balance ?? 0) < estimatedCredits) {
      throw new ValidationError(
        `You don't have enough credits for this submission. Needs ${estimatedCredits}, have ${balance ?? 0}.`
      );
    }

    // Insert the job. We can't compute upload paths until we know the id,
    // so the paths column is filled in by an UPDATE right after.
    const { data: job, error: insertErr } = await admin
      .from('dpr_jobs')
      .insert({
        user_id: user.id,
        project_name: projectName,
        road_stretch: roadStretch,
        notes,
        status: 'submitted',
        credits_used: estimatedCredits,
        length_band: lengthBand,
        packages,
        has_structures: hasStructures,
      })
      .select('id')
      .single();
    if (insertErr || !job) {
      throw httpError(500, 'Could not create the job. Please try again.');
    }

    // Compute storage paths and mint signed upload URLs in parallel.
    // Convention: {user_id}/{job_id}/{safe_name}
    const filesOut = await Promise.all(
      files.map(async (f) => {
        const safeName = safeFilename(f.name);
        const path = `${user.id}/${job.id}/${safeName}`;
        const { data, error } = await admin.storage
          .from('dpr-uploads')
          .createSignedUploadUrl(path);
        if (error || !data?.signedUrl) {
          throw httpError(500, `Could not prepare upload for "${f.name}".`);
        }
        return {
          originalName: f.name,
          safeName,
          path,
          signedUrl: data.signedUrl,
          token: data.token,
          sizeBytes: Number(f.sizeBytes),
        };
      })
    );

    const paths = filesOut.map((f) => f.path);
    await admin
      .from('dpr_jobs')
      .update({ upload_paths: paths })
      .eq('id', job.id);

    return json({
      jobId: job.id,
      files: filesOut,
    });
  } catch (err) {
    return errorResponse(err);
  }
};

export const config = {
  path: '/api/request-upload',
};
