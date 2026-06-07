// Single source of truth for credit packs (server side).
// Mirror these in src/lib/packs.js when adjusting — the client uses its
// copy to render the pricing page; the server uses this one to compute
// the Razorpay order amount and to embed packId in the order notes.

export const PACKS = Object.freeze({
  starter: {
    id: 'starter',
    label: 'Starter',
    credits: 1,
    priceInr: 10000,
    subtitle: 'One DPR submission',
  },
  small: {
    id: 'small',
    label: 'Small team',
    credits: 5,
    priceInr: 50000,
    subtitle: '5 submissions · ₹10,000 each',
  },
  standard: {
    id: 'standard',
    label: 'Standard',
    credits: 10,
    priceInr: 100000,
    subtitle: '10 submissions · ₹10,000 each',
    highlight: true,
  },
  large: {
    id: 'large',
    label: 'Large firm',
    credits: 25,
    priceInr: 250000,
    subtitle: '25 submissions · ₹10,000 each',
  },
});

export function getPack(id) {
  return PACKS[id] || null;
}

// Razorpay expects the amount in paise.
export function priceInPaise(pack) {
  return Math.round(pack.priceInr * 100);
}
