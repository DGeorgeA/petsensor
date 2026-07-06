/**
 * src/lib/referenceLoader.ts
 *
 * Downloads labelled TEST-FIXTURE reference clips from the private Supabase
 * Storage bucket `pet-behavior-reference-audio`, embeds them through the SAME
 * canonical pipeline used live (extractFeatures), and caches the resulting
 * embeddings on-device (IndexedDB) keyed by manifest version.
 *
 * This is READ-ONLY reference *download* — no user data is uploaded, ever. The
 * bundled synthetic signatures (petEmotionLibrary) remain the offline fast-path;
 * these fixtures augment/validate them and feed the offline accuracy harness.
 *
 * All fixtures are TEST DATA: source_type = 'test_fixture',
 * validation_status = 'unvalidated'. Never present them as validated behaviour data.
 */

import { supabase, REFERENCE_BUCKET, isSupabaseConfigured } from './supabase';
import { extractFeatures, EMBEDDING_DIM, SAMPLE_RATE, FFT_SIZE, HOP_SIZE } from './audioFingerprintEngine';
import type { ScreeningCategory } from './screening';

export interface FixtureManifestEntry {
  path: string;                 // e.g. 'dogs/relaxed/clip1.wav'
  species: 'dog' | 'cat';
  category: ScreeningCategory;  // relaxed | possible_stress | possible_anxiety
  source_type: 'test_fixture';
  validation_status: 'unvalidated';
}

export interface FixtureManifest {
  version: string;              // e.g. 'v20260706'
  fixtures: FixtureManifestEntry[];
}

export interface ReferenceFixture {
  species: 'dog' | 'cat';
  category: ScreeningCategory;
  embedding: Float32Array;      // 512-dim, L2-normalized
  path: string;
}

// ── IndexedDB cache (keyed by manifest version) ────────────────────────────────
const DB_NAME = 'sensemypet-ref';
const STORE = 'fixtures';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'version' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

interface StoredFixture { species: 'dog' | 'cat'; category: ScreeningCategory; path: string; embedding: number[]; }
interface StoredRow { version: string; fixtures: StoredFixture[]; }

async function readCache(version: string): Promise<ReferenceFixture[] | null> {
  if (typeof indexedDB === 'undefined') return null;
  try {
    const db = await openDB();
    const row = await new Promise<StoredRow | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const r = tx.objectStore(STORE).get(version);
      r.onsuccess = () => resolve(r.result as StoredRow | undefined);
      r.onerror = () => reject(r.error);
    });
    db.close();
    if (!row?.fixtures) return null;
    return row.fixtures.map((f) => ({
      species: f.species, category: f.category, path: f.path,
      embedding: Float32Array.from(f.embedding),
    }));
  } catch {
    return null;
  }
}

async function writeCache(version: string, fixtures: ReferenceFixture[]): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({
        version,
        fixtures: fixtures.map(f => ({ ...f, embedding: Array.from(f.embedding) })),
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // best-effort
  }
}

// ── Audio decode + embedding ───────────────────────────────────────────────────
async function decodeTo16kMono(bytes: ArrayBuffer): Promise<Float32Array> {
  const Ctx: typeof AudioContext =
    window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  // decodeAudioData resamples to the context's sampleRate (16 kHz here).
  const ctx = new Ctx({ sampleRate: SAMPLE_RATE });
  try {
    const buf = await ctx.decodeAudioData(bytes.slice(0));
    // Downmix to mono.
    const mono = new Float32Array(buf.length);
    for (let ch = 0; ch < buf.numberOfChannels; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < data.length; i++) mono[i] += data[i] / buf.numberOfChannels;
    }
    return mono;
  } finally {
    ctx.close().catch(() => {});
  }
}

/** Average per-frame embeddings over the clip → one L2-normalized reference vector. */
function embedClip(pcm: Float32Array): Float32Array {
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

// ── Public: load reference fixtures (cached, download-only, best-effort) ─────────
let _inFlight: Promise<ReferenceFixture[]> | null = null;

export async function loadReferenceFixtures(): Promise<ReferenceFixture[]> {
  if (_inFlight) return _inFlight;
  _inFlight = (async () => {
    if (!isSupabaseConfigured()) return []; // offline / not configured → bundled fast-path only

    try {
      // 1. Fetch manifest.
      const { data: manifestBlob, error: mErr } = await supabase
        .storage.from(REFERENCE_BUCKET).download('manifest.json');
      if (mErr || !manifestBlob) return [];
      const manifest = JSON.parse(await manifestBlob.text()) as FixtureManifest;
      if (!manifest?.version || !Array.isArray(manifest.fixtures)) return [];

      // 2. Serve from cache if we already embedded this version.
      const cached = await readCache(manifest.version);
      if (cached && cached.length > 0) return cached;

      // 3. Download + embed each fixture once.
      const out: ReferenceFixture[] = [];
      for (const entry of manifest.fixtures) {
        try {
          const { data: fileBlob, error } = await supabase
            .storage.from(REFERENCE_BUCKET).download(entry.path);
          if (error || !fileBlob) continue;
          const pcm = await decodeTo16kMono(await fileBlob.arrayBuffer());
          const embedding = embedClip(pcm);
          out.push({ species: entry.species, category: entry.category, embedding, path: entry.path });
        } catch {
          // Skip a bad fixture without failing the whole load.
        }
      }

      if (out.length > 0) await writeCache(manifest.version, out);
      return out;
    } catch {
      return [];
    }
  })();
  return _inFlight;
}
