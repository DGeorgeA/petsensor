/**
 * src/lib/scanSync.ts
 *
 * Optional, best-effort sync of scan METADATA to Supabase `scan_results`
 * (product spec §9). Strictly non-media: species, screening class, the two
 * indices, modality, and version strings — nothing that could reconstruct
 * audio or video. Local IndexedDB (localHistory) remains the user's history;
 * this table is write-only from clients (RLS: anon INSERT, no SELECT) and is
 * used service-side for aggregate threshold calibration.
 *
 * No-ops silently when Supabase is not configured or offline — the app never
 * depends on it.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import type { ScreeningResult } from './screening';

export const MODEL_VERSION = 'fp-v1+vis-v1';
export const APP_VERSION = '2026.07';

/** Classes worth recording — insufficient/unsupported scans carry no signal. */
const RECORDABLE = new Set(['RELAXED', 'POSSIBLE_STRESS', 'POSSIBLE_ANXIETY', 'EMERGENCY']);

export function syncScanResult(species: 'dog' | 'cat', s: ScreeningResult): void {
  if (!isSupabaseConfigured()) return;
  if (!RECORDABLE.has(s.screeningClass)) return;
  // Fire-and-forget: a failed insert must never affect the user experience.
  void supabase
    .from('scan_results')
    .insert({
      species,
      scan_mode: 'unified',
      screening_class: s.screeningClass,
      stress_signal_index: Math.round(s.severity),
      observation_confidence: Math.round(s.observationConfidence),
      modality: s.modality,
      model_version: MODEL_VERSION,
      app_version: APP_VERSION,
    })
    .then(({ error }) => {
      if (error) console.debug('scan_results sync skipped:', error.message);
    });
}
