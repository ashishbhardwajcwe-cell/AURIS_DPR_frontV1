// Shared credit-application logic for the Razorpay flow.
// Used by both /api/razorpay/verify-payment (the post-checkout client
// callback) and /api/razorpay/webhook (Razorpay's server-to-server
// notification) so whichever lands first reliably credits the user.
//
// Idempotency key: the Razorpay payment id. We write an audit_log row
// with action='razorpay_payment_applied' and metadata.razorpayPaymentId
// for every successful application; subsequent calls with the same
// payment id short-circuit and return alreadyApplied=true.

import { getPack } from './packs.js';
import { sendEmail } from './email.js';
import { paymentReceiptTemplate } from './templates.js';

export async function applyRazorpayPayment({
  admin,
  razorpayPaymentId,
  razorpayOrderId,
  orderNotes, // { userId, packId, credits, priceInr, companyName }
  source, // 'client_verify' | 'webhook'
}) {
  if (!razorpayPaymentId) {
    return { ok: false, error: 'razorpayPaymentId is required.' };
  }
  if (!orderNotes?.userId || !orderNotes?.packId) {
    return { ok: false, error: 'Order is missing userId / packId notes.' };
  }

  const pack = getPack(orderNotes.packId);
  if (!pack) {
    return { ok: false, error: `Unknown packId "${orderNotes.packId}".` };
  }

  // The order notes are server-trusted (we set them in create-order). We
  // double-check they match the configured pack — if a tampered create
  // attempt slipped through, this catches it.
  const expectedCredits = pack.credits;
  const claimedCredits = Number(orderNotes.credits);
  if (Number.isFinite(claimedCredits) && claimedCredits !== expectedCredits) {
    return {
      ok: false,
      error: `Order credits (${claimedCredits}) do not match pack credits (${expectedCredits}).`,
    };
  }

  // Idempotency check via audit_log.
  const { data: existing } = await admin
    .from('audit_log')
    .select('id')
    .eq('action', 'razorpay_payment_applied')
    .contains('metadata', { razorpayPaymentId })
    .limit(1);
  if (existing && existing.length > 0) {
    return { ok: true, alreadyApplied: true };
  }

  // Credit the ledger.
  const { error: ledgerErr } = await admin.from('credit_ledger').insert({
    user_id: orderNotes.userId,
    delta: expectedCredits,
    reason: 'razorpay_purchase',
  });
  if (ledgerErr) {
    console.error('[apply-payment] ledger error:', ledgerErr);
    return { ok: false, error: 'Could not write to ledger.' };
  }

  // Compute the new balance for the receipt email.
  let newBalance = null;
  try {
    const { data } = await admin.rpc('credit_balance', {
      uid: orderNotes.userId,
    });
    if (typeof data === 'number') newBalance = data;
  } catch {
    /* non-fatal */
  }

  // Send receipt email.
  let emailResult = { skipped: true };
  try {
    const { data: profile } = await admin
      .from('profiles')
      .select('email, contact_name, company_name')
      .eq('id', orderNotes.userId)
      .maybeSingle();
    if (profile?.email) {
      const tmpl = paymentReceiptTemplate({
        profile,
        pack,
        amountInr: Number(orderNotes.priceInr) || pack.priceInr,
        paymentId: razorpayPaymentId,
        newBalance,
        appUrl: process.env.VITE_APP_URL || process.env.URL,
      });
      emailResult = await sendEmail({
        to: profile.email,
        subject: tmpl.subject,
        html: tmpl.html,
        text: tmpl.text,
      });
    }
  } catch (err) {
    console.warn('[apply-payment] receipt email error:', err.message);
  }

  // Audit the application (this is also the idempotency anchor).
  await admin.from('audit_log').insert({
    user_id: orderNotes.userId,
    action: 'razorpay_payment_applied',
    metadata: {
      razorpayPaymentId,
      razorpayOrderId: razorpayOrderId || null,
      packId: pack.id,
      credits: expectedCredits,
      priceInr: Number(orderNotes.priceInr) || pack.priceInr,
      newBalance,
      source,
      emailSent: emailResult.ok,
      emailSkipped: Boolean(emailResult.skipped),
    },
  });

  return { ok: true, credits: expectedCredits, newBalance };
}
