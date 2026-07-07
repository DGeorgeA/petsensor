/**
 * src/lib/subscribers.ts
 *
 * Subscriber record sync — exactly what the sign-in disclaimer promises and
 * nothing more: name + email + the Agree/Disagree personalisation consent.
 *
 * Flow: the user fills name/email and picks Agree in the sign-in popup BEFORE
 * they are authenticated (the magic link arrives by email), so the pending
 * record is parked in localStorage and upserted into `subscribers` the moment
 * a session exists (RLS only lets a user write their own email's row).
 */

import { supabase, isSupabaseConfigured } from './supabase';

const PENDING_KEY = 'smp_pending_subscriber';

export interface PendingSubscriber {
  name: string;
  email: string;
  personalization_consent: boolean;
}

export function stashPendingSubscriber(p: PendingSubscriber): void {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

function readPending(): PendingSubscriber | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as PendingSubscriber) : null;
  } catch {
    return null;
  }
}

function clearPending(): void {
  try { localStorage.removeItem(PENDING_KEY); } catch { /* ignore */ }
}

/**
 * Upsert the subscriber row for the now-authenticated user. Call on auth
 * change with the session email. Best-effort: failures never block the app,
 * and the pending record is kept for retry unless the write succeeded.
 */
export async function syncSubscriberOnAuth(sessionEmail: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const pending = readPending();
  // Only sync the record the user actually consented to, for their own email.
  if (!pending || pending.email.toLowerCase() !== sessionEmail.toLowerCase()) return;
  try {
    const { error } = await supabase
      .from('subscribers')
      .upsert(
        {
          email: sessionEmail,
          name: pending.name,
          personalization_consent: pending.personalization_consent,
          consent_at: pending.personalization_consent ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' },
      );
    if (!error) clearPending();
    else console.debug('subscriber sync deferred:', error.message);
  } catch {
    // Offline / table not yet created — retry on a later auth event.
  }
}

/** Disclaimer shown at sign-in (verbatim in the popup and kept cautious). */
export const SUBSCRIBER_DISCLAIMER =
  'To keep track of subscribers we save only unique details — your name and ' +
  'email address. No other personal details are stored, and your pet’s ' +
  'audio, video, and scan history never leave this device.';
