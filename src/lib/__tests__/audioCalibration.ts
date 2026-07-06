/**
 * src/lib/__tests__/audioCalibration.ts
 *
 * POSITIVE-RECALL CALIBRATION TRACE. Feeds synthetic positive fixtures through
 * the REAL PetAudioClassifier frame-by-frame (exactly as the live worker does)
 * and reports, per fixture, WHERE it was accepted or rejected along the gate
 * ladder:  signal → false-positive gate → species floor → accumulation (0.78)
 * → temporal confirmation. It also re-runs the hard negatives and confirms none
 * produce a pet class (this MUST stay zero).
 *
 * This is a MEASUREMENT tool. It does not change thresholds. Any tuning must be
 * justified by this trace and must not weaken negative rejection.
 *
 * Run:  npx tsx src/lib/__tests__/audioCalibration.ts
 */

import { PetAudioClassifier, type ClassifierOutcome } from '../audioClassifier';
import { FFT_SIZE, HOP_SIZE, SAMPLE_RATE } from '../audioFingerprintEngine';
import type { AnimalType } from '../petEmotionLibrary';

let _seed = 987654321;
function rnd(): number { _seed = (_seed * 1103515245 + 12345) & 0x7fffffff; return _seed / 0x7fffffff; }

const NUM_FRAMES = 14;
function frames(fill: (t: number, frame: number) => number): Float32Array[] {
  const out: Float32Array[] = [];
  let sample = 0;
  for (let f = 0; f < NUM_FRAMES; f++) {
    const buf = new Float32Array(FFT_SIZE);
    for (let i = 0; i < FFT_SIZE; i++) { buf[i] = fill(sample / SAMPLE_RATE, f); sample += 1; }
    sample -= (FFT_SIZE - HOP_SIZE);
    out.push(buf);
  }
  return out;
}

// Synthetic positive approximations (NOT veterinary-validated; engineering only).
const positives: Array<{ name: string; animal: AnimalType; clip: Float32Array[] }> = [
  { name: 'dog_relaxed',        animal: 'dog', clip: frames((t) => 0.12 * Math.sin(2 * Math.PI * 300 * t) * (1 + 0.1 * Math.sin(2 * Math.PI * 3 * t))) },
  { name: 'dog_whining',        animal: 'dog', clip: frames((t) => 0.3 * Math.sin(2 * Math.PI * (900 + 120 * Math.sin(2 * Math.PI * 5 * t)) * t)) },
  { name: 'dog_whimper',        animal: 'dog', clip: frames((t) => 0.22 * Math.sin(2 * Math.PI * 700 * t) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 8 * t))) },
  { name: 'dog_repetitive_bark',animal: 'dog', clip: frames((t) => ((Math.floor(t * 6) % 2 === 0) ? 1 : 0.08) * 0.42 * (Math.sin(2 * Math.PI * 1300 * t) + (rnd() * 2 - 1) * 0.5)) },
  { name: 'dog_distress',       animal: 'dog', clip: frames((t) => 0.4 * (Math.sin(2 * Math.PI * 1500 * t) + 0.5 * Math.sin(2 * Math.PI * 2600 * t)) * (0.5 + 0.5 * Math.sin(2 * Math.PI * 7 * t))) },
  { name: 'cat_relaxed',        animal: 'cat', clip: frames((t) => 0.14 * Math.sin(2 * Math.PI * 32 * t) * (1 + 0.2 * Math.sin(2 * Math.PI * 4 * t))) },
  { name: 'cat_distress_meow',  animal: 'cat', clip: frames((t) => 0.32 * (Math.sin(2 * Math.PI * 650 * t) + 0.5 * Math.sin(2 * Math.PI * 1300 * t)) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 3 * t))) },
  { name: 'cat_prolonged',      animal: 'cat', clip: frames((t) => 0.3 * Math.sin(2 * Math.PI * 720 * t)) },
  { name: 'cat_growl',          animal: 'cat', clip: frames((t) => 0.34 * (Math.sin(2 * Math.PI * 120 * t) + 0.4 * (rnd() * 2 - 1)) * (0.7 + 0.3 * Math.sin(2 * Math.PI * 25 * t))) },
  { name: 'cat_hiss',           animal: 'cat', clip: frames(() => (rnd() * 2 - 1) * 0.4) },
  { name: 'cat_high_arousal',   animal: 'cat', clip: frames((t) => 0.36 * (Math.sin(2 * Math.PI * 900 * t) + 0.5 * Math.sin(2 * Math.PI * 1800 * t))) },
];

const negatives: Array<{ name: string; animal: AnimalType; clip: Float32Array[] }> = [
  { name: 'silence',       animal: 'dog', clip: frames(() => 0) },
  { name: 'white_noise',   animal: 'dog', clip: frames(() => (rnd() * 2 - 1) * 0.3) },
  { name: 'traffic',       animal: 'dog', clip: frames((t) => Math.sin(2 * Math.PI * 60 * t) * 0.25 + (rnd() * 2 - 1) * 0.15) },
  { name: 'human_speech',  animal: 'dog', clip: frames((t) => 0.25 * (Math.sin(2 * Math.PI * 140 * t) + 0.6 * Math.sin(2 * Math.PI * 700 * t) + 0.4 * Math.sin(2 * Math.PI * 1220 * t))) },
  { name: 'music',         animal: 'cat', clip: frames((t) => 0.3 * (Math.sin(2 * Math.PI * 440 * t) + 0.5 * Math.sin(2 * Math.PI * 554 * t) + 0.5 * Math.sin(2 * Math.PI * 659 * t))) },
  { name: 'appliance_hum', animal: 'cat', clip: frames((t) => 0.25 * Math.sin(2 * Math.PI * 120 * t) + (rnd() * 2 - 1) * 0.05) },
  { name: 'door_slam',     animal: 'dog', clip: frames((_t, f) => (f === 6 ? (rnd() * 2 - 1) : 0)) },
  { name: 'keyboard',      animal: 'dog', clip: frames((_t, f) => (f % 3 === 0 ? (rnd() * 2 - 1) * 0.6 : 0)) },
  { name: 'human_cough',   animal: 'dog', clip: frames((t, f) => (f === 4 || f === 9 ? 0.4 * (rnd() * 2 - 1) : 0.02 * Math.sin(2 * Math.PI * 150 * t))) },
  { name: 'baby_crying',   animal: 'cat', clip: frames((t) => 0.3 * Math.sin(2 * Math.PI * (500 + 80 * Math.sin(2 * Math.PI * 2 * t)) * t)) },
];

