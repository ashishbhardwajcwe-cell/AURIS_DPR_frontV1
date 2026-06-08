// Server-side mirror of src/lib/estimateCredits.js.
// Keep the two files in sync — the client uses its copy to render the
// upload form's live estimate; the server uses this one to compute the
// authoritative credits_used at job-insert time.

export const CREDIT_PRICE = 10000;

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

export const VALID_BANDS = Object.keys(BASE);
