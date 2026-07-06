/**
 * src/lib/__tests__/visionHarness.ts
 *
 * OFFLINE camera + multimodal-fusion harness. Feeds deterministic synthetic
 * VisualFrameObs sequences (the exact shape the detector worker emits) through
 * the REAL aggregator (VisualObservationAggregator → toVisualEvidence) and the
 * REAL fusion (fuseEvidence), asserting the behaviour the spec requires:
 *   - single frame never classifies; stillness ≠ distress
 *   - sustained agitation → graded stress; collapse → EMERGENCY override
 *   - human-only → UNSUPPORTED; empty / low-light / no-model → INSUFFICIENT
 *   - severity and observation confidence stay separate
 *   - fusion: agreement boosts, conflict → insufficient, emergency overrides
 *
 * Run:  npx tsx src/lib/__tests__/visionHarness.ts
 *
 * HONESTY: synthetic sequences exercise the pipeline logic. They are NOT a
 * real-world accuracy claim; real recall requires real annotated video.
 */

import { VisualObservationAggregator, toVisualEvidence } from '../vision/visualCues';
import type { VisualFrameObs, Species } from '../vision/types';
import { fuseEvidence, type ChannelEvidence, type ScreeningClass } from '../screening';

const DT = 333; // ms (~3 fps)

function frame(i: number, o: Partial<VisualFrameObs>): VisualFrameObs {
  return {
    t: i * DT,
    present: false, species: null, score: 0,
    cx: 0.5, cy: 0.5, w: 0, h: 0, luminance: 0.5, motion: 0,
    modelAvailable: true,
    ...o,
  };
}

function build(n: number, fn: (i: number) => Partial<VisualFrameObs>): VisualFrameObs[] {
  return Array.from({ length: n }, (_, i) => frame(i, fn(i)));
}

// ── Synthetic sequences ─────────────────────────────────────────────────────────
const seqs = {
  relaxedDog: build(24, (i) => ({
    present: true, species: 'dog', score: 0.82,
    cx: 0.5 + (i % 2 ? 0.004 : -0.004), cy: 0.5, w: 0.42, h: 0.36,
    luminance: 0.5, motion: 0.02,
  })),
  pacingDog: build(24, (i) => {
    const cx = 0.30 + 0.40 * (Math.floor(i / 2) % 2); // toggles 0.3/0.7 every 2 frames
    return { present: true, species: 'dog', score: 0.8, cx, cy: 0.5, w: 0.4, h: 0.34, luminance: 0.5, motion: 0.32 };
  }),
  relaxedCat: build(20, (i) => ({
    present: true, species: 'cat', score: 0.78,
    cx: 0.5 + (i % 2 ? 0.003 : -0.003), cy: 0.55, w: 0.34, h: 0.30, luminance: 0.45, motion: 0.02,
  })),
  humanOnly: build(20, () => ({ present: false, species: 'other', score: 0.85, cx: 0.5, cy: 0.5, w: 0.3, h: 0.6, luminance: 0.5 })),
  emptyScene: build(20, () => ({ present: false, species: null, score: 0, luminance: 0.5 })),
  lowLight: build(20, () => ({ present: true, species: 'dog', score: 0.5, cx: 0.5, cy: 0.5, w: 0.4, h: 0.34, luminance: 0.04, motion: 0.02 })),
  noModel: build(20, () => ({ present: false, species: null, score: 0, luminance: 0, modelAvailable: false })),
  singleAgitatedFrame: build(20, (i) => ({
    present: true, species: 'dog', score: 0.8,
    cx: i === 10 ? 0.9 : 0.5, cy: 0.5, w: 0.4, h: 0.34, luminance: 0.5, motion: i === 10 ? 0.4 : 0.02,
  })),
  collapse: build(20, (i) => {
    if (i < 6) return { present: true, species: 'dog', score: 0.8, cx: 0.5 + i * 0.01, cy: 0.4, w: 0.42, h: 0.4, luminance: 0.5, motion: 0.05 };
    // frame 6: sudden downward drop; then immobile
    return { present: true, species: 'dog', score: 0.8, cx: 0.56, cy: 0.78, w: 0.5, h: 0.22, luminance: 0.5, motion: 0.01 };
  }),
};

function snap(obs: VisualFrameObs[], contextMod = 1) {
  const agg = new VisualObservationAggregator();
  for (const o of obs) agg.ingest(o);
  return agg.snapshot(contextMod);
}

// ── Assertions ──────────────────────────────────────────────────────────────────
let pass = 0, fail = 0;
function check(name: string, cond: boolean, detail: string) {
  if (cond) { pass++; console.log(`  [PASS] ${name.padEnd(38)} ${detail}`); }
  else { fail++; console.log(`  [FAIL] ${name.padEnd(38)} ${detail}`); }
}

console.log('\n=== SenseMyPet — Vision + Fusion Harness ===');
console.log('(synthetic sequences exercise pipeline logic — not a real-world accuracy claim)\n');

