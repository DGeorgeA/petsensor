/**
 * src/lib/__tests__/screeningHarness.ts
 *
 * OFFLINE screening test harness. Feeds synthetic PCM fixtures through the EXACT
 * live decision core (PetAudioClassifier → same extractFeatures → same gates →
 * same fuseEvidence) and reports a confusion matrix + precision / recall / FPR /
 * FNR / unsupported-rejection-rate.
 *
 * Run:  npx tsx src/lib/__tests__/screeningHarness.ts
 *
 * HONESTY: these are SYNTHETIC fixtures (source_type=test_fixture,
 * validation_status=unvalidated). Numbers below are MEASURED against them — they
 * are NOT a claim of real-world accuracy. No ">95%" is asserted anywhere.
 */

import { PetAudioClassifier } from '../audioClassifier';
import { FFT_SIZE, HOP_SIZE, SAMPLE_RATE } from '../audioFingerprintEngine';
import {
  fuseEvidence, similarityToConfidence,
  type ChannelEvidence, type ScreeningClass, type ScreeningCategory,
} from '../screening';
import { PET_EMOTION_LIBRARY, type AnimalType } from '../petEmotionLibrary';

// ── Deterministic PRNG (no Math.random → reproducible runs) ─────────────────────
let _seed = 1234567;
function rnd(): number { _seed = (_seed * 1103515245 + 12345) & 0x7fffffff; return _seed / 0x7fffffff; }

// ── Synthetic PCM frame generators (each frame = FFT_SIZE samples) ──────────────
const NUM_FRAMES = 10;

function frames(fill: (t: number, frame: number) => number): Float32Array[] {
  const out: Float32Array[] = [];
  let sample = 0;
  for (let f = 0; f < NUM_FRAMES; f++) {
    const buf = new Float32Array(FFT_SIZE);
    for (let i = 0; i < FFT_SIZE; i++) {
      buf[i] = fill(sample / SAMPLE_RATE, f);
      sample += 1;
    }
    // advance by HOP_SIZE so successive frames overlap like the live worklet
    sample -= (FFT_SIZE - HOP_SIZE);
    out.push(buf);
  }
  return out;
}

const gen = {
  silence: () => frames(() => 0),
  whiteNoise: () => frames(() => (rnd() * 2 - 1) * 0.3),
  lowRumble: () => frames((t) => Math.sin(2 * Math.PI * 60 * t) * 0.25 + (rnd() * 2 - 1) * 0.15),
  humanSpeech: () => frames((t) => {
    // ~140 Hz F0 with vowel-like formants
    const f0 = 140;
    return 0.25 * (Math.sin(2 * Math.PI * f0 * t) + 0.6 * Math.sin(2 * Math.PI * 700 * t) + 0.4 * Math.sin(2 * Math.PI * 1220 * t));
  }),
  musicTone: () => frames((t) => 0.3 * (Math.sin(2 * Math.PI * 440 * t) + 0.5 * Math.sin(2 * Math.PI * 554 * t) + 0.5 * Math.sin(2 * Math.PI * 659 * t))),
  applianceHum: () => frames((t) => 0.25 * Math.sin(2 * Math.PI * 120 * t) + (rnd() * 2 - 1) * 0.05),
  singleClick: () => frames((_t, f) => (f === 5 ? (rnd() * 2 - 1) : 0)),
  // Rough positive approximations (not tuned to confirm — recall is measured honestly)
  dogBarkish: () => frames((t) => {
    const burst = (Math.floor(t * 6) % 2 === 0) ? 1 : 0.1;
    return burst * 0.4 * (Math.sin(2 * Math.PI * 1300 * t) + (rnd() * 2 - 1) * 0.5);
  }),
  catPurrish: () => frames((t) => 0.15 * Math.sin(2 * Math.PI * 32 * t) * (1 + 0.2 * Math.sin(2 * Math.PI * 4 * t))),
};

