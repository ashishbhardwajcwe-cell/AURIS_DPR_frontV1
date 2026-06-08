// Shared credit estimator for a DPR submission.
// Mirror at netlify/functions/_lib/estimateCredits.js — the client uses
// this for the live upload-form estimate; the server uses its copy to
// compute the authoritative credits_used at job-insert time.

export const CREDIT_PRICE = 10000; // ₹ per credit

export const LENGTH_BANDS = Object.freeze([
  { id: 'small',    label: '≤ 15 km',  baseCredits: 3 },
  { id: 'standard', label: '15–25 km', baseCredits: 4 },
  { id: 'larger',   label: '25–40 km', baseCredits: 6 },
  { id: 'major',    label: '40–60 km', baseCredits: 8 },
  { id: 'xl',       label: '> 60 km',  baseCredits: 10 },
]);

const BASE = Object.freeze({ small: 3, standard: 4, larger: 6, major: 8, xl: 10 });
const STRUCTURES_ADDON = 3;

export function estimateCredits({ lengthBand, packages = 1, hasStructures = false } = {}) {
  let credits = BASE[lengthBand] ?? BASE.standard;
  if (Number(packages) >= 3 && lengthBand === 'standard') credits = 6;
  if (hasStructures) credits += STRUCTURES_ADDON;
  return credits;
}

export function isValidBand(lengthBand) {
  return Object.prototype.hasOwnProperty.call(BASE, lengthBand);
}
