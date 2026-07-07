/**
 * src/lib/auth.ts
 *
 * Optional, privacy-respecting sign-in built on Supabase Auth (email magic
 * link — no passwords stored anywhere). Signing in is used ONLY to personalise
 * vet-shareable reports ("Prepared by <owner>"); every feature works fully in
 * Guest Mode, and no scan data becomes cloud-bound by signing in.
 *
 * When Supabase is not configured (offline build), sign-in is unavailable and
 * the app behaves as guest-only — honestly surfaced in the UI, never faked.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { syncSubscriberOnAuth } from './subscribers';

const GUEST_KEY = 'smp_auth_guest';
const PET_NAME_KEY = 'smp_pet_name';

export interface AuthState {
  /** Signed-in user email (null in guest mode / signed out). */
  email: string | null;
  /** User explicitly chose to continue as guest. */
  guest: boolean;
  /** Whether sign-in is possible at all (Supabase configured). */
  signInAvailable: boolean;
}

export function isSignInAvailable(): boolean {
  return isSupabaseConfigured();
}

export function chooseGuestMode(): void {
  try { localStorage.setItem(GUEST_KEY, '1'); } catch { /* ignore */ }
}

export function isGuestMode(): boolean {
  try { return localStorage.getItem(GUEST_KEY) === '1'; } catch { return false; }
}

export function clearGuestMode(): void {
  try { localStorage.removeItem(GUEST_KEY); } catch { /* ignore */ }
}

/** Device-local pet name for report personalisation (works in guest mode too). */
export function getPetName(): string {
  try { return localStorage.getItem(PET_NAME_KEY) ?? ''; } catch { return ''; }
}

export function setPetName(name: string): void {
  try {
    if (name.trim()) localStorage.setItem(PET_NAME_KEY, name.trim());
    else localStorage.removeItem(PET_NAME_KEY);
  } catch { /* ignore */ }
}

/** Current auth state (async — reads the Supabase session when configured). */
export async function getAuthState(): Promise<AuthState> {
  const signInAvailable = isSignInAvailable();
  if (!signInAvailable) {
    return { email: null, guest: true, signInAvailable: false };
  }
  try {
    const { data } = await supabase.auth.getSession();
    const email = data.session?.user?.email ?? null;
    return { email, guest: !email && isGuestMode(), signInAvailable: true };
  } catch {
    return { email: null, guest: isGuestMode(), signInAvailable: true };
  }
}

/**
 * Send a passwordless magic link. Resolves ok:false with a reason instead of
 * throwing — the UI reports honestly and never pretends a link was sent.
 */
export async function signInWithEmail(email: string): Promise<{ ok: boolean; reason?: string }> {
  if (!isSignInAvailable()) {
    return { ok: false, reason: 'Sign-in is not available in this build yet — continue as guest.' };
  }
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : String(e) };
  }
}

export async function signOut(): Promise<void> {
  if (!isSignInAvailable()) return;
  try { await supabase.auth.signOut(); } catch { /* ignore */ }
}

/** Subscribe to auth changes; returns an unsubscribe function. */
export function onAuthChange(cb: (email: string | null) => void): () => void {
  if (!isSignInAvailable()) return () => {};
  try {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user?.email ?? null;
      // A session arriving means the magic link was clicked — flush the
      // consented subscriber record (name + email only) to `subscribers`.
      if (email) void syncSubscriberOnAuth(email);
      cb(email);
    });
    return () => data.subscription.unsubscribe();
  } catch {
    return () => {};
  }
}
