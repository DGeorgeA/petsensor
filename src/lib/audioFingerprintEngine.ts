/**
 * src/lib/audioFingerprintEngine.ts
 *
 * Production-grade Shazam/BirdNET-inspired audio fingerprinting engine.
 *
 * Pipeline (all runs in Web Worker context):
 *   PCM Float32 → Windowing → FFT → Mel Filterbank → MFCC
 *                                 → Spectral Features
 *                                 → Chroma
 *                                 → Sub-band Energy
 *   Features → 512-dim Embedding → Cosine Similarity
 *   → Temporal Buffer → Confidence Gate → False Positive Rejection
 *
 * References:
 *   - Shazam: Wang (2003) "An Industrial-Strength Audio Search Algorithm"
 *   - BirdNET: Kahl et al. (2021) "BirdNET: A deep learning solution for avian diversity"
 *   - YAMNet: Howard et al. (2019) AudioSet embedding architecture
 *   - VGGish: Hershey et al. (2017) CNN architectures for large-scale audio classification
 */

import type { EmotionSignature } from './petEmotionLibrary';

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
export const SAMPLE_RATE = 16000;
export const FFT_SIZE = 2048;
export const HOP_SIZE = 1024; // 50% overlap
export const MEL_BANDS = 26;
export const MFCC_COEFFS = 13;
export const EMBEDDING_DIM = 512;
export const CHROMA_BINS = 12;
export const SUB_BANDS = 5;

// Temporal confidence window: require 3 consecutive matching frames
export const TEMPORAL_WINDOW = 5;
export const REQUIRED_CONSECUTIVE = 3;
export const CONFIDENCE_THRESHOLD = 0.92; // tight cosine similarity gate

// Species/context gate: an audible, structured sound whose BEST weighted match
// across the selected species' library is below this floor is treated as an
// UNSUPPORTED subject (audible, but nowhere near a dog/cat vocalization), rather
// than being force-fit toward the nearest emotion. Well below the accumulation
// threshold (0.92 * 0.85 ≈ 0.78) so it never blocks a genuine match.
export const SPECIES_CONTEXT_FLOOR = 0.35;

// False-positive rejection thresholds are applied inline in detectFalsePositive().

// ── HANN WINDOW ───────────────────────────────────────────────────────────────
function buildHannWindow(size: number): Float32Array {
  const w = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
  }
  return w;
}

// ── RADIX-2 COOLEY-TUKEY FFT ──────────────────────────────────────────────────
// In-place FFT on interleaved [real, imag] Float32Array of length 2*N
function fft(re: Float32Array, im: Float32Array): void {
  const n = re.length;
  // Bit-reversal permutation
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  // Butterfly operations
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (2 * Math.PI) / len;
    const wRe = Math.cos(ang);
    const wIm = -Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let curRe = 1, curIm = 0;
      for (let j = 0; j < len / 2; j++) {
        const uRe = re[i + j], uIm = im[i + j];
        const vRe = re[i + j + len / 2] * curRe - im[i + j + len / 2] * curIm;
        const vIm = re[i + j + len / 2] * curIm + im[i + j + len / 2] * curRe;
        re[i + j] = uRe + vRe;
        im[i + j] = uIm + vIm;
        re[i + j + len / 2] = uRe - vRe;
        im[i + j + len / 2] = uIm - vIm;
        [curRe, curIm] = [curRe * wRe - curIm * wIm, curRe * wIm + curIm * wRe];
      }
    }
  }
}

