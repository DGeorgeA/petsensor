/**
 * src/lib/context.ts
 *
 * Lightweight owner-reported context (spec §9/§12). Context is used ONLY to
 * modestly modulate interpretation — it can never manufacture certainty, so the
 * combined modifier is tightly bounded. Nothing here is stored server-side.
 */

export interface ScanContext {
  justExercised?: boolean;
  hotEnvironment?: boolean;
  justWoke?: boolean;
  unfamiliarVisitor?: boolean;
  traveled?: boolean;
  knownInjury?: boolean;
}

export interface ContextQuestion {
  key: keyof ScanContext;
  label: string;
  /** >1 raises plausibility of distress; <1 lowers it (benign explanation). */
  factor: number;
}

/** Compact set surfaced as quick toggles before/after a scan. */
export const CONTEXT_QUESTIONS: ContextQuestion[] = [
  { key: 'justExercised',     label: 'Just exercised',      factor: 0.88 },
  { key: 'hotEnvironment',    label: 'Hot environment',     factor: 0.90 },
  { key: 'justWoke',          label: 'Just woke up',        factor: 0.94 },
  { key: 'unfamiliarVisitor', label: 'Unfamiliar visitor',  factor: 1.06 },
  { key: 'traveled',          label: 'Recent travel',       factor: 1.05 },
  { key: 'knownInjury',       label: 'Known injury',        factor: 1.06 },
];

/** Bounded multiplicative modifier in ~[0.8, 1.15]. */
export function contextModifier(ctx: ScanContext | null | undefined): number {
  if (!ctx) return 1;
  let m = 1;
  for (const q of CONTEXT_QUESTIONS) {
    if (ctx[q.key]) m *= q.factor;
  }
  return Math.max(0.8, Math.min(1.15, m));
}