// ── Map classifier outcomes over a clip → one ScreeningResult (mirrors engine) ──
function runClip(clf: PetAudioClassifier, animal: AnimalType, clip: Float32Array[]): ScreeningClass {
  clf.reset();
  let confirmed: ChannelEvidence | null = null;
  let lastNo: 'insufficient' | 'unsupported' = 'insufficient';
  for (const pcm of clip) {
    const o = clf.process(pcm, animal);
    if (o.type === 'DETECTION') {
      confirmed = { state: 'match', category: o.category, confidence: similarityToConfidence(o.similarity), summary: o.label };
    } else if (o.type === 'UNSUPPORTED') {
      lastNo = 'unsupported';
    } else if (o.type === 'INSUFFICIENT') {
      lastNo = 'insufficient';
    }
  }
  const audio: ChannelEvidence = confirmed ?? { state: lastNo, category: null, confidence: 0, summary: '' };
  const visual: ChannelEvidence = { state: 'insufficient', category: null, confidence: 0, summary: '' };
  return fuseEvidence({ audio, visual }).screeningClass;
}

interface Case { name: string; animal: AnimalType; clip: Float32Array[]; kind: 'negative' | 'positive'; expectCategory?: ScreeningCategory; }

const CASES: Case[] = [
  // Negatives — must NOT be classified as a pet stress/anxiety/relaxed state
  { name: 'silence',           animal: 'dog', clip: gen.silence(),      kind: 'negative' },
  { name: 'white-noise/fan',   animal: 'dog', clip: gen.whiteNoise(),   kind: 'negative' },
  { name: 'traffic/rumble',    animal: 'dog', clip: gen.lowRumble(),    kind: 'negative' },
  { name: 'human-speech',      animal: 'dog', clip: gen.humanSpeech(),  kind: 'negative' },
  { name: 'music',             animal: 'cat', clip: gen.musicTone(),    kind: 'negative' },
  { name: 'appliance-hum',     animal: 'cat', clip: gen.applianceHum(), kind: 'negative' },
  { name: 'single-click',      animal: 'dog', clip: gen.singleClick(),  kind: 'negative' },
  // Positives — synthetic approximations (recall measured, not asserted high)
  { name: 'dog-barkish',       animal: 'dog', clip: gen.dogBarkish(),   kind: 'positive', expectCategory: 'possible_anxiety' },
  { name: 'cat-purrish',       animal: 'cat', clip: gen.catPurrish(),   kind: 'positive', expectCategory: 'relaxed' },
];

const NEG_SAFE: ScreeningClass[] = ['INSUFFICIENT_EVIDENCE', 'UNSUPPORTED_SUBJECT'];

function pct(n: number, d: number): string { return d === 0 ? 'n/a' : `${((n / d) * 100).toFixed(1)}%`; }

