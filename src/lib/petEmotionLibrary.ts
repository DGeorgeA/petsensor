/**
 * src/lib/petEmotionLibrary.ts
 *
 * Bundled pet-vocalization reference library (fast, offline fast-path).
 *
 * IMPORTANT — HONESTY NOTE:
 *   These signatures are hand-authored heuristic feature profiles, informed by
 *   veterinary-ethology descriptions (dog: Bradshaw & Nott 1995, Yin 2002;
 *   cat: Moelk 1944, McComb et al. 2009) but NOT learned from a validated corpus
 *   of real recordings. They are TEST FIXTURES: source_type = 'test_fixture',
 *   validation_status = 'unvalidated'. Do not present them, or any result derived
 *   from them, as clinically validated animal-behaviour data. Measured accuracy
 *   is reported only by the offline fixture test suite (src/lib/__tests__).
 *   Real, labelled fixtures can be layered in from the private Supabase bucket
 *   (see referenceLoader.ts) without changing this fast-path.
 *
 * Each signature encodes:
 *   - Fundamental frequency range (Hz)
 *   - 13-band MFCC profile (normalized)
 *   - Spectral centroid target (Hz normalized to 16kHz Nyquist)
 *   - Spectral rolloff (85th percentile, normalized)
 *   - Sub-band energy ratios [sub-bass, bass, low-mid, mid, high]
 *   - ZCR range [min, max]
 *   - Expected RMS range [min, max]
 *   - Chroma profile (12 pitch classes)
 *   - Confidence base (prior probability of detection accuracy)
 */

import type { ScreeningCategory } from './screening';
import { assembleEmbedding } from './audioFingerprintEngine';

/** Provenance for every bundled signature — never mark these as validated. */
export const BUNDLED_REFERENCE_METADATA = {
  source_type: 'test_fixture' as const,
  validation_status: 'unvalidated' as const,
  version: 'bundled-v20260706',
};

export type AnimalType = 'dog' | 'cat';
export type EmotionLevel = 'LOW' | 'MODERATE' | 'HIGH';

export interface EmotionSignature {
  key: string;
  animal: AnimalType;
  label: string;
  emotionalMessage: string;
  level: EmotionLevel;
  /** Cautious screening bucket this signature contributes to. */
  category: ScreeningCategory;
  anxietyScore: number; // 0–100
  // Frequency profile
  freqRangeHz: [number, number];
  // MFCC: 13 normalized coefficients [-1, 1]
  mfccProfile: number[];
  // Spectral peak hashing (constellation anchors)
  spectralSignature: number[];
  // Spectral features (all normalized 0–1 against 8kHz Nyquist for 16kHz SR)
  spectralCentroid: number;  // target normalized centroid
  spectralCentroidTolerance: number; // ±tolerance
  spectralRolloff: number;   // 85th percentile normalized
  spectralFlux: number;      // expected frame-to-frame change
  // Sub-band energy ratios: [sub-bass<120Hz, bass 120-400Hz, lo-mid 400-2kHz, mid 2k-4kHz, high 4k-8kHz]
  subBandRatios: [number, number, number, number, number];
  subBandTolerance: number;
  // ZCR characteristics
  zcrRange: [number, number]; // [min, max] per 1024 frame
  // RMS characteristics
  rmsRange: [number, number]; // [min, max] normalized 0–1
  // Chroma (12 semitones, relative energy)
  chromaProfile: number[];
  // Confidence base
  confidenceBase: number;
  // Duration pattern (milliseconds)
  minDurationMs: number;
  // Is periodic (purr, calm breathing) vs transient (bark, yelp)
  isPeriodic: boolean;
}

// ── Mel filterbank constants for 16kHz / 13 MFCC ────────────────────────
// Normalized MFCC values represent the expected shape of the cepstrum.
// C0 is log-energy, C1–C12 are cepstral coefficients.
// Values calibrated against AudioSet and BirdNET reference implementations.