// ── MEL FILTERBANK ────────────────────────────────────────────────────────────
// Returns MEL_BANDS × (FFT_SIZE/2) filterbank matrix
let _melFilters: Float32Array[] | null = null;
function getMelFilterbank(): Float32Array[] {
  if (_melFilters) return _melFilters;
  const nFft = FFT_SIZE / 2 + 1;
  const melMin = hzToMel(20);
  const melMax = hzToMel(SAMPLE_RATE / 2);
  const melPoints = new Float32Array(MEL_BANDS + 2);
  for (let i = 0; i < MEL_BANDS + 2; i++) {
    melPoints[i] = melToHz(melMin + (i / (MEL_BANDS + 1)) * (melMax - melMin));
  }
  _melFilters = [];
  for (let m = 0; m < MEL_BANDS; m++) {
    const filter = new Float32Array(nFft);
    const fLow = melPoints[m];
    const fCenter = melPoints[m + 1];
    const fHigh = melPoints[m + 2];
    for (let k = 0; k < nFft; k++) {
      const hz = (k / nFft) * (SAMPLE_RATE / 2);
      if (hz >= fLow && hz <= fCenter) {
        filter[k] = (hz - fLow) / (fCenter - fLow);
      } else if (hz > fCenter && hz <= fHigh) {
        filter[k] = (fHigh - hz) / (fHigh - fCenter);
      }
    }
    _melFilters.push(filter);
  }
  return _melFilters;
}

function hzToMel(hz: number): number { return 2595 * Math.log10(1 + hz / 700); }
function melToHz(mel: number): number { return 700 * (Math.pow(10, mel / 2595) - 1); }

// ── DCT (Type-II) for MFCC ───────────────────────────────────────────────────
function dct(input: Float32Array, numCoeffs: number): Float32Array {
  const n = input.length;
  const out = new Float32Array(numCoeffs);
  const scale = Math.sqrt(2 / n);
  for (let k = 0; k < numCoeffs; k++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += input[i] * Math.cos((Math.PI * k * (2 * i + 1)) / (2 * n));
    }
    out[k] = scale * sum;
  }
  return out;
}

// ── CHROMA FEATURES ───────────────────────────────────────────────────────────
function computeChroma(magnitudes: Float32Array): Float32Array {
  const chroma = new Float32Array(CHROMA_BINS);
  const n = magnitudes.length;
  for (let k = 1; k < n; k++) {
    const hz = (k / n) * (SAMPLE_RATE / 2);
    if (hz < 20) continue;
    const pitchClass = Math.round(12 * Math.log2(hz / 440)) % 12;
    const pc = ((pitchClass % 12) + 12) % 12;
    chroma[pc] += magnitudes[k];
  }
  // Normalize
  let maxC = 0;
  for (let i = 0; i < 12; i++) if (chroma[i] > maxC) maxC = chroma[i];
  if (maxC > 0) for (let i = 0; i < 12; i++) chroma[i] /= maxC;
  return chroma;
}

// ── SPECTRAL FEATURES ─────────────────────────────────────────────────────────
export interface SpectralFeatures {
  rms: number;
  zcr: number;
  spectralCentroid: number;    // normalized 0–1
  spectralRolloff: number;     // normalized 0–1
  spectralFlux: number;        // 0–1 (frame-to-frame change)
  spectralFlatness: number;    // 0–1 (Wiener entropy)
  subBandEnergy: Float32Array; // 5-band ratios
  mfcc: Float32Array;          // 13 coefficients
  chroma: Float32Array;        // 12 bins
  f0Estimate: number;          // Hz, rough fundamental frequency
  spectralSignature: Float32Array; // Top 5 spectral peaks (constellation anchors)
}

export interface AudioFingerprint {
  features: SpectralFeatures;
  embedding: Float32Array;     // 512-dim L2-normalized
}

// ── SPECTRAL PEAK FINDING (Constellation mapping) ─────────────────────────────
function findSpectralPeaks(mag: Float32Array, topN: number = 5): Float32Array {
  const peaks = [];
  const nBins = mag.length;
  // Local maxima search
  for (let i = 2; i < nBins - 2; i++) {
    if (mag[i] > mag[i-1] && mag[i] > mag[i+1] && mag[i] > mag[i-2] && mag[i] > mag[i+2]) {
      peaks.push({ bin: i, mag: mag[i] });
    }
  }
  // Sort by magnitude
  peaks.sort((a, b) => b.mag - a.mag);
  
  // Hash the top N peaks (normalize bin index to 0-1)
  const hash = new Float32Array(topN);
  for (let i = 0; i < topN; i++) {
    hash[i] = i < peaks.length ? peaks[i].bin / nBins : 0;
  }
  return hash;
}

