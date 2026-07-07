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
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'reference-fixtures');
const BUCKET = 'audio_sense';

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
