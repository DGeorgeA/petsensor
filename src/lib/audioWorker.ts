/**
 * src/lib/audioWorker.ts  (Web Worker)
 *
 * Receives raw PCM Float32Array from AudioWorklet,
 * runs the full fingerprinting pipeline off the React thread,
 * and posts back confirmed emotional detections with confidence scores.
 */

import {
  extractFeatures,
  cosineSimilarity,
  weightedMatch,
  detectFalsePositive,
  TemporalBuffer,
  CONFIDENCE_THRESHOLD,
  type AudioFingerprint,
} from './audioFingerprintEngine';

import {
  LIBRARY_BY_ANIMAL,
  REFERENCE_EMBEDDINGS,
  type AnimalType,
  type EmotionSignature,
} from './petEmotionLibrary';

// ── State per worker (persists across frames) ─────────────────────────────────
const temporalBuffers: Record<string, TemporalBuffer> = {
  dog: new TemporalBuffer(),
  cat: new TemporalBuffer(),
  horse: new TemporalBuffer(),
};

// Exponential moving average for temporal smoothing of similarity scores
const EMA_ALPHA = 0.35;
let emaSmoothed: Record<string, number> = {};

// ── Worker message handler ────────────────────────────────────────────────────
self.onmessage = function (e: MessageEvent) {
  const { pcm, animalType } = e.data as {
    pcm: Float32Array;
    animalType: AnimalType;
  };

  if (!pcm || !animalType) return;

  try {
    // ── STEP 1: Extract features ───────────────────────────────────────────
    const fingerprint: AudioFingerprint = extractFeatures(pcm);
    const { features, embedding } = fingerprint;

    // ── STEP 2: False positive rejection ──────────────────────────────────
    const fpCheck = detectFalsePositive(features);
    if (fpCheck.isRejected) {
      temporalBuffers[animalType].clear();
      self.postMessage({
        type: 'NO_DETECTION',
        reason: fpCheck.reason,
        message: 'No emotional anomalies detected.',
        features: serializeFeatures(features),
      });
      return;
    }

    // ── STEP 3: Match against reference library ────────────────────────────
    const library = LIBRARY_BY_ANIMAL[animalType];
    let bestKey = '';
    let bestScore = -1;
    let bestSig: EmotionSignature | null = null;

    for (const sig of library) {
      const refEmb = REFERENCE_EMBEDDINGS.get(sig.key);
      if (!refEmb) continue;

      const score = weightedMatch(fingerprint, sig, refEmb);

      // EMA smoothing per key to reduce jitter
      const prevEma = emaSmoothed[sig.key] ?? score;
      const smoothed = EMA_ALPHA * score + (1 - EMA_ALPHA) * prevEma;
      emaSmoothed[sig.key] = smoothed;

      if (smoothed > bestScore) {
        bestScore = smoothed;
        bestKey = sig.key;
        bestSig = sig;
      }
    }

    // ── STEP 4: Push to temporal buffer ───────────────────────────────────
    if (bestKey && bestScore >= CONFIDENCE_THRESHOLD * 0.85) {
      // Allow slightly lower threshold for temporal accumulation
      temporalBuffers[animalType].push(
        bestKey,
        bestScore,
        features.rms,
        features.spectralCentroid,
      );
    } else {
      // Clear on miss
      temporalBuffers[animalType].clear();
      self.postMessage({
        type: 'NO_DETECTION',
        reason: 'below_threshold',
        features: serializeFeatures(features),
      });
      return;
    }

    // ── STEP 5: Temporal gate — require 3 consecutive matches ──────────────
    const confirmed = temporalBuffers[animalType].getConfirmedMatch();
    if (!confirmed) {
      self.postMessage({
        type: 'ACCUMULATING',
        bestKey,
        progress: bestScore,
        features: serializeFeatures(features),
      });
      return;
    }

    // ── STEP 6: Emit confirmed detection ──────────────────────────────────
    if (!bestSig) {
      self.postMessage({ type: 'NO_DETECTION', reason: 'sig_not_found', features: serializeFeatures(features) });
      return;
    }

    self.postMessage({
      type: 'DETECTION',
      key: confirmed.key,
      similarity: confirmed.avgSimilarity,
      label: bestSig.label,
      emotionalMessage: bestSig.emotionalMessage,
      level: bestSig.level,
      anxietyScore: bestSig.anxietyScore,
      features: serializeFeatures(features),
      embedding: Array.from(embedding),
    });

  } catch (err) {
    self.postMessage({ type: 'ERROR', error: String(err) });
  }
};

function serializeFeatures(f: ReturnType<typeof extractFeatures>['features']) {
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
