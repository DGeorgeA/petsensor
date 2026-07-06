/**
 * src/lib/vetPartners.ts
 *
 * Vet+ partner onboarding. This is the ONE class of write this app performs, and
 * it is business/professional data submitted BY a veterinarian (clinic name,
 * registration number, contact) — never pet audio/video, derived features, or a
 * user's scan media. The privacy invariant (no raw user media, no derived
 * features, no scan rows leave the device) is unaffected.
 *
 * When Supabase is configured, applications insert into `vet_partners` (status
 * 'pending', reviewed out-of-band). When it is not configured or the network
 * fails, the application is queued locally so nothing is silently lost, and the
 * UI is told honestly which happened.
 */

import { supabase, isSupabaseConfigured } from './supabase';

export type SpeciesHandled = 'dog' | 'cat';

export interface VetApplication {
  clinic_name: string;
  vet_name: string;
  license_no: string;
  email: string;
  phone?: string;
  city?: string;
  species: SpeciesHandled[];
  services?: string;
  message?: string;
}

export type SubmitMode = 'submitted' | 'queued-local';

export interface SubmitResult {
  ok: boolean;
  mode: SubmitMode;
  error?: string;
}

const LOCAL_KEY = 'sensemypet_vet_applications';

function queueLocally(app: VetApplication): void {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    const list = raw ? (JSON.parse(raw) as unknown[]) : [];
    list.push({ ...app, status: 'pending', created_at: new Date().toISOString() });
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
  } catch {
    /* localStorage unavailable — nothing more we can safely do client-side */
  }
}

/** Basic client-side validation so we never submit obviously-empty rows. */
export function validateApplication(app: Partial<VetApplication>): string | null {
  if (!app.clinic_name?.trim()) return 'Please enter your clinic or practice name.';
  if (!app.vet_name?.trim()) return 'Please enter the veterinarian name.';
  if (!app.license_no?.trim()) return 'Please enter your registration / licence number.';
  if (!app.email?.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(app.email)) return 'Please enter a valid email address.';
  if (!app.species || app.species.length === 0) return 'Select at least one species you treat.';
  return null;
}

export async function submitVetApplication(app: VetApplication): Promise<SubmitResult> {
  if (!isSupabaseConfigured()) {
    queueLocally(app);
    return { ok: true, mode: 'queued-local' };
  }
  try {
    const { error } = await supabase.from('vet_partners').insert({
      clinic_name: app.clinic_name,
      vet_name: app.vet_name,
      license_no: app.license_no,
      email: app.email,
      phone: app.phone ?? null,
      city: app.city ?? null,
      species: app.species,
      services: app.services ?? null,
      message: app.message ?? null,
      status: 'pending',
      source: 'web',
    });
    if (error) {
      queueLocally(app);
      return { ok: true, mode: 'queued-local', error: error.message };
    }
    return { ok: true, mode: 'submitted' };
  } catch (e) {
    queueLocally(app);
    return { ok: true, mode: 'queued-local', error: e instanceof Error ? e.message : String(e) };
  }
}
