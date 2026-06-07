// /api/razorpay/verify-payment
// Step 2 of the Razorpay flow: the client's Razorpay Checkout modal
// just returned a success callback with (paymentId, orderId, signature).
// We verify the signature, fetch the order from Razorpay to read the
// notes we set in create-order (the server-trusted userId, packId, and
// credits count), then apply the credit.
//
// Idempotent — re-running with the same payment id is a no-op.

import { requireActiveClient } from './_lib/auth.js';
import { errorResponse, httpError, json } from './_lib/response.js';
import { ValidationError } from './_lib/validation.js';
import {
  verifyPaymentSignature,
  getOrder,
  isRazorpayConfigured,
} from './_lib/razorpay.js';
import { applyRazorpayPayment } from './_lib/credit-purchase.js';

export default async (request) => {
  try {
    if (request.method !== 'POST') {
      throw httpError(405, 'Method not allowed.');
    }
    if (!isRazorpayConfigured()) {
      throw httpError(503, 'Payments are not configured on this server yet.');
    }

    let body;
    try {
      body = await request.json();
    } catch {
      throw new ValidationError('Request body must be valid JSON.');
    }

    const razorpayPaymentId = String(body.razorpayPaymentId || '');
    const razorpayOrderId = String(body.razorpayOrderId || '');
    const razorpaySignature = String(body.razorpaySignature || '');

    if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      throw new ValidationError(
        'razorpayPaymentId, razorpayOrderId, and razorpaySignature are required.'
      );
    }

    if (
      !verifyPaymentSignature({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      })
    ) {
      throw httpError(400, 'Payment signature did not verify.');
    }

    const { user, admin } = await requireActiveClient(request);

    // Pull the order back from Razorpay to get the notes WE set during
    // create-order. The client cannot forge these because their JWT is
    // checked above; even if they did, the credit_purchase helper checks
    // the credits against the configured pack.
    const order = await getOrder(razorpayOrderId);
    const notes = order?.notes || {};
    if (notes.userId !== user.id) {
      throw httpError(403, "This order does not belong to your account.");
    }

    const result = await applyRazorpayPayment({
      admin,
      razorpayPaymentId,
      razorpayOrderId,
      orderNotes: notes,
      source: 'client_verify',
    });

    if (!result.ok) {
      throw httpError(500, result.error || 'Could not apply payment.');
    }

    return json({
      ok: true,
      alreadyApplied: Boolean(result.alreadyApplied),
      creditsAdded: result.credits,
      newBalance: result.newBalance,
    });
  } catch (err) {
    return errorResponse(err);
  }
};

export const config = {
  path: '/api/razorpay/verify-payment',
};