// ── MAIN FEATURE EXTRACTOR ────────────────────────────────────────────────────
const HANN = buildHannWindow(FFT_SIZE);
let _prevMagnitudes: Float32Array | null = null;

/**
 * Reset the spectral-flux frame-to-frame state. MUST be called at the start of
 * every independent stream (each reference clip, each new live scan) so one
 * clip's last frame can never contaminate the next clip's first-frame flux —
 * a reference/live invariant (P10) verified by audioInvariants.ts.
 */
export function resetStreamState(): void {
  _prevMagnitudes = null;
}

export function extractFeatures(pcm: Float32Array): AudioFingerprint {
  const frameLen = Math.min(pcm.length, FFT_SIZE);

  // 1. Apply Hann window + zero-pad
  const re = new Float32Array(FFT_SIZE);
  const im = new Float32Array(FFT_SIZE);
  for (let i = 0; i < frameLen; i++) {
    re[i] = pcm[i] * HANN[i];
  }

  // 2. FFT
  fft(re, im);

  // 3. Magnitude spectrum (one-sided)
  const nBins = FFT_SIZE / 2 + 1;
  const mag = new Float32Array(nBins);
  let totalEnergy = 0;
  for (let k = 0; k < nBins; k++) {
    mag[k] = Math.sqrt(re[k] * re[k] + im[k] * im[k]);
    totalEnergy += mag[k];
  }

  // 4. Power spectrum (log)
  const power = new Float32Array(nBins);
  for (let k = 0; k < nBins; k++) {
    power[k] = mag[k] * mag[k];
  }

  // ── RMS ───────────────────────────────────────────────────────────────────
  let sumSq = 0;
  for (let i = 0; i < frameLen; i++) sumSq += pcm[i] * pcm[i];
  const rms = Math.sqrt(sumSq / frameLen);

  // ── ZCR ───────────────────────────────────────────────────────────────────
  let zcr = 0;
  for (let i = 1; i < frameLen; i++) {
    if ((pcm[i - 1] >= 0) !== (pcm[i] >= 0)) zcr++;
  }

  // ── Spectral Centroid ─────────────────────────────────────────────────────
  let wNum = 0;
  for (let k = 0; k < nBins; k++) wNum += k * mag[k];
  const centroidBin = totalEnergy > 0 ? wNum / totalEnergy : 0;
  const spectralCentroid = centroidBin / nBins; // normalized 0–1

  // ── Spectral Rolloff (85th percentile) ───────────────────────────────────
  const target = 0.85 * totalEnergy;
  let cumulative = 0, rolloffBin = 0;
  for (let k = 0; k < nBins; k++) {
    cumulative += mag[k];
    if (cumulative >= target) { rolloffBin = k; break; }
  }
  const spectralRolloff = rolloffBin / nBins;

  // ── Spectral Flux ─────────────────────────────────────────────────────────
  let flux = 0;
  if (_prevMagnitudes) {
    for (let k = 0; k < nBins; k++) {
      const diff = mag[k] - _prevMagnitudes[k];
      flux += diff > 0 ? diff : 0; // half-wave rectified
    }
    flux /= nBins;
  }
  _prevMagnitudes = mag.slice();
  const spectralFlux = Math.min(flux / (totalEnergy / nBins + 1e-8), 1.0);

  // ── Spectral Flatness (Wiener entropy) ────────────────────────────────────
  let logSum = 0, linSum = 0, count = 0;
  for (let k = 1; k < nBins; k++) {
    if (mag[k] > 1e-10) {
      logSum += Math.log(mag[k]);
      linSum += mag[k];
      count++;
    }
  }
  const spectralFlatness = count > 0
    ? Math.exp(logSum / count) / (linSum / count + 1e-8)
    : 0;

  // ── Sub-band Energy Ratios ────────────────────────────────────────────────
  // Bands: [<120Hz, 120-400Hz, 400-2000Hz, 2000-4000Hz, 4000-8000Hz]
  const bandEdgesHz = [0, 120, 400, 2000, 4000, SAMPLE_RATE / 2];
  const subBandEnergy = new Float32Array(SUB_BANDS);
  let totalSubEnergy = 0;
  for (let b = 0; b < SUB_BANDS; b++) {
    const kLow = Math.floor(bandEdgesHz[b] / (SAMPLE_RATE / 2) * nBins);
    const kHigh = Math.floor(bandEdgesHz[b + 1] / (SAMPLE_RATE / 2) * nBins);
    for (let k = kLow; k < kHigh && k < nBins; k++) {
      subBandEnergy[b] += power[k];
      totalSubEnergy += power[k];
    }
  }
  if (totalSubEnergy > 0) {
    for (let b = 0; b < SUB_BANDS; b++) subBandEnergy[b] /= totalSubEnergy;
  }

  // ── Mel Filterbank + MFCC ─────────────────────────────────────────────────
  const filters = getMelFilterbank();
  const melEnergies = new Float32Array(MEL_BANDS);
  for (let m = 0; m < MEL_BANDS; m++) {
    let e = 0;
    for (let k = 0; k < nBins; k++) e += power[k] * filters[m][k];
    melEnergies[m] = Math.log(e + 1e-8);
  }
  const mfcc = dct(melEnergies, MFCC_COEFFS);

  // ── Chroma ────────────────────────────────────────────────────────────────
  const chroma = computeChroma(mag);

  // ── Rough F0 Estimate (autocorrelation peak) ──────────────────────────────
  // Used for human speech rejection
  const maxLag = Math.floor(SAMPLE_RATE / 80);  // ~80Hz minimum
  const minLag = Math.floor(SAMPLE_RATE / 400); // ~400Hz maximum
  let bestLag = 0, bestAutoCorr = 0;
  for (let lag = minLag; lag < maxLag && lag < frameLen; lag++) {
    let corr = 0;
    for (let i = 0; i < frameLen - lag; i++) corr += pcm[i] * pcm[i + lag];
    if (corr > bestAutoCorr) { bestAutoCorr = corr; bestLag = lag; }
  }
  const f0Estimate = bestLag > 0 ? SAMPLE_RATE / bestLag : 0;

  // ── Constellation Map (Spectral Peaks) ────────────────────────────────────
  const spectralSignature = findSpectralPeaks(mag, 5);

  // ── Build 512-dim embedding ───────────────────────────────────────────────
  const embedding = buildEmbedding(mfcc, subBandEnergy, chroma,
    spectralCentroid, spectralRolloff, spectralFlux, zcr, rms, spectralSignature);

  return {
    features: {
      rms, zcr, spectralCentroid, spectralRolloff,
      spectralFlux, spectralFlatness, subBandEnergy,
      mfcc, chroma, f0Estimate, spectralSignature,
    },
    embedding,
  };
}

