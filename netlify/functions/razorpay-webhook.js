// /api/razorpay/webhook
// Razorpay's server-to-server notification — fires when a payment is
// captured even if the user closed the checkout tab before the client
// verify call. We require X-Razorpay-Signature to verify against the
// RAW body using RAZORPAY_WEBHOOK_SECRET, then apply the same
// idempotent credit logic as verify-payment.
//
// Always returns 200 to ack receipt (otherwise Razorpay retries
// indefinitely). Internal errors are logged but don't propagate to the
// HTTP status.

import { getAdminClient } from './_lib/supabase.js';
import { json } from './_lib/response.js';
import {
  verifyWebhookSignature,
  isRazorpayConfigured,
} from './_lib/razorpay.js';
import { applyRazorpayPayment } from './_lib/credit-purchase.js';

const RELEVANT_EVENTS = new Set(['payment.captured', 'order.paid']);

export default async (request) => {
  if (request.method !== 'POST') {
    return new Response('method not allowed', { status: 405 });
  }
  if (!isRazorpayConfigured() || !process.env.RAZORPAY_WEBHOOK_SECRET) {
    console.warn('[razorpay-webhook] not configured; acking 200');
    return new Response('not configured', { status: 200 });
  }

  // We need the raw body for signature verification — JSON parsing must
  // come AFTER the signature check.
  const raw = await request.text();
  const signature = request.headers.get('x-razorpay-signature');

  if (!verifyWebhookSignature(raw, signature)) {
    console.warn('[razorpay-webhook] signature mismatch');
    // Still 200 — Razorpay won't be able to do anything useful with
    // 4xx and a bad signature is more likely a misconfiguration than
    // a transient issue.
    return new Response('signature mismatch', { status: 200 });
  }

  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    console.warn('[razorpay-webhook] could not parse body');
    return new Response('bad json', { status: 200 });
  }

  if (!RELEVANT_EVENTS.has(event.event)) {
    return json({ ignored: event.event });
  }

  let admin;
  try {
    admin = getAdminClient();
  } catch (err) {
    console.error('[razorpay-webhook] supabase not configured:', err.message);
    return new Response('not configured', { status: 200 });
  }

  // Payload shape (relevant bits):
  //   event = 'payment.captured' →
  //     payload.payment.entity = { id, order_id, notes, amount, … }
  //   event = 'order.paid' →
  //     payload.order.entity   = { id, notes, … }
  //     payload.payment.entity = { id, … }
  const paymentEntity = event?.payload?.payment?.entity;
  const orderEntity = event?.payload?.order?.entity;

  const razorpayPaymentId = paymentEntity?.id;
  const razorpayOrderId =
    paymentEntity?.order_id || orderEntity?.id || null;
  const orderNotes =
    paymentEntity?.notes && Object.keys(paymentEntity.notes).length > 0
      ? paymentEntity.notes
      : orderEntity?.notes || {};

  if (!razorpayPaymentId || !razorpayOrderId) {
    console.warn('[razorpay-webhook] event missing payment/order id');
    return json({ ignored: 'missing-ids' });
  }
  if (!orderNotes?.userId) {
    console.warn(
      `[razorpay-webhook] event ${razorpayPaymentId} has no userId in notes; ignoring`
    );
    return json({ ignored: 'no-notes' });
  }

  const result = await applyRazorpayPayment({
    admin,
    razorpayPaymentId,
    razorpayOrderId,
    orderNotes,
    source: 'webhook',
  });

  if (!result.ok) {
    console.error('[razorpay-webhook] apply failed:', result.error);
    // Still 200 — internal failure shouldn't trigger Razorpay retries
    // until we've investigated; the audit_log captures the attempt
    // implicitly via the missing 'applied' row.
    return new Response(result.error || 'internal', { status: 200 });
  }

  return json({
    ok: true,
    alreadyApplied: Boolean(result.alreadyApplied),
    credits: result.credits,
  });
};

export const config = {
  path: '/api/razorpay/webhook',
};
