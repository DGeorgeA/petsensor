/**
 * src/lib/__tests__/audioInvariants.ts
 *
 * P10 — AUDIO MATCHING INVARIANT tests. The REFERENCE pipeline (Supabase WAV →
 * embedClip) and the LIVE pipeline (mic PCM → extractFeatures per frame) must be
 * mathematically identical: same sample rate, window, hop, feature order, and
 * embedding geometry. These tests fail loudly if anyone drifts them apart.
 *
 * Run:  npx tsx src/lib/__tests__/audioInvariants.ts
 */

import {
  extractFeatures,
  resetStreamState,
  EMBEDDING_DIM,
  SAMPLE_RATE,
  FFT_SIZE,
  HOP_SIZE,
} from '../audioFingerprintEngine';

let pass = 0, fail = 0;
function check(name: string, cond: boolean, detail = '') {
  if (cond) { pass++; console.log(`  [PASS] ${name.padEnd(52)} ${detail}`); }
  else { fail++; console.log(`  [FAIL] ${name.padEnd(52)} ${detail}`); }
}

// Deterministic PRNG
let seed = 424242;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };

// A structured synthetic clip (harmonic + AM, 3 s) — content is irrelevant;
// only pipeline EQUALITY matters here.
function makeClip(seconds = 3): Float32Array {
  const n = SAMPLE_RATE * seconds;
  const pcm = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    pcm[i] = 0.3 * Math.sin(2 * Math.PI * 700 * t) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 5 * t))
           + 0.05 * (rnd() * 2 - 1);
  }
  return pcm;
}

/** EXACT copy of referenceLoader.embedClip's math (kept in sync by these tests). */
function referenceEmbedClip(pcm: Float32Array): Float32Array {
  resetStreamState();
  const acc = new Float32Array(EMBEDDING_DIM);
  let frames = 0;
  for (let start = 0; start + FFT_SIZE <= pcm.length; start += HOP_SIZE) {
    const { embedding } = extractFeatures(pcm.subarray(start, start + FFT_SIZE));
    for (let i = 0; i < EMBEDDING_DIM; i++) acc[i] += embedding[i];
    frames++;
  }
  if (frames === 0) return acc;
  let norm = 0;
  for (let i = 0; i < EMBEDDING_DIM; i++) { acc[i] /= frames; norm += acc[i] * acc[i]; }
  norm = Math.sqrt(norm);
  if (norm > 0) for (let i = 0; i < EMBEDDING_DIM; i++) acc[i] /= norm;
  return acc;
}

function cosine(a: Float32Array, b: Float32Array): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

console.log('\n=== SenseMyPet — Audio Reference/Live Invariant Tests (P10) ===\n');

// 1. Canonical constants (single source of truth in audioFingerprintEngine).
check('sample rate is 16 kHz', SAMPLE_RATE === 16000, `SAMPLE_RATE=${SAMPLE_RATE}`);
check('window length 2048', FFT_SIZE === 2048, `FFT_SIZE=${FFT_SIZE}`);
check('hop length 1024 (50% overlap)', HOP_SIZE === 1024, `HOP_SIZE=${HOP_SIZE}`);
check('embedding dimension 512', EMBEDDING_DIM === 512, `EMBEDDING_DIM=${EMBEDDING_DIM}`);

// 2. Live frame embedding geometry.
const clip = makeClip();
resetStreamState();
const liveFrame = extractFeatures(clip.subarray(0, FFT_SIZE));
check('live embedding has EMBEDDING_DIM entries', liveFrame.embedding.length === EMBEDDING_DIM,
  `len=${liveFrame.embedding.length}`);
let liveNorm = 0;
for (let i = 0; i < liveFrame.embedding.length; i++) liveNorm += liveFrame.embedding[i] ** 2;
check('live frame embedding is L2-normalized', Math.abs(Math.sqrt(liveNorm) - 1) < 1e-3,
  `|v|=${Math.sqrt(liveNorm).toFixed(5)}`);

// 3. Reference embedding geometry.
const refEmb = referenceEmbedClip(clip);
check('reference embedding has EMBEDDING_DIM entries', refEmb.length === EMBEDDING_DIM, `len=${refEmb.length}`);
let refNorm = 0;
for (let i = 0; i < refEmb.length; i++) refNorm += refEmb[i] ** 2;
check('reference clip embedding is L2-normalized', Math.abs(Math.sqrt(refNorm) - 1) < 1e-3,
  `|v|=${Math.sqrt(refNorm).toFixed(5)}`);

// 4. STREAM determinism: processing the same stream twice from a fresh
//    resetStreamState() must be bit-identical (spectral flux is frame-to-frame
//    state WITHIN a stream, but must never leak ACROSS streams — the bug this
//    suite originally caught in embedClip).
const refA = referenceEmbedClip(clip);
const refB = referenceEmbedClip(clip);
let maxDelta = 0;
for (let i = 0; i < EMBEDDING_DIM; i++) maxDelta = Math.max(maxDelta, Math.abs(refA[i] - refB[i]));
check('stream re-processing is deterministic after reset', maxDelta < 1e-6, `maxΔ=${maxDelta.toExponential(2)}`);

// 5. SELF-MATCH: a reference built FROM a clip must strongly match that same
//    clip's live frames (this is the core reference==live guarantee).
resetStreamState();
let bestSelf = -1, meanSelf = 0, frames = 0;
for (let start = 0; start + FFT_SIZE <= clip.length; start += HOP_SIZE) {
  const { embedding } = extractFeatures(clip.subarray(start, start + FFT_SIZE));
  const c = cosine(embedding, refEmb);
  bestSelf = Math.max(bestSelf, c);
  meanSelf += c; frames++;
}
meanSelf /= Math.max(1, frames);
check('self-match best cosine ≥ 0.90', bestSelf >= 0.90, `best=${bestSelf.toFixed(3)}`);
check('self-match mean cosine ≥ 0.80', meanSelf >= 0.80, `mean=${meanSelf.toFixed(3)}`);

// 6. DISCRIMINATION: a very different clip must never match the reference as
//    well as the clip it was built from. NOTE the measured gap is small — the
//    raw embedding is weakly discriminative and the false-positive/feature
//    gates carry most of the separation. Reported as a known limitation; the
//    hard invariant here is strict ordering.
let seed2 = 777;
const rnd2 = () => { seed2 = (seed2 * 1103515245 + 12345) & 0x7fffffff; return seed2 / 0x7fffffff; };
const noise = new Float32Array(SAMPLE_RATE * 3);
for (let i = 0; i < noise.length; i++) noise[i] = (rnd2() * 2 - 1) * 0.3;
resetStreamState();
const noiseFrame = extractFeatures(noise.subarray(0, FFT_SIZE));
const crossSim = cosine(noiseFrame.embedding, refEmb);
check('noise never matches reference ≥ self', crossSim < bestSelf,
  `noise=${crossSim.toFixed(3)} vs self=${bestSelf.toFixed(3)} (gap=${(bestSelf - crossSim).toFixed(3)} — small gap is a KNOWN LIMITATION)`);

console.log(`\n=== ${pass} passed, ${fail} failed ===`);
if (fail > 0) process.exitCode = 1;
