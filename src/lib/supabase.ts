/**
 * src/lib/supabase.ts
 *
 * READ-ONLY Supabase client.
 *
 * Privacy posture: this app is fully local for pet media. No user audio, video,
 * derived features, or embeddings are EVER written to Supabase. The client is
 * used only to (a) *download* labelled reference fixtures (referenceLoader.ts)
 * from the private `pet-behavior-reference-audio` bucket, (b) submit VET-PARTNER
 * onboarding applications (business data entered by a vet; vetPartners.ts), and
 * (c) optionally insert a non-reconstructable scan METADATA summary — species,
 * class, indices, versions only (scanSync.ts, write-only RLS).
 *
 * Credentials come from env (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). When
 * unset, a benign placeholder is used and all network calls silent-fail so the
 * app runs entirely offline with bundled reference signatures.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  'https://placeholder.supabase.co';
const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  'public-anon-placeholder';

export const REFERENCE_BUCKET = 'pet-behavior-reference-audio';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** True only when a real project is configured via env. */
export function isSupabaseConfigured(): boolean {
  return (
    typeof import.meta !== 'undefined' &&
    !!import.meta.env?.VITE_SUPABASE_URL &&
    !!import.meta.env?.VITE_SUPABASE_ANON_KEY
  );
}
