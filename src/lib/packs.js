// Credit packs — mirror of netlify/functions/_lib/packs.js.
// Pricing is not secret, so duplicating the object keeps the client and
// server modules small without a cross-tree import.

export const PACKS = Object.freeze({
  starter: {
    id: 'starter',
    label: 'Starter',
    credits: 1,
    priceInr: 1500,
    subtitle: 'One DPR submission',
  },
  small: {
    id: 'small',
    label: 'Small team',
    credits: 5,
    priceInr: 6500,
    subtitle: '5 submissions · ₹1,300 each',
  },
  standard: {
    id: 'standard',
    label: 'Standard',
    credits: 10,
    priceInr: 11500,
    subtitle: '10 submissions · ₹1,150 each',
    highlight: true,
  },
  large: {
    id: 'large',
    label: 'Large firm',
    credits: 25,
    priceInr: 25000,
    subtitle: '25 submissions · ₹1,000 each',
  },
});

export const PACK_LIST = Object.values(PACKS);

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatInr(priceInr) {
  return INR.format(priceInr);
}
