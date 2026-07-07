import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, UserRound, ShieldCheck } from 'lucide-react';
import { useIsMobile } from '../lib/useIsMobile';
import { signInWithEmail, chooseGuestMode, isSignInAvailable } from '../lib/auth';
import { stashPendingSubscriber, SUBSCRIBER_DISCLAIMER } from '../lib/subscribers';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called when the user picks guest mode (modal closes itself after). */
  onGuest: () => void;
  /** Called after a magic link is successfully requested. */
  onLinkSent?: (email: string) => void;
}

/**
 * AuthModal — optional sign-in popup for personalised vet reports.
 *
 * Guest Mode is always offered first-class: every feature works without an
 * account. Sign-in is passwordless (email magic link) and is used only to put
 * "Prepared by <owner>" on shared reports. Uses the flex-wrapper centering
 * pattern (never transform-centering under framer-motion).
 */
export default function AuthModal({ open, onClose, onGuest, onLinkSent }: Props) {
  const isMobile = useIsMobile();

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="auth-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 230,
              background: 'rgba(48, 28, 14, 0.5)',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              cursor: 'pointer',
            }}
          />
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 231,
              display: 'flex', justifyContent: 'center',
              alignItems: isMobile ? 'flex-end' : 'center',
              padding: isMobile ? '0 0.7rem 0.85rem' : '1.5rem',
              pointerEvents: 'none',
            }}
          >
            {/* AuthCard mounts fresh each open → email/notice state resets naturally. */}
            <AuthCard
              isMobile={isMobile}
              onClose={onClose}
              onGuest={onGuest}
              onLinkSent={onLinkSent}
            />
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function AuthCard({ isMobile, onClose, onGuest, onLinkSent }: {
  isMobile: boolean;
  onClose: () => void;
  onGuest: () => void;
  onLinkSent?: (email: string) => void;
}) {
  const available = isSignInAvailable();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const handleGuest = useCallback(() => {
    chooseGuestMode();
    onGuest();
    onClose();
  }, [onGuest, onClose]);

  /** "Agree & sign in" — consent to save name+email as the subscriber record. */
  const handleAgree = useCallback(async () => {
    const addr = email.trim();
    if (!name.trim()) {
      setNotice('Please enter your name.');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(addr)) {
      setNotice('Please enter a valid email address.');
      return;
    }
    setBusy(true);
    // Parked locally until the magic link authenticates; then upserted to
    // `subscribers` (name + email + consent — nothing else, per disclaimer).
    stashPendingSubscriber({ name: name.trim(), email: addr, personalization_consent: true });
    const res = await signInWithEmail(addr);
    setBusy(false);
    if (res.ok) {
      setNotice(`Sign-in link sent to ${addr} — check your inbox, then return here.`);
      onLinkSent?.(addr);
    } else {
      setNotice(res.reason ?? 'Could not send the sign-in link.');
    }
  }, [name, email, onLinkSent]);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.7rem 0.9rem', borderRadius: 12,
    border: '1.5px solid rgba(0,0,0,0.12)', background: '#fff',
    fontSize: '0.9rem', fontFamily: 'var(--font-family)', color: 'var(--color-text-dark)',
  };

  return (
    <motion.div
      key="auth-card"
      role="dialog" aria-modal="true" aria-label="Sign in or continue as guest"
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 14 }}
      transition={{ type: 'spring', damping: 24, stiffness: 300, mass: 0.85 }}
      style={{
        pointerEvents: 'auto', position: 'relative',
        width: isMobile ? '100%' : 'min(440px, 92vw)',
        maxHeight: 'min(86dvh, 620px)', overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        background: 'linear-gradient(160deg, rgba(255,252,248,0.98), rgba(255,243,235,0.96))',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderRadius: 26, border: '1.5px solid rgba(255,255,255,0.9)',
        boxShadow: '0 30px 80px rgba(60,30,10,0.24)',
        padding: 'clamp(1.4rem, 4vw, 1.8rem)',
      }}
    >
      <button
        onClick={onClose} aria-label="Close"
        style={{
          position: 'absolute', top: '0.9rem', right: '0.9rem', width: 30, height: 30,
          borderRadius: '50%', background: 'rgba(255,255,255,0.9)',
          border: '1.5px solid rgba(0,0,0,0.08)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#7a6058', zIndex: 2,
        }}
      >
        <X size={15} />
      </button>

      <div style={{ textAlign: 'center', marginBottom: '1.2rem', paddingRight: '1.5rem' }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16, margin: '0 auto 0.7rem',
          background: 'linear-gradient(135deg, #a8e6cf, #dcedc1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <UserRound size={24} color="#2f5f47" />
        </div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-dark)', margin: 0, letterSpacing: '-0.01em' }}>
          Sign in for personalised reports
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: '0.35rem 0 0', lineHeight: 1.5 }}>
          An account personalises your experience and unlocks vet-report generation.
          Guest Mode keeps every screening feature — without report generation.
        </p>
      </div>

      {available ? (
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-dark)', display: 'block', marginBottom: 6 }}>
            Your name
          </label>
          <input
            type="text" value={name} placeholder="e.g. Deepak"
            onChange={(e) => setName(e.target.value)}
            style={{ ...inputStyle, marginBottom: '0.6rem' }}
          />
          <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-dark)', display: 'block', marginBottom: 6 }}>
            Email (passwordless sign-in link)
          </label>
          <input
            type="email" value={email} placeholder="you@example.com"
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void handleAgree(); }}
            style={inputStyle}
          />

          {/* Subscriber disclaimer + explicit consent choice */}
          <div style={{
            background: 'rgba(126,203,168,0.1)', border: '1px solid rgba(126,203,168,0.35)',
            borderRadius: 12, padding: '0.7rem 0.85rem', margin: '0.7rem 0 0.7rem',
          }}>
            <p style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', lineHeight: 1.55, margin: 0 }}>
              {SUBSCRIBER_DISCLAIMER}
            </p>
          </div>

          <button
            onClick={() => void handleAgree()}
            disabled={busy}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '0.45rem', padding: '0.75rem 1rem',
              background: 'linear-gradient(135deg, #ff9e8a, #ff7e6a)', color: 'white',
              border: 'none', borderRadius: 12, fontSize: '0.9rem', fontWeight: 700,
              cursor: busy ? 'wait' : 'pointer', fontFamily: 'var(--font-family)',
              opacity: busy ? 0.7 : 1,
            }}
          >
            <Mail size={15} /> {busy ? 'Sending…' : 'Agree & send sign-in link'}
          </button>
        </div>
      ) : (
        <div style={{
          background: 'rgba(244,192,122,0.15)', border: '1px solid rgba(244,192,122,0.4)',
          borderRadius: 12, padding: '0.8rem 0.95rem', marginBottom: '1rem',
        }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
            Account sign-in is not enabled in this build yet. Guest Mode gives you the
            full screening experience; report generation needs an account.
          </p>
        </div>
      )}

      <button
        onClick={handleGuest}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '0.45rem', padding: '0.75rem 1rem',
          background: 'rgba(255,255,255,0.9)', color: 'var(--color-text-dark)',
          border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: 12,
          fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-family)',
        }}
      >
        Disagree — continue as Guest
      </button>
      <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textAlign: 'center', margin: '0.45rem 0 0', lineHeight: 1.45 }}>
        Guest Mode saves nothing about you. Screening works fully; report generation is unavailable.
      </p>

      {notice && (
        <p style={{ fontSize: '0.78rem', color: '#4a7a62', fontWeight: 600, margin: '0.7rem 0 0', textAlign: 'center' }}>
          {notice}
        </p>
      )}

      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
        background: 'rgba(126,203,168,0.08)', borderRadius: 12,
        padding: '0.65rem 0.8rem', marginTop: '0.9rem',
      }}>
        <ShieldCheck size={13} color="#7ecba8" style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
          Signing in never uploads your pet's audio, video, or scan history — it only
          adds your name to reports you choose to share.
        </p>
      </div>
    </motion.div>
  );
}
