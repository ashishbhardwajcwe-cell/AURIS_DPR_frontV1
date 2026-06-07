// /api/notify-completed
// Sends the "Your DPR Analysis Report is ready" email to a job owner.
// Called by the admin UI (Milestone 9) immediately after flipping a job
// to status='completed'. Idempotency is soft: re-sending the same email
// is acceptable, but we log every send to audit_log so the operator can
// see what was dispatched.
//
// Admin only — we never let a client trigger their own "report ready"
// email (would otherwise be a trivial spam vector against support).

import { requireAdmin } from './_lib/auth.js';
import { errorResponse, httpError, json } from './_lib/response.js';
import { ValidationError } from './_lib/validation.js';
import { sendEmail } from './_lib/email.js';
import { clientReportReadyTemplate } from './_lib/templates.js';

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

    // Admin only.
    const { user: adminUser, admin } = await requireAdmin(request);

    // Load the job + owner profile.
    const { data: job, error: jobErr } = await admin
      .from('dpr_jobs')
      .select(
        'id, user_id, project_name, road_stretch, status, operator_summary, report_path, audio_path, completed_at'
      )
      .eq('id', jobId)
      .maybeSingle();
    if (jobErr) throw httpError(500, 'Could not load job.');
    if (!job) throw httpError(404, 'Job not found.');

    if (job.status !== 'completed') {
      throw httpError(
        409,
        `Cannot notify for a job in '${job.status}' status — set it to 'completed' first.`
      );
    }

    const { data: ownerProfile, error: profileErr } = await admin
      .from('profiles')
      .select('id, email, contact_name, company_name')
      .eq('id', job.user_id)
      .maybeSingle();
    if (profileErr) throw httpError(500, 'Could not load owner profile.');
    if (!ownerProfile?.email) {
      throw httpError(500, 'Owner has no email address on file.');
    }

    const appUrl = process.env.VITE_APP_URL || process.env.URL;
    const tmpl = clientReportReadyTemplate({
      profile: ownerProfile,
      job,
      appUrl,
    });

    const emailResult = await sendEmail({
      to: ownerProfile.email,
      subject: tmpl.subject,
      html: tmpl.html,
      text: tmpl.text,
    });

    await admin.from('audit_log').insert({
      user_id: adminUser.id,
      action: 'completion_notified',
      metadata: {
        jobId,
        ownerUserId: ownerProfile.id,
        toEmail: ownerProfile.email,
        sent: emailResult.ok,
        skipped: Boolean(emailResult.skipped),
        status: emailResult.status,
      },
    });

    return json({
      ok: true,
      sent: emailResult.ok,
      skipped: Boolean(emailResult.skipped),
    });
  } catch (err) {
    return errorResponse(err);
  }
};

export const config = {
  path: '/api/notify-completed',
};
