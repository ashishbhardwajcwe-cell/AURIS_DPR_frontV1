// /api/admin/set-profile-status
// Approve a pending account, or suspend a problematic one. Updating
// profiles.status flips what the client sees on the dashboard (the
// pending banner / suspended notice) and gates the upload flow on the
// server (requireActiveClient rejects non-active statuses).

import { requireAdmin } from './_lib/auth.js';
import { errorResponse, httpError, json } from './_lib/response.js';
import { ValidationError } from './_lib/validation.js';

const VALID_STATUSES = new Set(['pending', 'active', 'suspended']);

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

    const userId = String(body.userId || '');
    const status = String(body.status || '');

    if (!userId) throw new ValidationError('userId is required.');
    if (!VALID_STATUSES.has(status)) {
      throw new ValidationError(
        `status must be one of: ${[...VALID_STATUSES].join(', ')}.`
      );
    }

    const { user: adminUser, admin } = await requireAdmin(request);

    if (userId === adminUser.id && status !== 'active') {
      throw new ValidationError(
        'You cannot suspend or unapprove your own account.'
      );
    }

    const { data: target, error: targetErr } = await admin
      .from('profiles')
      .select('id, company_name, status')
      .eq('id', userId)
      .maybeSingle();
    if (targetErr) throw httpError(500, 'Could not load target profile.');
    if (!target) throw httpError(404, 'Target user not found.');

    const { error: updErr } = await admin
      .from('profiles')
      .update({ status })
      .eq('id', userId);
    if (updErr) throw httpError(500, 'Could not update profile.');

    await admin.from('audit_log').insert({
      user_id: adminUser.id,
      action: 'admin_set_profile_status',
      metadata: {
        targetUserId: userId,
        targetCompany: target.company_name,
        priorStatus: target.status,
        newStatus: status,
      },
    });

    return json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
};

export const config = {
  path: '/api/admin/set-profile-status',
};
