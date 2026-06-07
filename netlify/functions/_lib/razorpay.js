// Razorpay server-side wrapper.
// We talk to the REST API directly via fetch + Basic auth so there's no
// SDK dependency in the function bundle. Signature verification uses
// Node's built-in `node:crypto`.

import crypto from 'node:crypto';

export function isRazorpayConfigured() {
  return Boolean(
    process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  );
}

async function razorpayFetch(path, init = {}) {
  if (!isRazorpayConfigured()) {
    const err = new Error('Razorpay is not configured on this server.');
    err.statusCode = 500;
    throw err;
  }
  const auth = Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
  ).toString('base64');

  const resp = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: {
      ...init.headers,
      authorization: `Basic ${auth}`,
      'content-type': 'application/json',
    },
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    console.error(`[razorpay] ${resp.status} ${path}: ${text.slice(0, 400)}`);
    const err = new Error(`Razorpay API error (${resp.status})`);
    err.statusCode = 502;
    throw err;
  }
  return resp.json();
}

export function createOrder({ amountPaise, receipt, notes }) {
  return razorpayFetch('/orders', {
    method: 'POST',
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes: notes || {},
    }),
  });
}

export function getOrder(orderId) {
  return razorpayFetch(`/orders/${encodeURIComponent(orderId)}`);
}

export function getPayment(paymentId) {
  return razorpayFetch(`/payments/${encodeURIComponent(paymentId)}`);
}

// Verify the checkout-handler signature returned by Razorpay's modal.
// The signature is HMAC-SHA256 over "{order_id}|{payment_id}" with the
// merchant key_secret as the key. Constant-time compare to prevent
// timing attacks.
export function verifyPaymentSignature({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return false;
  }
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
  return safeEqual(expected, razorpaySignature);
}

// Verify a webhook callback's X-Razorpay-Signature against the raw body.
// Must be done over the raw body BEFORE JSON-parsing.
export function verifyWebhookSignature(rawBody, signatureHeader) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  if (!rawBody || !signatureHeader) return false;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  return safeEqual(expected, signatureHeader);
}

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}