function main() {
  const clf = new PetAudioClassifier();

  console.log('\n=== SenseMyPet — Offline Screening Fixture Harness ===');
  console.log('(synthetic/unvalidated fixtures — MEASURED results, not a real-world accuracy claim)\n');

  // 1) Raw-PCM behaviour
  const rows: Array<{ name: string; kind: string; expected: string; actual: ScreeningClass; pass: boolean }> = [];
  let negTotal = 0, negFalsePos = 0;
  let posTotal = 0, posConfirmed = 0;

  for (const c of CASES) {
    const actual = runClip(clf, c.animal, c.clip);
    let pass: boolean;
    if (c.kind === 'negative') {
      negTotal++;
      pass = NEG_SAFE.includes(actual);
      if (!pass) negFalsePos++;
    } else {
      posTotal++;
      const confirmedCat =
        actual === 'RELAXED' ? 'relaxed' :
        actual === 'POSSIBLE_STRESS' ? 'possible_stress' :
        actual === 'POSSIBLE_ANXIETY' ? 'possible_anxiety' : null;
      pass = confirmedCat === c.expectCategory;
      if (confirmedCat === c.expectCategory) posConfirmed++;
    }
    rows.push({ name: c.name, kind: c.kind, expected: c.kind === 'negative' ? 'INSUFFICIENT/UNSUPPORTED' : (c.expectCategory ?? ''), actual, pass });
  }

  console.log('--- Raw-PCM fixtures ---');
  for (const r of rows) {
    console.log(`  [${r.pass ? 'PASS' : 'MISS'}] ${r.name.padEnd(18)} ${r.kind.padEnd(9)} expected=${r.expected.padEnd(24)} actual=${r.actual}`);
  }

  // 2) Taxonomy-mapping check — a confirmed match of each category must fuse to the right class
  console.log('\n--- Taxonomy mapping (confirmed match → class) ---');
  let mapOk = 0, mapTotal = 0;
  const catToClass: Record<ScreeningCategory, ScreeningClass> = {
    relaxed: 'RELAXED', possible_stress: 'POSSIBLE_STRESS', possible_anxiety: 'POSSIBLE_ANXIETY',
  };
  for (const sig of PET_EMOTION_LIBRARY) {
    mapTotal++;
    const audio: ChannelEvidence = { state: 'match', category: sig.category, confidence: 0.8, summary: sig.label };
    const visual: ChannelEvidence = { state: 'insufficient', category: null, confidence: 0, summary: '' };
    const cls = fuseEvidence({ audio, visual }).screeningClass;
    const ok = cls === catToClass[sig.category];
    if (ok) mapOk++;
    else console.log(`  [MISS] ${sig.key}: ${sig.category} → ${cls}`);
  }
  console.log(`  mapping correct: ${mapOk}/${mapTotal} (${pct(mapOk, mapTotal)})`);

  // 3) Confusion matrix (rows = case group, cols = actual class)
  const classes: ScreeningClass[] = ['RELAXED', 'POSSIBLE_STRESS', 'POSSIBLE_ANXIETY', 'INSUFFICIENT_EVIDENCE', 'UNSUPPORTED_SUBJECT'];
  const groups = ['negative', 'positive'];
  const matrix: Record<string, Record<ScreeningClass, number>> = {};
  for (const g of groups) { matrix[g] = { RELAXED: 0, POSSIBLE_STRESS: 0, POSSIBLE_ANXIETY: 0, INSUFFICIENT_EVIDENCE: 0, UNSUPPORTED_SUBJECT: 0 }; }
  for (const r of rows) matrix[r.kind][r.actual]++;
  console.log('\n--- Confusion matrix (raw-PCM) ---');
  console.log('  group    | ' + classes.map(c => c.slice(0, 6)).join('  '));
  for (const g of groups) {
    console.log(`  ${g.padEnd(8)} | ` + classes.map(c => String(matrix[g][c]).padStart(6)).join('  '));
  }

  // 4) Metrics (measured)
  const unsupportedRejectionRate = pct(negTotal - negFalsePos, negTotal);
  const fpr = pct(negFalsePos, negTotal);
  const recall = pct(posConfirmed, posTotal);
  console.log('\n--- Measured metrics ---');
  console.log(`  Negatives correctly rejected (no pet state): ${negTotal - negFalsePos}/${negTotal} (${unsupportedRejectionRate})`);
  console.log(`  False-positive rate on negatives:            ${fpr}`);
  console.log(`  Positive recall (synthetic fixtures):        ${posConfirmed}/${posTotal} (${recall})`);
  console.log(`  Taxonomy-mapping correctness:                ${pct(mapOk, mapTotal)}`);
  console.log('\n  NOTE: synthetic positives are not tuned to clear the 0.92 confirmation gate;');
  console.log('        low synthetic recall is expected and honest. Real recall requires real fixtures.\n');

  // Critical safety gate: NO negative may be classified as a pet stress/anxiety state.
  const criticalFail = negFalsePos > 0 || mapOk !== mapTotal;
  if (criticalFail) {
    console.error('CRITICAL: a negative was classified as a pet state, or taxonomy mapping broke.');
    process.exitCode = 1;
  } else {
    console.log('OK: no negative produced a pet stress/anxiety/relaxed classification; taxonomy mapping intact.');
  }
}

main();
