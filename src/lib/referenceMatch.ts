/**
 * src/lib/referenceMatch.ts
 *
 * Matches a LIVE mic embedding (already computed on-device by the audio worker)
 * against the reference clips downloaded from Supabase Storage
 * (referenceLoader.ts). Pure math — no network, no DOM — so it runs in Node
 * test harnesses too.
 *
 * Product rule: a reference match is surfaced to the user ONLY when the cosine
 * similarity is 60–100%. The surfaced name is a cautious pattern-family name
 * ("Separation-distress-type whining pattern"), always paired with
 * VET_FOLLOWUP_COPY — never presented as a diagnosis.
 *
 * Privacy: the live embedding never leaves the device; reference clips are
 * download-only.
 */

import type { ReferenceFixture } from './referenceLoader';
import { fallbackConditionName } from './conditionGroups';
import type { ScreeningCategory } from './screening';

/** Minimum cosine similarity for a nameable reference match (60%). */
export const REFERENCE_MATCH_THRESHOLD = 0.6;

export interface ConditionMatch {
  /** Cautious pattern-family name shown to the user. */
  conditionName: string;
  /** 60–100 — cosine similarity as a percentage. */
  matchPercent: number;
  category: ScreeningCategory;
  /** Storage path of the matched reference clip (report/debug provenance). */
  referencePath: string;
  /** Reference clips are engineering test data until validated recordings replace them. */
  validationStatus: 'test_fixture' | 'validated';
}

export function cosineSimilarity(
  a: ArrayLike<number>,
  b: ArrayLike<number>,
): number {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * Best reference match for a live embedding, or null when nothing reaches the
 * 60% floor. Only same-species references are considered — a dog vocalisation
 * must never be named after a cat reference clip.
 */
export function matchAgainstReferences(
  embedding: ArrayLike<number>,
  species: 'dog' | 'cat',
  fixtures: ReferenceFixture[],
): ConditionMatch | null {
  let best: ReferenceFixture | null = null;
  let bestSim = -1;
  for (const f of fixtures) {
    if (f.species !== species) continue;
    const sim = cosineSimilarity(embedding, f.embedding);
    if (sim > bestSim) {
      bestSim = sim;
      best = f;
    }
  }
  if (!best || bestSim < REFERENCE_MATCH_THRESHOLD) return null;
  return {
    conditionName: best.condition ?? fallbackConditionName(species, best.category),
    matchPercent: Math.min(100, Math.round(bestSim * 100)),
    category: best.category,
    referencePath: best.path,
    validationStatus: 'test_fixture',
  };
}
