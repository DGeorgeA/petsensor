/**
 * src/lib/usageGate.ts
 *
 * Free-usage gate: each species ("Sense My Dog" / "Sense My Cat") includes
 * FREE_TRIES complete checks. A "try" is a COMPLETED flow that reached a
 * report-generating result (the engine recorded a meaningful screening —
 * insufficient/unsupported scans never count). After the allowance, the next
 * scan attempt opens the payment window.
 *
 * Counters are device-local (localStorage) and per-species. Pure threshold
 * logic is separated from storage so it is unit-testable in Node.
 */

export const FREE_TRIES = 25;

type Species = 'dog' | 'cat';

const keyFor = (species: Species) => `smp_tries_${species}`;

/** Pure: does a given completed-try count exhaust the free allowance? */
export function isAllowanceExhausted(triesUsed: number, freeTries = FREE_TRIES): boolean {
  return triesUsed >= freeTries;
}

/** Pure: tries remaining (never negative). */
export function triesRemaining(triesUsed: number, freeTries = FREE_TRIES): number {
  return Math.max(0, freeTries - triesUsed);
}

export function getTriesUsed(species: Species): number {
  try {
    const n = parseInt(localStorage.getItem(keyFor(species)) ?? '0', 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

/** Record one completed try (called by the engine when a scan produced a
 *  report-generating result). Returns the new count. */
export function recordTry(species: Species): number {
  const next = getTriesUsed(species) + 1;
  try { localStorage.setItem(keyFor(species), String(next)); } catch { /* ignore */ }
  return next;
}

/** Should the NEXT scan for this species be gated behind the payment window? */
export function needsPaymentForNextTry(species: Species): boolean {
  return isAllowanceExhausted(getTriesUsed(species));
}
