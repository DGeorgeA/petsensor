/**
 * scripts/uploadReferenceAudio.mjs
 *
 * Uploads reference-fixtures/ (WAVs + manifest.json) to the private Supabase
 * Storage bucket `audio_sense` for project tcmcetpfdgpujayjbzrs.
 *
 * Requires env (NEVER hardcode secrets):
 *   SUPABASE_URL                 e.g. https://tcmcetpfdgpujayjbzrs.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY    service_role key (server-side only; never ship to client)
 *
 * Easiest safe path: copy .env.upload.example → .env.upload (gitignored), paste
 * your service_role key there, then run `npm run fixtures:upload`. The key stays
 * on your machine and is never committed. Real env vars still take precedence.
 *
 * If env is missing it prints what it WOULD upload and exits WITHOUT claiming success.
 *
 * One-time bucket + policy setup (run in the Supabase SQL editor / dashboard):
 *   -- Create a PRIVATE bucket named 'audio_sense'.
 *   -- Reference fixtures are downloaded by the app via the anon key. Grant read:
 *   --   create policy "ref_audio_read"
 *   --     on storage.objects for select to anon, authenticated
 *   --     using ( bucket_id = 'audio_sense' );
 *   -- Do NOT grant anon insert/update/delete on storage.objects for this bucket;
 *   -- uploads happen only via this script using the service_role key.
 *
 * Run:  node scripts/uploadReferenceAudio.mjs
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..');
const ROOT = join(REPO_ROOT, 'reference-fixtures');
const BUCKET = 'audio_sense';

// Load a gitignored .env.upload (repo root) for LOCAL secrets only. Real
// process.env always wins; missing keys are filled from the file. This keeps
// the service_role key on the operator's machine — never in the repo or chat.
function loadLocalEnv() {
  const path = join(REPO_ROOT, '.env.upload');
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (k && process.env[k] === undefined) process.env[k] = v;
  }
}
loadLocalEnv();

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

let files;
try {
  files = walk(ROOT);
} catch {
  console.error('reference-fixtures/ not found. Run: node scripts/generateAudioFixtures.mjs first.');
  process.exit(1);
}

// Skip negatives from the reference bucket (they must not become reference embeddings).
const uploadable = files.filter((f) => !relative(ROOT, f).replaceAll('\\', '/').startsWith('negatives/'));

if (!url || !key) {
  console.log('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — DRY RUN (nothing uploaded).');
  console.log(`Would upload ${uploadable.length} objects to bucket '${BUCKET}':`);
  for (const f of uploadable) console.log('  ' + relative(ROOT, f).replaceAll('\\', '/'));
  console.log('\nSet the env vars and re-run to perform the upload. (No success is claimed here.)');
  process.exit(0);
}

const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(url, key, { auth: { persistSession: false } });

let ok = 0, failed = 0;
for (const f of uploadable) {
  const key2 = relative(ROOT, f).replaceAll('\\', '/');
  const body = readFileSync(f);
  const contentType = key2.endsWith('.json') ? 'application/json' : 'audio/wav';
  const { error } = await supabase.storage.from(BUCKET).upload(key2, body, { contentType, upsert: true });
  if (error) { failed++; console.error(`  FAIL ${key2}: ${error.message}`); }
  else { ok++; console.log(`  ok   ${key2}`); }
}
console.log(`\nUploaded ${ok} object(s), ${failed} failure(s) to '${BUCKET}'.`);
process.exit(failed > 0 ? 1 : 0);