console.log('--- Visual channel (single-modality) ---');
const relaxed = snap(seqs.relaxedDog);
check('relaxed dog → CALM', relaxed.primaryState === 'CALM', `state=${relaxed.primaryState} sev=${relaxed.severity} conf=${relaxed.observationConfidence} species=${relaxed.species}`);
check('relaxed dog severity < 25', relaxed.severity < 25, `sev=${relaxed.severity}`);
check('relaxed dog species=dog', relaxed.species === 'dog', `species=${relaxed.species}`);

const pacing = snap(seqs.pacingDog);
check('pacing dog → MILD/ELEVATED', pacing.primaryState === 'MILD' || pacing.primaryState === 'ELEVATED', `state=${pacing.primaryState} sev=${pacing.severity} conf=${pacing.observationConfidence}`);
check('pacing dog has indicators', pacing.indicators.length > 0, `indicators=[${pacing.indicators.join(', ')}]`);
check('pacing severity ≠ confidence (separate)', pacing.severity !== pacing.observationConfidence, `sev=${pacing.severity} conf=${pacing.observationConfidence}`);

const catCalm = snap(seqs.relaxedCat);
check('relaxed cat → CALM', catCalm.primaryState === 'CALM', `state=${catCalm.primaryState} species=${catCalm.species}`);

const human = snap(seqs.humanOnly);
check('human-only → UNSUPPORTED', human.primaryState === 'UNSUPPORTED', `state=${human.primaryState}`);

const empty = snap(seqs.emptyScene);
check('empty scene → INSUFFICIENT', empty.primaryState === 'INSUFFICIENT', `state=${empty.primaryState}`);

const low = snap(seqs.lowLight);
check('low light → INSUFFICIENT', low.primaryState === 'INSUFFICIENT', `state=${low.primaryState} conf=${low.observationConfidence}`);

const nomodel = snap(seqs.noModel);
check('no model → INSUFFICIENT, conf 0', nomodel.primaryState === 'INSUFFICIENT' && nomodel.observationConfidence === 0, `state=${nomodel.primaryState} conf=${nomodel.observationConfidence}`);

const oneFrame = snap(seqs.singleAgitatedFrame);
check('single agitated frame ≠ elevated', oneFrame.primaryState === 'CALM' || oneFrame.primaryState === 'MILD', `state=${oneFrame.primaryState} sev=${oneFrame.severity}`);

const collapse = snap(seqs.collapse);
check('collapse → EMERGENCY red flag', collapse.primaryState === 'EMERGENCY' && collapse.redFlags.length > 0, `state=${collapse.primaryState} flags=[${collapse.redFlags.join(', ')}]`);

console.log('\n--- Context modifier ---');
const pacingHot = snap(seqs.pacingDog, 0.88); // "just exercised / hot"
check('context lowers severity', pacingHot.severity <= pacing.severity, `plain=${pacing.severity} withContext=${pacingHot.severity}`);

console.log('\n--- Multimodal fusion ---');
const A = {
  anxiety: (): ChannelEvidence => ({ state: 'match', category: 'possible_anxiety', confidence: 0.7, summary: 'repeated distress vocalisation', severity: 68, indicators: ['repeated distress vocalisation'] }),
  insufficient: (): ChannelEvidence => ({ state: 'insufficient', category: null, confidence: 0, summary: '' }),
};
function fuseClass(audio: ChannelEvidence, visualObs: VisualFrameObs[]): ScreeningClass {
  return fuseEvidence({ audio, visual: toVisualEvidence(snap(visualObs)) }).screeningClass;
}

check('audio anxiety + visual relaxed → conflict INSUFFICIENT',
  fuseClass(A.anxiety(), seqs.relaxedDog) === 'INSUFFICIENT_EVIDENCE',
  fuseClass(A.anxiety(), seqs.relaxedDog));

check('audio absent + visual pacing → visual stress result',
  ['POSSIBLE_STRESS', 'POSSIBLE_ANXIETY'].includes(fuseClass(A.insufficient(), seqs.pacingDog)),
  fuseClass(A.insufficient(), seqs.pacingDog));

const agree = fuseEvidence({
  audio: A.anxiety(),
  visual: { state: 'match', category: 'possible_anxiety', confidence: 0.7, summary: 'agitated movement', severity: 66, quality: 0.7, indicators: ['agitated movement'] },
});
check('audio + visual agree → POSSIBLE_ANXIETY, boosted conf', agree.screeningClass === 'POSSIBLE_ANXIETY' && agree.observationConfidence >= 70, `class=${agree.screeningClass} conf=${agree.observationConfidence} modality=${agree.modality}`);

check('visual collapse → EMERGENCY overrides', fuseClass(A.insufficient(), seqs.collapse) === 'EMERGENCY', fuseClass(A.insufficient(), seqs.collapse));

check('both insufficient → INSUFFICIENT', fuseClass(A.insufficient(), seqs.emptyScene) === 'INSUFFICIENT_EVIDENCE', fuseClass(A.insufficient(), seqs.emptyScene));

check('human visual + audio insufficient → UNSUPPORTED', fuseClass(A.insufficient(), seqs.humanOnly) === 'UNSUPPORTED_SUBJECT', fuseClass(A.insufficient(), seqs.humanOnly));

console.log(`\n=== ${pass} passed, ${fail} failed ===`);
if (fail > 0) process.exitCode = 1;
