// Weekly low-balance reminder.
// For every active firm whose balance is at or below
// LOW_BALANCE_THRESHOLD (default 3), sends a heads-up via Resend.
// "Out of credits" (balance ≤ 0) gets a sterner subject line and copy.
//
// Idempotency: we don't re-send the same reminder until the firm
// receives a positive ledger entry (i.e., a grant or purchase). We check
// for an audit_log row with action='balance_reminder_sent' that's
// newer than the firm's most recent positive ledger entry — if one
// exists, skip.
//
// Schedule: 09:00 UTC every Monday.

import { getAdminClient } from './_lib/supabase.js';
import { sendEmail, isEmailConfigured } from './_lib/email.js';
import { lowBalanceTemplate } from './_lib/templates.js';

const DEFAULT_THRESHOLD = 3;

// Reminder severity bucket — drives both the email copy and the
// idempotency check so a firm going from "low" to "empty" gets a second
// reminder even before they top up.
function bucketFor(balance, threshold) {
  if (balance <= 0) return 'empty';
  if (balance <= threshold) return 'low';
  return null;
}

export default async () => {
  const threshold =
    Number(process.env.LOW_BALANCE_THRESHOLD) || DEFAULT_THRESHOLD;
  const appUrl = process.env.VITE_APP_URL || process.env.URL;

  let admin;
  try {
    admin = getAdminClient();
  } catch (err) {
    console.error('[cron-balance-reminders] supabase not configured:', err.message);
    return new Response('not configured', { status: 200 });
  }

  if (!isEmailConfigured()) {
    const msg = '[cron-balance-reminders] RESEND not configured; skipping';
    console.log(msg);
    return new Response(msg, { status: 200 });
  }

  const { data: profiles, error: profilesErr } = await admin
    .from('profiles')
    .select('id, email, company_name, contact_name, status, role');
  if (profilesErr) {
    console.error('[cron-balance-reminders] profile query:', profilesErr);
    return new Response('query failed', { status: 500 });
  }

  let scanned = 0;
  let sent = 0;
  let skippedDuplicate = 0;
  const errors = [];

  for (const profile of profiles ?? []) {
    if (profile.status !== 'active') continue;
    if (profile.role === 'admin') continue; // admins don't pay
    if (!profile.email) continue;
    scanned += 1;

    const { data: balanceData, error: balErr } = await admin.rpc(
      'credit_balance',
      { uid: profile.id }
    );
    if (balErr) {
      errors.push({ userId: profile.id, step: 'balance', err: balErr.message });
      continue;
    }
    const balance = Number(balanceData ?? 0);
    const severity = bucketFor(balance, threshold);
    if (!severity) continue;

    // Find the firm's most recent positive ledger entry. That's our
    // idempotency anchor — we send at most one reminder per severity per
    // top-up cycle.
    const { data: lastTopupRows } = await admin
      .from('credit_ledger')
      .select('created_at')
      .eq('user_id', profile.id)
      .gt('delta', 0)
      .order('created_at', { ascending: false })
      .limit(1);
    const lastTopupAt = lastTopupRows?.[0]?.created_at ?? null;

    // Has a reminder of this severity already been sent since the last
    // top-up? If so, skip.
    let alreadySentQuery = admin
      .from('audit_log')
      .select('id')
      .eq('action', 'balance_reminder_sent')
      .contains('metadata', { ownerUserId: profile.id, severity })
      .limit(1);
    if (lastTopupAt) {
      alreadySentQuery = alreadySentQuery.gt('created_at', lastTopupAt);
    }
    const { data: alreadySent } = await alreadySentQuery;
    if (alreadySent && alreadySent.length > 0) {
      skippedDuplicate += 1;
      continue;
    }

    const tmpl = lowBalanceTemplate({ profile, balance, severity, appUrl });
    const result = await sendEmail({
      to: profile.email,
      subject: tmpl.subject,
      html: tmpl.html,
      text: tmpl.text,
    });

    await admin.from('audit_log').insert({
      user_id: null,
      action: 'balance_reminder_sent',
      metadata: {
        ownerUserId: profile.id,
        severity,
        balance,
        threshold,
        sent: result.ok,
        skipped: Boolean(result.skipped),
      },
    });
    if (result.ok) sent += 1;
  }

  const summary = `[cron-balance-reminders] threshold=${threshold} scanned=${scanned} sent=${sent} skippedDuplicate=${skippedDuplicate} errors=${errors.length}`;
  console.log(summary);

  await admin.from('audit_log').insert({
    user_id: null,
    action: 'cron_balance_reminders',
    metadata: { threshold, scanned, sent, skippedDuplicate, errors },
  });

  return new Response(summary, { status: 200 });
};

export const config = {
  schedule: '0 9 * * 1', // 09:00 UTC every Monday
};
