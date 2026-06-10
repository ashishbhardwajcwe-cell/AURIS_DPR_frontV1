// /api/confirm-upload
// Called by the browser after every file is successfully in storage.
//   1. Authenticates the user (Bearer JWT) and confirms they own the job
//   2. Calls the confirm_dpr_submission RPC, which atomically (in one
//      transaction, under a per-user advisory lock): re-checks the
//      idempotency guard, re-checks the balance, deducts credits_used,
//      and stamps total_size_bytes on the job
//   3. Writes an audit log row
//   4. Fires the operator notification email (Resend) + optional Make
//      webhook — both best-effort, never roll back the deduction

import { requireActiveClient } from './_lib/auth.js';
import { errorResponse, httpError, json } from './_lib/response.js';
import { ValidationError } from './_lib/validation.js';
import { sendEmail, fireMakeWebhook } from './_lib/email.js';
import { operatorNewUploadTemplate } from './_lib/templates.js';

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

    const { user, profile, admin } = await requireActiveClient(request);

    // Verify the job belongs to this user.
    const { data: job, error: jobErr } = await admin
      .from('dpr_jobs')
      .select(
        'id, user_id, status, upload_paths, project_name, road_stretch, notes, credits_used'
      )
      .eq('id', jobId)
      .maybeSingle();
    if (jobErr) throw httpError(500, 'Could not load job.');
    if (!job) throw httpError(404, 'Job not found.');
    if (job.user_id !== user.id) {
      throw httpError(403, 'You do not own this job.');
    }

    // Atomic deduction via the confirm_dpr_submission RPC: idempotency
    // check, balance re-check, ledger insert, and total_size stamp all run
    // in one transaction under a per-user advisory lock, so two concurrent
    // submissions can't both pass the balance check.
    const { data: result, error: rpcErr } = await admin.rpc(
      'confirm_dpr_submission',
      {
        p_user_id: user.id,
        p_job_id: jobId,
        p_total_size_bytes: totalSizeBytes,
      }
    );
    if (rpcErr) throw httpError(500, 'Could not deduct credit.');

    if (result?.status === 'already_confirmed') {
      return json({ ok: true, alreadyConfirmed: true });
    }
    if (result?.status === 'insufficient_credits') {
      throw new ValidationError(
        `You no longer have enough credits for this submission. Needs ${result.required}, have ${result.balance}. Please top up and try again.`
      );
    }
    if (result?.status !== 'ok') {
      throw httpError(500, 'Could not confirm the submission.');
    }
    const creditsToDeduct = result.credits_deducted;

    const fileCount = Array.isArray(job.upload_paths)
      ? job.upload_paths.length
      : 0;

    await admin.from('audit_log').insert({
      user_id: user.id,
      action: 'dpr_submitted',
      metadata: { jobId, totalSizeBytes, fileCount, creditsDeducted: creditsToDeduct },
    });

    // ---- Notifications (best-effort) -------------------------------
    // We deliberately await these so the audit_log entry for the email
    // outcome lands in the same response. If either fails, the function
    // still returns ok:true — the credit has already been deducted.
    const operatorEmail = process.env.OPERATOR_EMAIL;
    const appUrl = process.env.VITE_APP_URL || process.env.URL;

    let emailResult = { skipped: true };
    if (operatorEmail) {
      const tmpl = operatorNewUploadTemplate({
        profile,
        job,
        fileCount,
        totalSizeBytes,
        appUrl,
      });
      emailResult = await sendEmail({
        to: operatorEmail,
        subject: tmpl.subject,
        html: tmpl.html,
        text: tmpl.text,
        replyTo: profile.email,
      });
    } else {
      console.log('[confirm-upload] OPERATOR_EMAIL not set; skipping email');
    }

    const webhookResult = await fireMakeWebhook({
      event: 'dpr_submitted',
      jobId,
      userId: user.id,
      companyName: profile.company_name,
      contactName: profile.contact_name,
      email: profile.email,
      projectName: job.project_name,
      roadStretch: job.road_stretch,
      fileCount,
      totalSizeBytes,
      uploadPaths: job.upload_paths,
      adminUrl: appUrl ? `${appUrl.replace(/\/$/, '')}/jobs/${jobId}` : null,
    });

    // Best-effort secondary audit row — useful for "did the operator
    // actually get the email?" debugging without scraping Resend logs.
    await admin.from('audit_log').insert({
      user_id: user.id,
      action: 'operator_notified',
      metadata: {
        jobId,
        email: { sent: emailResult.ok, skipped: !!emailResult.skipped },
        webhook: { sent: webhookResult.ok, skipped: !!webhookResult.skipped },
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
