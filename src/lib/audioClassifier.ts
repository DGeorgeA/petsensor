/**
 * src/lib/audioClassifier.ts
 *
 * Pure, stateful per-frame audio classifier — the DSP decision core shared by
 * the Web Worker (audioWorker.ts) and the offline fixture test harness
 * (src/lib/__tests__). No DOM / worker APIs here, so it runs in Node too.
 *
 * Given a PCM frame + species, it returns exactly one typed outcome:
 *   DETECTION | ACCUMULATING | INSUFFICIENT | UNSUPPORTED
 */

import {
  extractFeatures,
  resetStreamState,
  weightedMatch,
  detectFalsePositive,
  TemporalBuffer,
  CONFIDENCE_THRESHOLD,
  SPECIES_CONTEXT_FLOOR,
  type AudioFingerprint,
} from './audioFingerprintEngine';
import {
  LIBRARY_BY_ANIMAL,
  REFERENCE_EMBEDDINGS,
  type AnimalType,
  type EmotionSignature,
} from './petEmotionLibrary';
import type { ScreeningCategory } from './screening';

export interface SerializedFeatures {
  rms: number;
  zcr: number;
  spectralCentroid: number;
  spectralRolloff: number;
  spectralFlux: number;
  spectralFlatness: number;
  f0Estimate: number;
  subBandEnergy: number[];
  mfcc: number[];
  chroma: number[];
}

/** Per-frame diagnostic trace (dev tooling / field RCA — never user-facing). */
export interface ClassifierDiag {
  rms: number;
  top1Key: string;
  top1Score: number;
  top2Key: string;
  top2Score: number;
  margin: number;
  /** Gate the frame reached: fp_gate | species_floor | below_accumulation | accumulating | confirmed */
  stage: string;
}

export type ClassifierOutcome =
  | { type: 'DETECTION'; key: string; similarity: number; label: string; emotionalMessage: string; level: EmotionSignature['level']; category: ScreeningCategory; anxietyScore: number; features: SerializedFeatures; embedding: number[]; diag?: ClassifierDiag }
  | { type: 'ACCUMULATING'; bestKey: string; progress: number; features: SerializedFeatures; diag?: ClassifierDiag }
  | { type: 'INSUFFICIENT'; reason: string; features?: SerializedFeatures; diag?: ClassifierDiag }
  | { type: 'UNSUPPORTED'; reason: string; features?: SerializedFeatures; diag?: ClassifierDiag };

const EMA_ALPHA = 0.35;

export function serializeFeatures(f: AudioFingerprint['features']): SerializedFeatures {
  return {
    rms: f.rms,
    zcr: f.zcr,
    spectralCentroid: f.spectralCentroid,
    spectralRolloff: f.spectralRolloff,
    spectralFlux: f.spectralFlux,
    spectralFlatness: f.spectralFlatness,
    f0Estimate: f.f0Estimate,
    subBandEnergy: Array.from(f.subBandEnergy),
    mfcc: Array.from(f.mfcc),
    chroma: Array.from(f.chroma),
  };
}

export class PetAudioClassifier {
  private temporalBuffers: Record<AnimalType, TemporalBuffer> = {
    dog: new TemporalBuffer(),
    cat: new TemporalBuffer(),
  };
  private emaSmoothed: Record<string, number> = {};

  /** Reset all temporal/EMA state (e.g. between independent test fixtures). */
  reset() {
    this.temporalBuffers = { dog: new TemporalBuffer(), cat: new TemporalBuffer() };
    this.emaSmoothed = {};
    resetStreamState(); // spectral-flux frame state must not leak across streams
  }