// ── EMBEDDING BUILDER ─────────────────────────────────────────────────────────
// SINGLE canonical assembler used by BOTH live extraction and reference
// embedding generation, so live and reference vectors are byte-for-byte
// comparable. Any drift here would silently break the cosine gate — see the
// parity assertion test in src/lib/__tests__.
export interface EmbeddingParts {
  mfcc: ArrayLike<number>;             // 13
  subBand: ArrayLike<number>;          // 5
  chroma: ArrayLike<number>;           // 12
  spectralSignature: ArrayLike<number>; // 5 (constellation peaks)
  centroid: number;
  rolloff: number;
  flux: number;
  zcrNorm: number;                     // zcr / 512
  rms: number;
}

export function assembleEmbedding(p: EmbeddingParts): Float32Array {
  const emb = new Float32Array(EMBEDDING_DIM);

  for (let i = 0; i < 13; i++) emb[i] = p.mfcc[i];
  for (let i = 0; i < 5; i++) emb[13 + i] = p.subBand[i];
  for (let i = 0; i < 12; i++) emb[18 + i] = p.chroma[i];
  emb[30] = p.centroid;
  emb[31] = p.rolloff;
  emb[32] = p.flux;
  emb[33] = p.zcrNorm;
  emb[34] = p.rms;

  for (let i = 35; i < EMBEDDING_DIM; i++) {
    const cycle = i % 30;
    const base = cycle < 13 ? p.mfcc[cycle % 13] :
                 cycle < 18 ? p.subBand[(cycle - 13) % 5] :
                 cycle < 23 ? p.spectralSignature[(cycle - 18) % 5] :
                 p.chroma[(cycle - 23) % 12];
    const freqMod = Math.sin(i * p.centroid * Math.PI * 2 + p.flux);
    const chromaMod = Math.cos(i * 0.024 + p.chroma[i % 12] * Math.PI);
    emb[i] = base * 0.55 + freqMod * 0.30 + chromaMod * 0.15;
  }

  // L2-normalize
  let norm = 0;
  for (let i = 0; i < EMBEDDING_DIM; i++) norm += emb[i] * emb[i];
  norm = Math.sqrt(norm);
  if (norm > 0) for (let i = 0; i < EMBEDDING_DIM; i++) emb[i] /= norm;

  return emb;
}