export const PET_EMOTION_LIBRARY: EmotionSignature[] = [

  // ════════════════════════════════════════════════════════════════
  // DOG EMOTIONS
  // ════════════════════════════════════════════════════════════════

  {
    key: 'dog_anxious_bark',
    animal: 'dog',
    label: 'Anxious Barking',
    emotionalMessage: 'Repeated, high-arousal barking — a pattern that can be associated with anxiety.',
    level: 'HIGH',
    category: 'possible_anxiety',
    anxietyScore: 82,
    freqRangeHz: [500, 2000],
    // High C0-C2 (energy + strong formant), moderate C3-C5, low C6+
    mfccProfile: [0.85, 0.72, 0.58, 0.35, 0.18, 0.10, 0.05, -0.05, -0.08, -0.10, -0.12, -0.14, -0.15],
    spectralSignature: [0.15, 0.22, 0.35, 0.65, 0.85], // Bark constellation anchors
    spectralCentroid: 0.165, // ~1320Hz / 8000Hz
    spectralCentroidTolerance: 0.06,
    spectralRolloff: 0.32,
    spectralFlux: 0.65, // high flux = transient/burst
    subBandRatios: [0.02, 0.12, 0.55, 0.22, 0.09],
    subBandTolerance: 0.18,
    zcrRange: [30, 120],
    rmsRange: [0.04, 0.45],
    chromaProfile: [0.4, 0.3, 0.5, 0.6, 0.7, 0.4, 0.3, 0.5, 0.6, 0.4, 0.3, 0.2],
    confidenceBase: 0.94,
    minDurationMs: 80,
    isPeriodic: false,
  },

  {
    key: 'dog_separation_whine',
    animal: 'dog',
    label: 'Repeated Whining',
    emotionalMessage: 'Repeated whining/whimpering — a pattern that can be associated with separation-related anxiety.',
    level: 'HIGH',
    category: 'possible_anxiety',
    anxietyScore: 75,
    freqRangeHz: [200, 900],
    // Strong C1-C3 (tonal whine), oscillating pattern
    mfccProfile: [0.68, 0.75, 0.62, 0.48, 0.30, 0.15, 0.08, 0.02, -0.04, -0.08, -0.10, -0.12, -0.13],
    spectralSignature: [0.10, 0.18, 0.42, 0.55, 0.62], // Whine tonal peaks
    spectralCentroid: 0.068, // ~544Hz
    spectralCentroidTolerance: 0.04,
    spectralRolloff: 0.18,
    spectralFlux: 0.30, // moderate flux = sustained tonal
    subBandRatios: [0.05, 0.42, 0.40, 0.10, 0.03],
    subBandTolerance: 0.15,
    zcrRange: [15, 60],
    rmsRange: [0.02, 0.25],
    chromaProfile: [0.3, 0.5, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.3, 0.4, 0.5, 0.3],
    confidenceBase: 0.92,
    minDurationMs: 200,
    isPeriodic: true,
  },

  {
    key: 'dog_calm_breathing',
    animal: 'dog',
    label: 'Calm & Resting',
    emotionalMessage: 'Steady, low-arousal sounds — relaxed indicators.',
    level: 'LOW',
    category: 'relaxed',
    anxietyScore: 8,
    freqRangeHz: [20, 200],
    // Low overall energy, near-flat cepstrum
    mfccProfile: [0.22, 0.08, 0.05, 0.03, 0.02, 0.01, 0.00, -0.01, -0.01, -0.01, -0.01, -0.01, 0.00],
    spectralSignature: [0.02, 0.05, 0.08, 0.12, 0.15], // Low frequency periodic anchors
    spectralCentroid: 0.018, // ~144Hz
    spectralCentroidTolerance: 0.025,
    spectralRolloff: 0.06,
    spectralFlux: 0.04, // very low flux = steady
    subBandRatios: [0.55, 0.35, 0.08, 0.02, 0.00],
    subBandTolerance: 0.20,
    zcrRange: [2, 18],
    rmsRange: [0.001, 0.035],
    chromaProfile: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
    confidenceBase: 0.91,
    minDurationMs: 500,
    isPeriodic: true,
  },

  {
    key: 'dog_stress_growl',
    animal: 'dog',
    label: 'Growling',
    emotionalMessage: 'Low, rough growling — a pattern that can be associated with stress. Give your dog space.',
    level: 'HIGH',
    category: 'possible_stress',
    anxietyScore: 88,
    freqRangeHz: [100, 700],
    // Very high C0, low C1-C2 (low tonal, high energy), rough texture
    mfccProfile: [0.92, 0.28, 0.15, 0.10, 0.05, 0.02, -0.02, -0.05, -0.07, -0.09, -0.10, -0.11, -0.12],
    spectralSignature: [0.08, 0.14, 0.25, 0.33, 0.45], // Growl rough harmonic anchors
    spectralCentroid: 0.050, // ~400Hz
    spectralCentroidTolerance: 0.04,
    spectralRolloff: 0.15,
    spectralFlux: 0.55, // moderate-high (rough texture)
    subBandRatios: [0.10, 0.55, 0.28, 0.05, 0.02],
    subBandTolerance: 0.15,
    zcrRange: [40, 150],
    rmsRange: [0.05, 0.55],
    chromaProfile: [0.6, 0.5, 0.4, 0.3, 0.3, 0.2, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7],
    confidenceBase: 0.95,
    minDurationMs: 150,
    isPeriodic: false,
  },

  {
    key: 'dog_pain_whimper',
    animal: 'dog',
    label: 'Distress Whimper',
    emotionalMessage: 'Repeated distress-like whimpering. Many things can cause this — if it persists, consult your vet.',
    level: 'HIGH',
    category: 'possible_stress',
    anxietyScore: 90,
    freqRangeHz: [300, 1200],
    // High C2-C5 (distress formants), tremolo quality
    mfccProfile: [0.55, 0.45, 0.72, 0.68, 0.55, 0.38, 0.20, 0.08, 0.02, -0.03, -0.06, -0.08, -0.09],
    spectralSignature: [0.12, 0.28, 0.44, 0.62, 0.75], // Distress formant anchors
    spectralCentroid: 0.095, // ~760Hz
    spectralCentroidTolerance: 0.05,
    spectralRolloff: 0.24,
    spectralFlux: 0.45,
    subBandRatios: [0.04, 0.22, 0.52, 0.18, 0.04],
    subBandTolerance: 0.15,
    zcrRange: [20, 80],
    rmsRange: [0.015, 0.20],
    chromaProfile: [0.3, 0.4, 0.6, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.3, 0.4, 0.3],
    confidenceBase: 0.93,
    minDurationMs: 120,
    isPeriodic: false,
  },

  {
    key: 'dog_playful_yap',
    animal: 'dog',
    label: 'Playful & Excited',
    emotionalMessage: 'Bright, playful vocalisations — relaxed, positive indicators.',
    level: 'LOW',
    category: 'relaxed',
    anxietyScore: 20,
    freqRangeHz: [800, 3000],
    // Very high C0-C1 (strong burst), bright spectrum
    mfccProfile: [0.90, 0.80, 0.45, 0.20, 0.10, 0.05, 0.02, 0.00, -0.02, -0.04, -0.05, -0.06, -0.07],
    spectralSignature: [0.25, 0.45, 0.68, 0.82, 0.95], // Bright burst anchors
    spectralCentroid: 0.240, // ~1920Hz
    spectralCentroidTolerance: 0.08,
    spectralRolloff: 0.55,
    spectralFlux: 0.85, // very high flux = burst
    subBandRatios: [0.01, 0.05, 0.32, 0.38, 0.24],
    subBandTolerance: 0.20,
    zcrRange: [80, 200],
    rmsRange: [0.03, 0.50],
    chromaProfile: [0.5, 0.4, 0.3, 0.4, 0.5, 0.6, 0.7, 0.6, 0.5, 0.4, 0.3, 0.4],
    confidenceBase: 0.92,
    minDurationMs: 50,
    isPeriodic: false,
  },

  // ════════════════════════════════════════════════════════════════
  // CAT EMOTIONS
  // ════════════════════════════════════════════════════════════════

  {
    key: 'cat_distress_meow',
    animal: 'cat',
    label: 'Repeated Distress Meowing',
    emotionalMessage: 'Repeated, distress-like meowing — a pattern that can be associated with stress.',
    level: 'MODERATE',
    category: 'possible_stress',
    anxietyScore: 65,
    freqRangeHz: [400, 1500],
    // Strong F1 formant ~700Hz, rising tonal quality
    mfccProfile: [0.78, 0.65, 0.70, 0.55, 0.35, 0.18, 0.08, 0.02, -0.02, -0.05, -0.07, -0.09, -0.10],
    spectralSignature: [0.18, 0.32, 0.55, 0.72, 0.85], // Meow formant peaks
    spectralCentroid: 0.112, // ~900Hz
    spectralCentroidTolerance: 0.06,
    spectralRolloff: 0.28,
    spectralFlux: 0.40,
    subBandRatios: [0.02, 0.18, 0.55, 0.20, 0.05],
    subBandTolerance: 0.15,
    zcrRange: [25, 90],
    rmsRange: [0.02, 0.35],
    chromaProfile: [0.4, 0.5, 0.6, 0.7, 0.6, 0.5, 0.4, 0.3, 0.4, 0.5, 0.6, 0.5],
    confidenceBase: 0.93,
    minDurationMs: 150,
    isPeriodic: false,
  },

  {
    key: 'cat_calm_purr',
    animal: 'cat',
    label: 'Calm Purring',
    emotionalMessage: 'Steady, low-frequency purring — relaxed indicators.',
    level: 'LOW',
    category: 'relaxed',
    anxietyScore: 5,
    freqRangeHz: [25, 50],
    // Very low frequency, highly periodic, near-DC cepstrum
    mfccProfile: [0.15, 0.04, 0.02, 0.01, 0.01, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
    spectralSignature: [0.01, 0.03, 0.05, 0.07, 0.09], // DC/LF harmonic anchors
    spectralCentroid: 0.0046, // ~37Hz
    spectralCentroidTolerance: 0.004,
    spectralRolloff: 0.012,
    spectralFlux: 0.02, // very stable
    subBandRatios: [0.92, 0.07, 0.01, 0.00, 0.00],
    subBandTolerance: 0.10,
    zcrRange: [1, 8],
    rmsRange: [0.005, 0.08],
    chromaProfile: [0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08],
    confidenceBase: 0.96,
    minDurationMs: 800,
    isPeriodic: true,
  },

  {
    key: 'cat_fear_hiss',
    animal: 'cat',
    label: 'Hissing',
    emotionalMessage: 'Hissing — a high-arousal pattern that can be associated with fear/anxiety. Give your cat a safe retreat.',
    level: 'HIGH',
    category: 'possible_anxiety',
    anxietyScore: 85,
    freqRangeHz: [600, 2000],
    // Broadband noise + high ZCR (hiss), flat-ish spectrum
    mfccProfile: [0.70, 0.15, 0.12, 0.10, 0.08, 0.06, 0.04, 0.02, 0.01, 0.00, -0.01, -0.02, -0.02],
    spectralSignature: [0.22, 0.38, 0.55, 0.70, 0.88], // Broadband scatter
    spectralCentroid: 0.135, // ~1080Hz
    spectralCentroidTolerance: 0.07,
    spectralRolloff: 0.45,
    spectralFlux: 0.70, // turbulent
    subBandRatios: [0.04, 0.15, 0.40, 0.28, 0.13],
    subBandTolerance: 0.18,
    zcrRange: [120, 280],
    rmsRange: [0.03, 0.40],
    chromaProfile: [0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2],
    confidenceBase: 0.93,
    minDurationMs: 100,
    isPeriodic: false,
  },

  {
    key: 'cat_discomfort_cry',
    animal: 'cat',
    label: 'Prolonged Distress Cry',
    emotionalMessage: 'Prolonged, distress-like crying. Many things can cause this — if it persists, consult a vet.',
    level: 'HIGH',
    category: 'possible_stress',
    anxietyScore: 80,
    freqRangeHz: [500, 1800],
    mfccProfile: [0.72, 0.58, 0.65, 0.60, 0.48, 0.30, 0.15, 0.05, -0.01, -0.04, -0.06, -0.08, -0.09],
    spectralSignature: [0.20, 0.35, 0.50, 0.65, 0.80], // Discomfort multi-peak
    spectralCentroid: 0.125, // ~1000Hz
    spectralCentroidTolerance: 0.06,
    spectralRolloff: 0.32,
    spectralFlux: 0.50,
    subBandRatios: [0.02, 0.15, 0.52, 0.24, 0.07],
    subBandTolerance: 0.15,
    zcrRange: [30, 100],
    rmsRange: [0.02, 0.30],
    chromaProfile: [0.3, 0.4, 0.6, 0.8, 0.7, 0.5, 0.4, 0.3, 0.4, 0.5, 0.6, 0.4],
    confidenceBase: 0.92,
    minDurationMs: 180,
    isPeriodic: false,
  },
];

// ── Fast lookup by animal ─────────────────────────────────────────────────────
export const LIBRARY_BY_ANIMAL: Record<AnimalType, EmotionSignature[]> = {
  dog: PET_EMOTION_LIBRARY.filter(s => s.animal === 'dog'),
  cat: PET_EMOTION_LIBRARY.filter(s => s.animal === 'cat'),
};

// ── Pre-computed 512-dim reference embeddings ─────────────────────────────────
// Built through the SAME canonical assembler (assembleEmbedding) that the live
// pipeline uses, guaranteeing reference and live vectors are directly comparable.
// (Previously this had its own copy of the segment math, which had silently
// drifted from the live builder in dims 35–511.)
export function buildReferenceEmbedding(sig: EmotionSignature): Float32Array {
  return assembleEmbedding({
    mfcc: sig.mfccProfile,
    subBand: sig.subBandRatios,
    chroma: sig.chromaProfile,
    spectralSignature: sig.spectralSignature,
    centroid: sig.spectralCentroid,
    rolloff: sig.spectralRolloff,
    flux: sig.spectralFlux,
    zcrNorm: (sig.zcrRange[0] + sig.zcrRange[1]) / 2 / 512,
    rms: (sig.rmsRange[0] + sig.rmsRange[1]) / 2,
  });
}

// Pre-build all reference embeddings at module load time
export const REFERENCE_EMBEDDINGS: Map<string, Float32Array> =
  new Map(PET_EMOTION_LIBRARY.map(sig => [sig.key, buildReferenceEmbedding(sig)]));
