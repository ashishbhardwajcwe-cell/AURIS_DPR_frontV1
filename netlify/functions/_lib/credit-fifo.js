// FIFO credit ageing.
// Given a user's complete ledger history, returns how many credits have
// "expired" — i.e., how many sit in lots that are older than the cutoff
// AND haven't already been consumed by later negative entries.
//
// Algorithm: walk the ledger in chronological order, maintaining a FIFO
// queue of positive grants ("lots"). Negative entries (dpr_submission,
// refund, expiry — anything ≤ 0) consume from the oldest lot first. At
// the end, any lots whose grant date is strictly older than `cutoff`
// are eligible for expiry; the rest live on.
//
// This is idempotent: previously-inserted expiry rows are themselves
// negative ledger entries and get consumed during the walk, so re-runs
// of the cron only expire net-new aged credits.

/**
 * @param {{ created_at: string|Date, delta: number }[]} ledger
 *   Full per-user ledger ordered any way; this function sorts internally.
 * @param {Date} cutoff
 *   Credits granted strictly before this moment are expirable.
 * @returns {number} the amount that should be expired (non-negative integer)
 */
export function computeExpirable(ledger, cutoff) {
  if (!Array.isArray(ledger) || ledger.length === 0) return 0;
  const cutoffMs = cutoff instanceof Date ? cutoff.getTime() : new Date(cutoff).getTime();

  // Sort chronologically. If two entries share a timestamp, positive deltas
  // are processed first so consumption can't undercut a same-instant grant.
  const sorted = [...ledger].sort((a, b) => {
    const ta = new Date(a.created_at).getTime();
    const tb = new Date(b.created_at).getTime();
    if (ta !== tb) return ta - tb;
    return (b.delta ?? 0) - (a.delta ?? 0);
  });

  const lots = []; // each: { time: number, remaining: number }

  for (const entry of sorted) {
    const delta = Number(entry.delta);
    if (!Number.isFinite(delta) || delta === 0) continue;

    if (delta > 0) {
      lots.push({
        time: new Date(entry.created_at).getTime(),
        remaining: delta,
      });
      continue;
    }

    let toConsume = -delta;
    while (toConsume > 0 && lots.length > 0) {
      const head = lots[0];
      if (head.remaining <= toConsume) {
        toConsume -= head.remaining;
        lots.shift();
      } else {
        head.remaining -= toConsume;
        toConsume = 0;
      }
    }
    // toConsume > 0 here implies an over-spend, which shouldn't happen
    // because request-upload checks credit_balance ≥ 1 before any insert.
    // We log but don't throw — the cron is best-effort.
    if (toConsume > 0) {
      console.warn(
        `[credit-fifo] overspend detected — ${toConsume} credits unaccounted for`
      );
    }
  }

  let expirable = 0;
  for (const lot of lots) {
    if (lot.time < cutoffMs) expirable += lot.remaining;
  }
  return expirable;
}