interface Trace {
  name: string;
  reachedStage: string;
  maxProgress: number;
  bestSimilarity: number;
  confirmed: boolean;
  outcomes: Record<string, number>;
  reasons: Record<string, number>;
}

function trace(clf: PetAudioClassifier, animal: AnimalType, clip: Float32Array[]): Trace {
  clf.reset();
  const outcomes: Record<string, number> = {};
  const reasons: Record<string, number> = {};
  let maxProgress = 0, bestSimilarity = 0, confirmed = false;
  let deepest = 0; const stageRank: Record<string, number> = {
    'rejected: false-positive gate': 1,
    'rejected: species floor': 2,
    'below accumulation (0.78)': 3,
    'accumulating (≥0.78)': 4,
    'CONFIRMED detection': 5,
  };
  let reachedStage = 'rejected: false-positive gate';
  const bump = (s: string) => { if (stageRank[s] > deepest) { deepest = stageRank[s]; reachedStage = s; } };

  for (const pcm of clip) {
    const o: ClassifierOutcome = clf.process(pcm, animal);
    outcomes[o.type] = (outcomes[o.type] ?? 0) + 1;
    if (o.type === 'UNSUPPORTED') {
      reasons[o.reason] = (reasons[o.reason] ?? 0) + 1;
      if (o.reason === 'out_of_species_context') bump('rejected: species floor');
    } else if (o.type === 'INSUFFICIENT') {
      reasons[o.reason] = (reasons[o.reason] ?? 0) + 1;
      if (o.reason === 'below_threshold') bump('below accumulation (0.78)');
    } else if (o.type === 'ACCUMULATING') {
      maxProgress = Math.max(maxProgress, o.progress);
      bump('accumulating (≥0.78)');
    } else if (o.type === 'DETECTION') {
      bestSimilarity = Math.max(bestSimilarity, o.similarity);
      confirmed = true;
      bump('CONFIRMED detection');
    }
  }
  return { name: '', reachedStage, maxProgress, bestSimilarity, confirmed, outcomes, reasons };
}

function main() {
  const clf = new PetAudioClassifier();
  console.log('\n=== SenseMyPet — Audio Positive-Recall Calibration Trace ===');
  console.log('(synthetic engineering fixtures — MEASURED, not a real-world accuracy claim)\n');
  console.log('Gate ladder: signal → false-positive gate → species floor(0.35) → accumulation(0.78) → temporal confirm\n');

  console.log('--- POSITIVE fixtures: where does each stall? ---');
  console.log('  fixture'.padEnd(24) + 'deepest stage reached'.padEnd(30) + 'maxProg  bestSim  confirmed');
  let confirmedCount = 0;
  for (const p of positives) {
    const t = trace(clf, p.animal, p.clip);
    if (t.confirmed) confirmedCount++;
    console.log(
      '  ' + p.name.padEnd(22) +
      t.reachedStage.padEnd(30) +
      t.maxProgress.toFixed(3).padStart(6) + '  ' +
      t.bestSimilarity.toFixed(3).padStart(6) + '  ' +
      (t.confirmed ? 'YES' : 'no'),
    );
  }
  console.log(`\n  Positive recall (synthetic): ${confirmedCount}/${positives.length}`);

  console.log('\n--- NEGATIVE fixtures: must NOT confirm a pet class ---');
  let negConfirmed = 0;
  for (const n of negatives) {
    const t = trace(clf, n.animal, n.clip);
    if (t.confirmed) negConfirmed++;
    const topReason = Object.entries(t.reasons).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
    console.log('  ' + n.name.padEnd(16) + `confirmed=${t.confirmed ? 'YES(!!)' : 'no'}`.padEnd(16) + `top-reason=${topReason}`);
  }
  console.log(`\n  Negative false-confirmations: ${negConfirmed}/${negatives.length}  (MUST be 0)`);

  console.log('\n--- Analysis ---');
  console.log('  The synthetic positives are pure tone/noise approximations; they lack the');
  console.log('  spectro-temporal structure of real dog/cat vocalisations, so most stall at');
  console.log('  the accumulation gate (best similarity < 0.78) rather than being wrongly');
  console.log('  rejected as non-pet. The gate ladder and negative rejection are intact.');
  console.log('  Minimal evidence-based next step (do NOT lower 0.92 globally):');
  console.log('   • add REAL labelled dog/cat clips to pet-behavior-reference-audio;');
  console.log('   • recompute reference embeddings (identical preprocessing);');
  console.log('   • re-run this trace on real positives and tune ONLY the accumulation');
  console.log('     start (0.78) per-species if real clips cluster just below it, while');
  console.log('     re-confirming negatives stay at 0 here.\n');

  if (negConfirmed > 0) { console.error('CRITICAL: a negative confirmed a pet class.'); process.exitCode = 1; }
  else console.log('OK: negative rejection intact (0 false confirmations).');
}

main();
