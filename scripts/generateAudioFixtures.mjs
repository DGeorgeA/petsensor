/**
 * scripts/generateAudioFixtures.mjs
 *
 * Generates 16 kHz mono 16-bit PCM WAV ENGINEERING fixtures + a manifest that
 * matches src/lib/referenceLoader.ts (FixtureManifest). These exercise the full
 * reference pipeline (load → decode → embed → cache → match). They are NOT
 * veterinary-validated: every entry is marked source_type=test_fixture,
 * validation_status=unvalidated, origin=synthetic-generated.
 *
 * Run:  node scripts/generateAudioFixtures.mjs
 * Then upload with:  node scripts/uploadReferenceAudio.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'reference-fixtures');
const SR = 16000;
const SECONDS = 3;
const N = SR * SECONDS;

// deterministic PRNG (no Math.random → reproducible fixtures)
let seed = 20260706;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };

function render(fill) {
  const buf = new Float32Array(N);
  for (let i = 0; i < N; i++) buf[i] = Math.max(-1, Math.min(1, fill(i / SR)));
  return buf;
}

function toWav(float32) {
  const bytes = 44 + float32.length * 2;
  const ab = new ArrayBuffer(bytes);
  const dv = new DataView(ab);
  const wr = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
  wr(0, 'RIFF'); dv.setUint32(4, bytes - 8, true); wr(8, 'WAVE');
  wr(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, SR, true); dv.setUint32(28, SR * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
  wr(36, 'data'); dv.setUint32(40, float32.length * 2, true);
  let o = 44;
  for (let i = 0; i < float32.length; i++) { dv.setInt16(o, Math.round(float32[i] * 32767), true); o += 2; }
  return Buffer.from(ab);
}

// species, category, path, generator
const PET = [
  ['dog', 'relaxed',         'dogs/relaxed/dog_relaxed.wav',                (t) => 0.12 * Math.sin(2 * Math.PI * 300 * t) * (1 + 0.1 * Math.sin(2 * Math.PI * 3 * t))],
  ['dog', 'possible_stress', 'dogs/mild_stress/dog_whining.wav',            (t) => 0.3 * Math.sin(2 * Math.PI * (900 + 120 * Math.sin(2 * Math.PI * 5 * t)) * t)],
  ['dog', 'possible_stress', 'dogs/mild_stress/dog_whimper.wav',            (t) => 0.22 * Math.sin(2 * Math.PI * 700 * t) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 8 * t))],
  ['dog', 'possible_anxiety','dogs/elevated_stress/dog_repetitive_bark.wav',(t) => ((Math.floor(t * 6) % 2 === 0) ? 1 : 0.08) * 0.42 * (Math.sin(2 * Math.PI * 1300 * t) + (rnd() * 2 - 1) * 0.5)],
  ['dog', 'possible_anxiety','dogs/anxiety_related/dog_distress.wav',       (t) => 0.4 * (Math.sin(2 * Math.PI * 1500 * t) + 0.5 * Math.sin(2 * Math.PI * 2600 * t)) * (0.5 + 0.5 * Math.sin(2 * Math.PI * 7 * t))],
  ['cat', 'relaxed',         'cats/relaxed/cat_relaxed.wav',                (t) => 0.14 * Math.sin(2 * Math.PI * 32 * t) * (1 + 0.2 * Math.sin(2 * Math.PI * 4 * t))],
  ['cat', 'possible_stress', 'cats/mild_stress/cat_distress_meow.wav',      (t) => 0.32 * (Math.sin(2 * Math.PI * 650 * t) + 0.5 * Math.sin(2 * Math.PI * 1300 * t)) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 3 * t))],
  ['cat', 'possible_anxiety','cats/elevated_stress/cat_growl.wav',          (t) => 0.34 * (Math.sin(2 * Math.PI * 120 * t) + 0.4 * (rnd() * 2 - 1)) * (0.7 + 0.3 * Math.sin(2 * Math.PI * 25 * t))],
  ['cat', 'possible_anxiety','cats/anxiety_related/cat_hiss.wav',           () => (rnd() * 2 - 1) * 0.4],
  ['cat', 'possible_anxiety','cats/elevated_stress/cat_high_arousal.wav',   (t) => 0.36 * (Math.sin(2 * Math.PI * 900 * t) + 0.5 * Math.sin(2 * Math.PI * 1800 * t))],
];

// Hard negatives (engineering only — NOT listed as references in the manifest).
const NEG = [
  ['negatives/silence.wav',       () => 0],
  ['negatives/white_noise.wav',   () => (rnd() * 2 - 1) * 0.3],
  ['negatives/traffic.wav',       (t) => Math.sin(2 * Math.PI * 60 * t) * 0.25 + (rnd() * 2 - 1) * 0.15],
  ['negatives/human_speech.wav',  (t) => 0.25 * (Math.sin(2 * Math.PI * 140 * t) + 0.6 * Math.sin(2 * Math.PI * 700 * t) + 0.4 * Math.sin(2 * Math.PI * 1220 * t))],
  ['negatives/music.wav',         (t) => 0.3 * (Math.sin(2 * Math.PI * 440 * t) + 0.5 * Math.sin(2 * Math.PI * 554 * t) + 0.5 * Math.sin(2 * Math.PI * 659 * t))],
  ['negatives/appliance_hum.wav', (t) => 0.25 * Math.sin(2 * Math.PI * 120 * t) + (rnd() * 2 - 1) * 0.05],
  ['negatives/door_slam.wav',     (t) => (t > 0.5 && t < 0.55 ? (rnd() * 2 - 1) : 0)],
  ['negatives/keyboard.wav',      (t) => (Math.floor(t * 8) % 4 === 0 ? (rnd() * 2 - 1) * 0.6 : 0)],
  ['negatives/human_cough.wav',   (t) => (t > 1 && t < 1.2 ? 0.4 * (rnd() * 2 - 1) : 0.02 * Math.sin(2 * Math.PI * 150 * t))],
  ['negatives/baby_crying.wav',   (t) => 0.3 * Math.sin(2 * Math.PI * (500 + 80 * Math.sin(2 * Math.PI * 2 * t)) * t)],
];

function writeClip(relPath, gen) {
  const abs = join(ROOT, relPath);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, toWav(render(gen)));
}

const fixtures = [];
for (const [species, category, path, gen] of PET) {
  writeClip(path, gen);
  fixtures.push({
    path, species, category,
    source_type: 'test_fixture',
    validation_status: 'unvalidated',
    origin: 'synthetic-generated',
    duration_ms: SECONDS * 1000,
    sample_rate: SR,
    channels: 1,
    feature_version: 'fp-v1',
    reference_version: 'ref-20260706',
    license_or_origin: 'synthetic-generated',
    created_at: '2026-07-06T00:00:00Z',
  });
}
for (const [path, gen] of NEG) writeClip(path, gen);

const manifest = { version: 'ref-20260706', fixtures };
writeFileSync(join(ROOT, 'manifest.json'), JSON.stringify(manifest, null, 2));

console.log(`Wrote ${PET.length} reference WAVs + ${NEG.length} negatives + manifest.json under reference-fixtures/`);
console.log('All fixtures are synthetic engineering data (unvalidated). Do NOT present as veterinary evidence.');
