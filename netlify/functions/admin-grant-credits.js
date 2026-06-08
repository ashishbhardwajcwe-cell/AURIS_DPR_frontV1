// /api/admin/grant-credits
// Admin grants (or debits) credits to a firm. Writes a single
// credit_ledger row using the service-role key — clients have no INSERT
// policy on the ledger by design, so this is the only way credits change
// hands outside the upload/refund flow.

import { requireAdmin } from './_lib/auth.js';
import { errorResponse, httpError, json } from './_lib/response.js';
import { ValidationError } from './_lib/validation.js';

// Mirror of the credit_ledger.reason CHECK constraint from §5 of the
// schema. razorpay_purchase is here for Phase 2 — the admin will manually
// reconcile invoiced top-ups before the payments flow lands.
const VALID_REASONS = new Set([
  'grant',
  'refund',
  'expiry',
  'razorpay_purchase',
  'band_adjustment',
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

    const userId = String(body.userId || '');
    const delta = Number(body.delta);
    const reason = String(body.reason || '');

    if (!userId) throw new ValidationError('userId is required.');
    if (!Number.isInteger(delta) || delta === 0) {
      throw new ValidationError('delta must be a non-zero integer.');
    }
    if (!VALID_REASONS.has(reason)) {
      throw new ValidationError(
        `reason must be one of: ${[...VALID_REASONS].join(', ')}.`
      );
    }

    const { user: adminUser, admin } = await requireAdmin(request);

    const { data: target, error: targetErr } = await admin
      .from('profiles')
      .select('id, company_name, email')
      .eq('id', userId)
      .maybeSingle();
    if (targetErr) throw httpError(500, 'Could not load target profile.');
    if (!target) throw httpError(404, 'Target user not found.');

    const { error: insertErr } = await admin.from('credit_ledger').insert({
      user_id: userId,
      delta,
      reason,
    });
    if (insertErr) throw httpError(500, 'Could not write ledger row.');

    await admin.from('audit_log').insert({
      user_id: adminUser.id,
      action: 'admin_grant_credits',
      metadata: {
        targetUserId: userId,
        targetCompany: target.company_name,
        delta,
        reason,
      },
    });

    return json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
};

export const config = {
  path: '/api/admin/grant-credits',
};