function buildEmbedding(
  mfcc: Float32Array,
  subBand: Float32Array,
  chroma: Float32Array,
  centroid: number,
  rolloff: number,
  flux: number,
  zcr: number,
  rms: number,
  spectralSignature: Float32Array,
): Float32Array {
  return assembleEmbedding({
    mfcc, subBand, chroma, spectralSignature,
    centroid, rolloff, flux, zcrNorm: zcr / 512, rms,
  });
}

// ── COSINE SIMILARITY ─────────────────────────────────────────────────────────
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom > 0 ? dot / denom : 0;
}

// ── FALSE POSITIVE DETECTOR ───────────────────────────────────────────────────
export interface FPResult {
  isRejected: boolean;
  reason: string;
}

export function detectFalsePositive(features: SpectralFeatures): FPResult {
  // Rule 1: Silence (Strict bound < 0.015 as per plan)
  if (features.rms < 0.015) {
    return { isRejected: true, reason: 'silence' };
  }

  // Rule 2: Human Speech (F0 in 80–320Hz + High Formant Variation)
  if (features.f0Estimate > 80 && features.f0Estimate < 320) {
    // Check if mfcc C1/C2 ratios indicate vowel formants
    if (features.mfcc[1] > 0.4 && features.mfcc[2] < 0) {
      return { isRejected: true, reason: 'human_speech' };
    }
  }

  // Rule 3: Steady broadband noise / fan (High Wiener entropy > 0.70)
  if (features.spectralFlatness > 0.70) {
    return { isRejected: true, reason: 'steady_noise' };
  }

  // Rule 4: Transient Clicks (e.g., keyboard) - High flux but low sustained RMS
  if (features.spectralFlux > 0.8 && features.rms < 0.05) {
    return { isRejected: true, reason: 'transient_click' };
  }

  return { isRejected: false, reason: '' };
}

// ── TEMPORAL CONFIDENCE BUFFER ────────────────────────────────────────────────
export interface TemporalMatch {
  key: string;
  count: number;
  similarities: number[];
  rmsHistory: number[];
  centroidHistory: number[];
}

export class TemporalBuffer {
  private windows: Array<{ key: string; similarity: number; rms: number; centroid: number }> = [];
  private readonly maxSize = TEMPORAL_WINDOW;

  push(key: string, similarity: number, rms: number, centroid: number) {
    this.windows.push({ key, similarity, rms, centroid });
    if (this.windows.length > this.maxSize) this.windows.shift();
  }

  clear() { this.windows = []; }

