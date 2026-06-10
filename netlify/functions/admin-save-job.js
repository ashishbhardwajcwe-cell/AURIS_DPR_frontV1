// /api/admin/save-job
// Admin-only endpoint that the operator UI calls to persist all changes
// to a job in one shot: status, operator summary, and the report/audio
// paths after a deliverable upload.
//
// Side effects baked in (so the admin UI can't forget):
//   - Status flip → 'completed' or 'failed' stamps completed_at
//   - finalCredits ≠ credits_used → the admin_set_job_credits RPC writes
//     a signed band_adjustment ledger row and updates credits_used in
//     one transaction
//   - Status flip → 'failed' (from anything else) refunds the charged
//     credits via the admin_refund_job RPC (atomic + idempotent)
//   - Status flip → 'completed' AND notify=true sends the client
//     "report is ready" email via Resend (best-effort, never rolls
//     back the status change)

import { requireAdmin } from './_lib/auth.js';
import { errorResponse, httpError, json } from './_lib/response.js';
import { ValidationError } from './_lib/validation.js';
import { sendEmail } from './_lib/email.js';
import { clientReportReadyTemplate } from './_lib/templates.js';

const VALID_STATUSES = new Set([
  'submitted',
  'in_review',
  'completed',
  'failed',
  'cancelled',
]);

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

    // Validate status up-front so bad input is rejected before we
    // round-trip to the DB.
    if (body.status !== undefined && body.status !== null) {
      const candidate = String(body.status);
      if (!VALID_STATUSES.has(candidate)) {
        throw new ValidationError(`Invalid status "${candidate}".`);
      }
    }

    const { user: adminUser, admin } = await requireAdmin(request);

    const { data: existing, error: existsErr } = await admin
      .from('dpr_jobs')
      .select('*')
      .eq('id', jobId)
      .maybeSingle();
    if (existsErr) throw httpError(500, 'Could not load job.');
    if (!existing) throw httpError(404, 'Job not found.');

    const updates = {};

    if (body.operatorSummary !== undefined) {
      updates.operator_summary = body.operatorSummary
        ? String(body.operatorSummary).slice(0, 4000)
        : null;
    }
    if (body.reportPath !== undefined) {
      updates.report_path = body.reportPath || null;
    }
    if (body.audioPath !== undefined) {
      updates.audio_path = body.audioPath || null;
    }

    let finalCredits = null;
    if (body.finalCredits !== undefined && body.finalCredits !== null) {
      finalCredits = Number(body.finalCredits);
      if (!Number.isInteger(finalCredits) || finalCredits < 1) {
        throw new ValidationError('finalCredits must be a positive integer.');
      }
    }

    let willRefund = false;
    let willNotify = false;
    let statusChanged = false;

    if (body.status !== undefined && body.status !== null) {
      const nextStatus = String(body.status);
      if (!VALID_STATUSES.has(nextStatus)) {
        throw new ValidationError(`Invalid status "${nextStatus}".`);
      }
      if (nextStatus !== existing.status) {
        updates.status = nextStatus;
        statusChanged = true;
        if (nextStatus === 'completed' || nextStatus === 'failed') {
          updates.completed_at = new Date().toISOString();
        }
        if (nextStatus === 'failed' && existing.status !== 'failed') {
          willRefund = true;
        }
        if (nextStatus === 'completed' && Boolean(body.notify)) {
          willNotify = true;
        }
      }
    }

    // Band adjustment first, so a subsequent refund (the RPC reads the
    // job's credits_used itself) refunds the corrected amount. The RPC
    // writes the ledger row and updates credits_used in one transaction.
    let bandAdjustmentDelta = 0;
    if (finalCredits !== null) {
      const { data: adjResult, error: adjErr } = await admin.rpc(
        'admin_set_job_credits',
        { p_job_id: jobId, p_final_credits: finalCredits }
      );
      if (adjErr || adjResult?.status === 'invalid') {
        throw httpError(500, 'Could not apply the band adjustment.');
      }
      if (adjResult?.status === 'not_found') {
        throw httpError(404, 'Job not found.');
      }
      bandAdjustmentDelta = adjResult?.delta ?? 0;
    }

    if (Object.keys(updates).length > 0) {
      const { error: updErr } = await admin
        .from('dpr_jobs')
        .update(updates)
        .eq('id', jobId);
      if (updErr) throw httpError(500, 'Could not update job.');
    }

    let refundedCredits = 0;
    if (willRefund) {
      // Idempotent: the RPC skips if a refund row already exists for
      // this job, so a re-flip to failed can't double-refund.
      const { data: refundResult, error: refundErr } = await admin.rpc(
        'admin_refund_job',
        { p_job_id: jobId }
      );
      if (refundErr) throw httpError(500, 'Could not refund credits.');
      refundedCredits = refundResult?.delta ?? 0;
      willRefund = refundResult?.status === 'ok';
    }

    await admin.from('audit_log').insert({
      user_id: adminUser.id,
      action: 'admin_save_job',
      metadata: {
        jobId,
        ownerUserId: existing.user_id,
        priorStatus: existing.status,
        updates,
        refunded: willRefund,
        refundedCredits,
        bandAdjustmentDelta,
        willNotify,
      },
    });

    let emailResult = null;
    if (willNotify) {
      const { data: owner } = await admin
        .from('profiles')
        .select('id, email, contact_name, company_name')
        .eq('id', existing.user_id)
        .maybeSingle();
      if (owner?.email) {
        const refreshed = { ...existing, ...updates };
        const tmpl = clientReportReadyTemplate({
          profile: owner,
          job: refreshed,
          appUrl: process.env.VITE_APP_URL || process.env.URL,
        });
        emailResult = await sendEmail({
          to: owner.email,
          subject: tmpl.subject,
          html: tmpl.html,
          text: tmpl.text,
        });
        await admin.from('audit_log').insert({
          user_id: adminUser.id,
          action: 'completion_notified',
          metadata: {
            jobId,
            ownerUserId: owner.id,
            toEmail: owner.email,
            sent: emailResult.ok,
            skipped: Boolean(emailResult.skipped),
            triggeredBy: 'admin_save_job',
          },
        });
      }
    }

    return json({
      ok: true,
      statusChanged,
      refunded: willRefund,
      refundedCredits,
      bandAdjustmentDelta,
      notified: willNotify,
      emailResult,
    });
  } catch (err) {
    return errorResponse(err);
  }
};

export const config = {
  path: '/api/admin/save-job',
};
