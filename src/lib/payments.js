// Client-side payments helper.
// Talks to the two Razorpay-related Netlify Functions and orchestrates
// the Razorpay Checkout modal.
//
// The Razorpay Checkout script is loaded once on demand (so the bundle
// stays light for users who never visit /pricing). We expose a single
// purchasePack({ packId, profile }) entry point that the UI calls — it
// handles create-order → modal → verify in one promise.

import { supabase } from './supabase.js';

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

let scriptPromise = null;

function loadRazorpayScript() {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(true), { once: true });
      existing.addEventListener('error', () => reject(new Error('Razorpay script failed to load.')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Razorpay script failed to load.'));
    };
    document.body.appendChild(script);
  });
  return scriptPromise;
}

async function getAuthHeader() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('You are not signed in.');
  return { authorization: `Bearer ${session.access_token}` };
}

async function callApi(path, body) {
  const headers = {
    'content-type': 'application/json',
    ...(await getAuthHeader()),
  };
  const resp = await fetch(path, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    let message = `Request failed (${resp.status})`;
    try {
      const j = await resp.json();
      if (j?.error) message = j.error;
    } catch {
      /* not JSON */
    }
    const err = new Error(message);
    err.status = resp.status;
    throw err;
  }
  return resp.json();
}

export function createOrder({ packId }) {
  return callApi('/api/razorpay/create-order', { packId });
}

export function verifyPayment(payload) {
  return callApi('/api/razorpay/verify-payment', payload);
}

// Drives the full top-up flow.
//   1. Asks the server to create a Razorpay order
//   2. Loads the Razorpay Checkout script if needed
//   3. Opens the modal pre-filled with the firm's contact info
//   4. On success, calls verify-payment server-side
//   5. Resolves with { ok, creditsAdded, newBalance, alreadyApplied } or rejects
export async function purchasePack({ packId }) {
  const order = await createOrder({ packId });

  await loadRazorpayScript();
  if (typeof window === 'undefined' || !window.Razorpay) {
    throw new Error('Razorpay Checkout could not be loaded.');
  }

  return new Promise((resolve, reject) => {
    let dismissedByUser = true;

    const rzp = new window.Razorpay({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amountPaise,
      currency: order.currency || 'INR',
      name: 'DPR Analyzer Pro',
      description: `${order.pack.credits} credit${order.pack.credits === 1 ? '' : 's'} · ${order.pack.label}`,
      prefill: {
        name: order.prefill?.name || '',
        email: order.prefill?.email || '',
      },
      notes: { packId: order.pack.id },
      theme: { color: '#0D9488' },
      handler: async (response) => {
        dismissedByUser = false;
        try {
          const verified = await verifyPayment({
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature,
          });
          resolve({
            ok: true,
            ...verified,
            pack: order.pack,
          });
        } catch (err) {
          reject(err);
        }
      },
      modal: {
        ondismiss: () => {
          if (dismissedByUser) {
            const err = new Error('Payment was cancelled.');
            err.cancelled = true;
            reject(err);
          }
        },
      },
    });

    rzp.on('payment.failed', (response) => {
      dismissedByUser = false;
      const err = new Error(
        response?.error?.description ||
          'Payment failed. Please try again or use a different method.'
      );
      err.code = response?.error?.code;
      reject(err);
    });

    rzp.open();
  });
}