  /**
   * Returns a confirmed match if:
   * 1. Same key appears in >= REQUIRED_CONSECUTIVE consecutive windows
   * 2. Average cosine similarity >= CONFIDENCE_THRESHOLD
   * 3. RMS variance is stable (< 15%)
   * 4. Spectral centroid is stable (< 20%)
   */
  getConfirmedMatch(): { key: string; avgSimilarity: number } | null {
    if (this.windows.length < REQUIRED_CONSECUTIVE) return null;

    // Check last N windows for consecutive match
    const recent = this.windows.slice(-REQUIRED_CONSECUTIVE);
    const firstKey = recent[0].key;
    const allSameKey = recent.every(w => w.key === firstKey);
    if (!allSameKey) return null;

    // Similarity gate
    const avgSim = recent.reduce((s, w) => s + w.similarity, 0) / recent.length;
    if (avgSim < CONFIDENCE_THRESHOLD) return null;

    // RMS stability check (must be < 15% variance)
    const rmsValues = recent.map(w => w.rms);
    const rmsMean = rmsValues.reduce((s, v) => s + v, 0) / rmsValues.length;
    const rmsVar = rmsValues.reduce((s, v) => s + Math.abs(v - rmsMean), 0) / rmsValues.length;
    if (rmsMean > 0 && rmsVar / rmsMean > 0.15) return null; // > 15% variance = unstable

    // Spectral centroid stability (must be < 15% variance)
    const centroidValues = recent.map(w => w.centroid);
    const centMean = centroidValues.reduce((s, v) => s + v, 0) / centroidValues.length;
    const centVar = centroidValues.reduce((s, v) => s + Math.abs(v - centMean), 0) / centroidValues.length;
    if (centMean > 0 && centVar / centMean > 0.15) return null; // > 15% variance = unstable signal

    return { key: firstKey, avgSimilarity: avgSim };
  }
}

// ── WEIGHTED MULTI-FEATURE MATCHER ────────────────────────────────────────────
// Blends cosine embedding similarity with feature-level checks for robustness
export function weightedMatch(
  fingerprint: AudioFingerprint,
  signature: EmotionSignature,
  refEmbedding: Float32Array,
): number {
  const f = fingerprint.features;

  // 1. Cosine embedding similarity (primary, weight 0.55)
  const cosSim = cosineSimilarity(fingerprint.embedding, refEmbedding);

  // 2. Spectral centroid match (weight 0.15)
  const centroidDiff = Math.abs(f.spectralCentroid - signature.spectralCentroid);
  const centroidScore = Math.max(0, 1 - centroidDiff / (signature.spectralCentroidTolerance * 2));

  // 3. Sub-band energy match (weight 0.15)
  let subBandScore = 0;
  for (let b = 0; b < SUB_BANDS; b++) {
    const diff = Math.abs(f.subBandEnergy[b] - signature.subBandRatios[b]);
    subBandScore += Math.max(0, 1 - diff / (signature.subBandTolerance * 2));
  }
  subBandScore /= SUB_BANDS;

  // 4. ZCR range check (weight 0.08)
  const zcrInRange = f.zcr >= signature.zcrRange[0] && f.zcr <= signature.zcrRange[1] ? 1.0 :
    Math.max(0, 1 - Math.abs(f.zcr - (signature.zcrRange[0] + signature.zcrRange[1]) / 2) / 100);

  // 5. RMS range check (weight 0.07)
  const rmsInRange = f.rms >= signature.rmsRange[0] && f.rms <= signature.rmsRange[1] ? 1.0 :
    Math.max(0, 1 - Math.abs(f.rms - (signature.rmsRange[0] + signature.rmsRange[1]) / 2) / 0.3);

  // Weighted fusion
  const weighted = (
    cosSim        * 0.55 +
    centroidScore * 0.15 +
    subBandScore  * 0.15 +
    zcrInRange    * 0.08 +
    rmsInRange    * 0.07
  );

  // Apply confidence base prior
  return weighted * signature.confidenceBase;
}
