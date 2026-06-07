// /api/razorpay/create-order
// Step 1 of the Razorpay flow: client tells us which pack they want to
// buy, we mint an order with Razorpay (which the client then hands to
// the Razorpay Checkout modal). The user must be authenticated and
// active; we embed { userId, packId, credits } in the order notes so
// verify-payment + the webhook have a server-trusted source for those
// values later.
//
// IMPORTANT: we trust nothing the client says about price or credits.
// The pack id maps to a frozen server-side object — the client UI is
// purely a renderer for those packs.

import { requireActiveClient } from './_lib/auth.js';
import { errorResponse, httpError, json } from './_lib/response.js';
import { ValidationError } from './_lib/validation.js';
import { getPack, priceInPaise } from './_lib/packs.js';
import { createOrder, isRazorpayConfigured } from './_lib/razorpay.js';

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

    const packId = String(body.packId || '');
    const pack = getPack(packId);
    if (!pack) {
      throw new ValidationError('Unknown pack id.');
    }

    const { user, profile, admin } = await requireActiveClient(request);

    // Short, idempotent receipt. Razorpay receipts must be ≤ 40 chars and
    // alphanumeric-with-dashes; the user id is uuid (36 chars) so we trim
    // it. The receipt is for our records, not for payment matching.
    const receipt = `dpr-${pack.id}-${user.id.slice(0, 8)}-${Date.now()
      .toString(36)
      .slice(-6)}`.slice(0, 40);

    const order = await createOrder({
      amountPaise: priceInPaise(pack),
      receipt,
      notes: {
        userId: user.id,
        packId: pack.id,
        credits: String(pack.credits),
        priceInr: String(pack.priceInr),
        companyName: profile.company_name || '',
      },
    });

    await admin.from('audit_log').insert({
      user_id: user.id,
      action: 'razorpay_order_created',
      metadata: {
        razorpayOrderId: order.id,
        packId: pack.id,
        credits: pack.credits,
        priceInr: pack.priceInr,
      },
    });

    return json({
      orderId: order.id,
      amountPaise: priceInPaise(pack),
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      pack: {
        id: pack.id,
        label: pack.label,
        credits: pack.credits,
        priceInr: pack.priceInr,
      },
      prefill: {
        name: profile.contact_name || '',
        email: profile.email,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
};

export const config = {
  path: '/api/razorpay/create-order',
};
