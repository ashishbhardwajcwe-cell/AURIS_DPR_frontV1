// /api/admin/save-job
// Admin-only endpoint that the operator UI calls to persist all changes
// to a job in one shot: status, operator summary, and the report/audio
// paths after a deliverable upload.
//
// Side effects baked in (so the admin UI can't forget):
//   - Status flip → 'completed' or 'failed' stamps completed_at
//   - Status flip → 'failed' (from anything else) inserts a +1 refund
//     into credit_ledger (idempotent — skipped if a refund row already
//     exists for this job)
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
          const { data: existingRefund } = await admin
            .from('credit_ledger')
            .select('id')
            .eq('dpr_job_id', jobId)
            .eq('reason', 'refund')
            .maybeSingle();
          if (!existingRefund) willRefund = true;
        }
        if (nextStatus === 'completed' && Boolean(body.notify)) {
          willNotify = true;
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      const { error: updErr } = await admin
        .from('dpr_jobs')
        .update(updates)
        .eq('id', jobId);
      if (updErr) throw httpError(500, 'Could not update job.');
    }

    if (willRefund) {
      const refundAmount = Number.isInteger(existing.credits_used) && existing.credits_used > 0
        ? existing.credits_used
        : 1;
      await admin.from('credit_ledger').insert({
        user_id: existing.user_id,
        delta: refundAmount,
        reason: 'refund',
        dpr_job_id: jobId,
      });
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
