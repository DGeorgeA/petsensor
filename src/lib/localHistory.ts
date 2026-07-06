/**
 * src/lib/localHistory.ts
 *
 * On-device scan history (IndexedDB). Privacy-first replacement for the former
 * Supabase writes: raw audio/video NEVER left the device, and now neither do
 * derived features/embeddings or scan rows. Only a minimal, non-media,
 * non-reconstructable summary is stored locally: species, screening class,
 * confidence band, a short label, and a timestamp.
 */

import type { ScreeningClass } from './screening';

export interface LocalScanInput {
  animal_type: 'dog' | 'cat';
  screening_class: ScreeningClass;
  confidence: number;  // 0..1
  headline: string;
  label: string;       // short observation label (e.g. "Repeated whining")
}

export interface LocalScanRecord extends LocalScanInput {
  id: string;
  created_at: string;  // ISO
}

const DB_NAME = 'sensemypet';
const STORE = 'scans';
const DB_VERSION = 1;

function hasIDB(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('created_at', 'created_at');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Timestamped id without Date.now()/Math.random dependencies at call boundaries. */
function makeId(): string {
  const t = new Date().toISOString();
  // Cheap uniqueness suffix from a monotonic counter within the session.
  _seq = (_seq + 1) % 1_000_000;
  return `${t}-${_seq.toString(36)}`;
}
let _seq = 0;

export async function addLocalScan(input: LocalScanInput): Promise<void> {
  if (!hasIDB()) return;
  const record: LocalScanRecord = {
    ...input,
    id: makeId(),
    created_at: new Date().toISOString(),
  };
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Non-fatal: history is best-effort.
  }
}

export async function getLocalScans(limit = 50): Promise<LocalScanRecord[]> {
  if (!hasIDB()) return [];
  try {
    const db = await openDB();
    const rows = await new Promise<LocalScanRecord[]>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve((req.result as LocalScanRecord[]) ?? []);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return rows
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .slice(0, limit);
  } catch {
    return [];
  }
}

export async function clearLocalScans(): Promise<void> {
  if (!hasIDB()) return;
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // ignore
  }
}
