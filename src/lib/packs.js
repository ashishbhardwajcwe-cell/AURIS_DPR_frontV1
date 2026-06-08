// Credit packs — mirror of netlify/functions/_lib/packs.js.
// Pricing is not secret, so duplicating the object keeps the client and
// server modules small without a cross-tree import.

export const PACKS = Object.freeze({
  starter: {
    id: 'starter',
    label: 'Starter',
    credits: 1,
    priceInr: 10000,
    subtitle: 'Single top-up credit',
  },
  small: {
    id: 'small',
    label: 'Small team',
    credits: 5,
    priceInr: 50000,
    subtitle: '5 credits · ≈ 1 standard DPR',
  },
  standard: {
    id: 'standard',
    label: 'Standard',
    credits: 10,
    priceInr: 100000,
    subtitle: '10 credits · ≈ 2–3 standard DPRs',
    highlight: true,
  },
  large: {
    id: 'large',
    label: 'Large firm',
    credits: 25,
    priceInr: 250000,
    subtitle: '25 credits · ≈ 6 standard DPRs',
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
