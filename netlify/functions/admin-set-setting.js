import { requireAdmin } from './_lib/auth.js';
import { errorResponse, httpError, json } from './_lib/response.js';
import { ValidationError } from './_lib/validation.js';

// Whitelist of settable keys + validators. Anything else is rejected.
const ALLOWED = {
  billing_enabled: (v) => typeof v === 'boolean',
  active_brand: (v) => typeof v === 'string' && ['auris', 'bro', 'rs'].includes(v),
};

export default async (request) => {
  try {
    if (request.method !== 'POST') throw httpError(405, 'Method not allowed.');

    let body;
    try { body = await request.json(); } catch { throw new ValidationError('Body must be valid JSON.'); }

    const key = String(body.key || '');
    const value = body.value;
    if (!Object.prototype.hasOwnProperty.call(ALLOWED, key)) throw new ValidationError('Unknown setting key.');
    if (!ALLOWED[key](value)) throw new ValidationError(`Invalid value for ${key}.`);

    const { user: adminUser, admin } = await requireAdmin(request);

    const { error } = await admin
      .from('app_settings')
      .upsert(
        { key, value, updated_at: new Date().toISOString(), updated_by: adminUser.id },
        { onConflict: 'key' }
      );
    if (error) throw httpError(500, 'Could not save setting.');

    await admin.from('audit_log').insert({
      user_id: adminUser.id,
      action: 'admin_set_setting',
      metadata: { key, value },
    });

    return json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
};

export const config = { path: '/api/admin/set-setting' };