  process(pcm: Float32Array, animalType: AnimalType): ClassifierOutcome {
    // 1. Features
    const fingerprint = extractFeatures(pcm);
    const { features, embedding } = fingerprint;

    const mkDiag = (stage: string, top1 = '', s1 = 0, top2 = '', s2 = 0): ClassifierDiag => ({
      rms: features.rms, top1Key: top1, top1Score: s1, top2Key: top2, top2Score: s2,
      margin: s1 - s2, stage,
    });

    // 2. Quality + subject rejection
    const fpCheck = detectFalsePositive(features);
    if (fpCheck.isRejected) {
      this.temporalBuffers[animalType].clear();
      const kind = fpCheck.reason === 'silence' ? 'INSUFFICIENT' : 'UNSUPPORTED';
      return { type: kind, reason: fpCheck.reason, features: serializeFeatures(features), diag: mkDiag('fp_gate') } as ClassifierOutcome;
    }

    // 3. Match against reference library
    const library = LIBRARY_BY_ANIMAL[animalType];
    let bestKey = '';
    let bestScore = -1;      // EMA-smoothed best (temporal gating)
    let bestRawScore = -1;   // instantaneous best (species gate)
    let bestSig: EmotionSignature | null = null;
    // Instantaneous top-2 trace for field RCA (which classes are close, and by how much).
    let top1Key = '', top1Raw = -1, top2Key = '', top2Raw = -1;

    for (const sig of library) {
      const refEmb = REFERENCE_EMBEDDINGS.get(sig.key);
      if (!refEmb) continue;
      const score = weightedMatch(fingerprint, sig, refEmb);
      if (score > bestRawScore) bestRawScore = score;
      if (score > top1Raw) {
        top2Key = top1Key; top2Raw = top1Raw;
        top1Key = sig.key; top1Raw = score;
      } else if (score > top2Raw) {
        top2Key = sig.key; top2Raw = score;
      }
      const prevEma = this.emaSmoothed[sig.key] ?? score;
      const smoothed = EMA_ALPHA * score + (1 - EMA_ALPHA) * prevEma;
      this.emaSmoothed[sig.key] = smoothed;
      if (smoothed > bestScore) {
        bestScore = smoothed;
        bestKey = sig.key;
        bestSig = sig;
      }
    }

    // 3b. Species/context gate
    if (bestRawScore < SPECIES_CONTEXT_FLOOR) {
      this.temporalBuffers[animalType].clear();
      return { type: 'UNSUPPORTED', reason: 'out_of_species_context', features: serializeFeatures(features),
        diag: mkDiag('species_floor', top1Key, top1Raw, top2Key, top2Raw) };
    }

    // 4. Temporal accumulation
    if (bestKey && bestScore >= CONFIDENCE_THRESHOLD * 0.85) {
      this.temporalBuffers[animalType].push(bestKey, bestScore, features.rms, features.spectralCentroid);
    } else {
      this.temporalBuffers[animalType].clear();
      return { type: 'INSUFFICIENT', reason: 'below_threshold', features: serializeFeatures(features),
        diag: mkDiag('below_accumulation', top1Key, top1Raw, top2Key, top2Raw) };
    }

    // 5. Temporal gate
    const confirmed = this.temporalBuffers[animalType].getConfirmedMatch();
    if (!confirmed) {
      return { type: 'ACCUMULATING', bestKey, progress: bestScore, features: serializeFeatures(features),
        diag: mkDiag('accumulating', top1Key, top1Raw, top2Key, top2Raw) };
    }

    // 6. Confirmed detection
    if (!bestSig) {
      return { type: 'INSUFFICIENT', reason: 'sig_not_found', features: serializeFeatures(features) };
    }
    return {
      type: 'DETECTION',
      key: confirmed.key,
      similarity: confirmed.avgSimilarity,
      label: bestSig.label,
      emotionalMessage: bestSig.emotionalMessage,
      level: bestSig.level,
      category: bestSig.category,
      anxietyScore: bestSig.anxietyScore,
      features: serializeFeatures(features),
      embedding: Array.from(embedding),
      diag: mkDiag('confirmed', top1Key, top1Raw, top2Key, top2Raw),
    };
  }
}
