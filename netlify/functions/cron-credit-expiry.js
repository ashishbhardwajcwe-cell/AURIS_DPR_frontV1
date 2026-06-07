// Monthly credit ageing.
// For every profile, walks the credit_ledger in FIFO order to figure out
// how many credits sit in "lots" (positive grants) older than
// CREDIT_EXPIRY_MONTHS (default 12). Those lots expire — we insert a
// single negative ledger row per user with reason='expiry' for the total
// expirable amount.
//
// The FIFO walk treats previous expiry rows as ordinary negative
// consumption, so the function is idempotent: running it a second time
// on the same dataset produces no further expirations.
//
// Schedule: 03:00 UTC on the 1st of every month.

import { getAdminClient } from './_lib/supabase.js';
import { computeExpirable } from './_lib/credit-fifo.js';

const DEFAULT_EXPIRY_MONTHS = 12;

function monthsAgo(n) {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - n);
  return d;
}

export default async () => {
  const months =
    Number(process.env.CREDIT_EXPIRY_MONTHS) || DEFAULT_EXPIRY_MONTHS;
  const cutoff = monthsAgo(months);

  let admin;
  try {
    admin = getAdminClient();
  } catch (err) {
    console.error('[cron-credit-expiry] supabase not configured:', err.message);
    return new Response('not configured', { status: 200 });
  }

  // Pull every profile id; the ledger walk per user is O(n) over their
  // entries, which is tiny for v1 scale.
  const { data: profiles, error: profileErr } = await admin
    .from('profiles')
    .select('id, company_name');
  if (profileErr) {
    console.error('[cron-credit-expiry] profile query error:', profileErr);
    return new Response('query failed', { status: 500 });
  }

  let expiredUsers = 0;
  let totalExpired = 0;
  const errors = [];

  for (const profile of profiles ?? []) {
    const { data: ledger, error: ledgerErr } = await admin
      .from('credit_ledger')
      .select('delta, created_at')
      .eq('user_id', profile.id);
    if (ledgerErr) {
      errors.push({ userId: profile.id, err: ledgerErr.message });
      continue;
    }
    if (!ledger || ledger.length === 0) continue;

    const expirable = computeExpirable(ledger, cutoff);
    if (expirable <= 0) continue;

    const { error: insertErr } = await admin.from('credit_ledger').insert({
      user_id: profile.id,
      delta: -expirable,
      reason: 'expiry',
    });
    if (insertErr) {
      errors.push({ userId: profile.id, err: insertErr.message });
      continue;
    }
    expiredUsers += 1;
    totalExpired += expirable;
  }

  await admin.from('audit_log').insert({
    user_id: null,
    action: 'cron_credit_expiry',
    metadata: {
      expiryMonths: months,
      cutoff: cutoff.toISOString(),
      profilesScanned: profiles?.length ?? 0,
      expiredUsers,
      totalExpired,
      errors,
    },
  });

  const summary = `[cron-credit-expiry] months=${months} scanned=${profiles?.length ?? 0} expiredUsers=${expiredUsers} totalExpired=${totalExpired} errors=${errors.length}`;
  console.log(summary);
  return new Response(summary, { status: 200 });
};

export const config = {
  schedule: '0 3 1 * *', // 03:00 UTC on day 1 of every month
};
