// Resend transactional email wrapper.
// Gracefully no-ops when RESEND_API_KEY is missing so the upload flow
// still works in environments where email isn't configured yet (e.g.
// preview deploys, early-stage Netlify). Failures from Resend are
// logged but never bubble up — a missed email must not roll back a
// completed credit deduction or status change.

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

// Sends one email. Returns { ok, skipped, status, body } and never throws.
export async function sendEmail({ to, subject, html, text, replyTo }) {
  if (!isEmailConfigured()) {
    console.log(
      `[email] skipped — RESEND_API_KEY/RESEND_FROM_EMAIL not set. would-send to=${to} subject="${subject}"`
    );
    return { ok: false, skipped: true };
  }
  if (!to || !subject || (!html && !text)) {
    console.warn('[email] missing required fields, skipping');
    return { ok: false, skipped: true };
  }

  const recipients = Array.isArray(to) ? to : [to];

  try {
    const resp = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL,
        to: recipients,
        subject,
        html,
        text,
        reply_to: replyTo || undefined,
      }),
    });

    if (!resp.ok) {
      const body = await resp.text().catch(() => '');
      console.error(
        `[email] resend ${resp.status}: ${body.slice(0, 400)} (to=${recipients.join(',')})`
      );
      return { ok: false, skipped: false, status: resp.status, body };
    }
    return { ok: true, skipped: false, status: resp.status };
  } catch (err) {
    console.error('[email] resend network error:', err);
    return { ok: false, skipped: false, error: err.message };
  }
}

// Fire-and-forget Make.com webhook. Optional integration; skipped if
// MAKE_WEBHOOK_URL is not configured. Never throws.
export async function fireMakeWebhook(payload) {
  const url = process.env.MAKE_WEBHOOK_URL;
  if (!url) return { ok: false, skipped: true };
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      console.warn(`[make-webhook] ${resp.status}`);
      return { ok: false, status: resp.status };
    }
    return { ok: true, status: resp.status };
  } catch (err) {
    console.warn('[make-webhook] error:', err);
    return { ok: false, error: err.message };
  }
}
