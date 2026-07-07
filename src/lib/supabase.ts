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
 * Credentials: env (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) overrides the
 * baked-in project defaults below. The anon key is PUBLIC-tier by design — it
 * ships in every Supabase frontend bundle; Row Level Security is the actual
 * security boundary. No service_role key or secret ever appears here.
 */

import { createClient } from '@supabase/supabase-js';

// Project: tcmcetpfdgpujayjbzrs (sensemypet.com). Anon PUBLIC key only.
const DEFAULT_URL = 'https://tcmcetpfdgpujayjbzrs.supabase.co';
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjbWNldHBmZGdwdWpheWpienJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNDcyODgsImV4cCI6MjA3OTkyMzI4OH0.iKU8zDM9MCUdubUsaA5DY2Ns_y1SPKfKzbQDXh_cSG0';

const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || DEFAULT_URL;
const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || DEFAULT_ANON_KEY;

/** Reference-audio bucket (dashboard: Storage → audio_sense). Download-only. */
export const REFERENCE_BUCKET = 'audio_sense';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** True when real project credentials are resolved (env or baked default). */
export function isSupabaseConfigured(): boolean {
  return !!supabaseUrl && !!supabaseAnonKey && !supabaseUrl.includes('placeholder');
}
