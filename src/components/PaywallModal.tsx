import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, CreditCard, Heart } from 'lucide-react';
import { useIsMobile } from '../lib/useIsMobile';
import { FREE_TRIES } from '../lib/usageGate';
import { getPaymentConfig, isPurchasable, beginCheckout } from '../lib/payments/PaymentService';

interface Props {
  open: boolean;
  species: 'dog' | 'cat';
  onClose: () => void;
}

/**
 * PaywallModal — shown when a species' 25 free complete checks are used and
 * the user starts another scan.
 *
 * NO-FAKE-SUCCESS: checkout only opens when a provider is genuinely
 * configured; the client-side terminal state is pending_verification (the
 * backend must verify before anything unlocks). When payments are OFF, the
 * window says so honestly — it never simulates a purchase.
 */
export default function PaywallModal({ open, species, onClose }: Props) {
  const isMobile = useIsMobile();
  const purchasable = isPurchasable('subscription') || isPurchasable('premium_scan');
  const cfg = getPaymentConfig();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const speciesTitle = species === 'dog' ? 'Sense My Dog' : 'Sense My Cat';

  const handleCheckout = useCallback(async () => {
    setBusy(true);
    setNotice(null);
    // Order creation is server-side only. Without a backend-created order id
    // no charge can begin — surface that honestly instead of faking a flow.
    const outcome = await beginCheckout(
      {
        purpose: isPurchasable('subscription') ? 'subscription' : 'premium_scan',
        amountMinor: 19900,
        currency: cfg.currency,
        description: `SenseMyPet subscription — continue ${speciesTitle}`,
      },
      '', // no server order id yet → adapters refuse rather than fabricate
    );
    setBusy(false);
    switch (outcome.status) {
      case 'pending_verification':
        setNotice('Payment received — verification in progress. Access unlocks once the payment is confirmed.');
        break;
      case 'cancelled':
        setNotice('Checkout cancelled.');
        break;
      case 'failed':
        setNotice(`Payment could not start: ${outcome.reason}`);
        break;
      case 'not_configured':
        setNotice('Checkout is not available yet — subscriptions are launching soon.');
        break;
    }
  }, [cfg.currency, speciesTitle]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="paywall-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 240,
              background: 'rgba(48, 28, 14, 0.55)',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              cursor: 'pointer',
            }}
          />
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 241,
              display: 'flex', justifyContent: 'center',
              alignItems: isMobile ? 'flex-end' : 'center',
              padding: isMobile ? '0 0.7rem 0.85rem' : '1.5rem',
              pointerEvents: 'none',
            }}
          >
            <motion.div
              key="paywall-card"
              role="dialog" aria-modal="true" aria-label="Free checks used"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 14 }}
              transition={{ type: 'spring', damping: 24, stiffness: 300, mass: 0.85 }}
              style={{
                pointerEvents: 'auto', position: 'relative',
                width: isMobile ? '100%' : 'min(440px, 92vw)',
                maxHeight: 'min(86dvh, 560px)', overflowY: 'auto',
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

              <div style={{ textAlign: 'center', marginBottom: '1.1rem', paddingRight: '1.5rem' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 16, margin: '0 auto 0.7rem',
                  background: 'linear-gradient(135deg, #f4c07a, #ffd3b6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Lock size={24} color="#7a5220" />
                </div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-dark)', margin: 0, letterSpacing: '-0.01em' }}>
                  Your {FREE_TRIES} free checks are used
                </h2>
                <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', margin: '0.4rem 0 0', lineHeight: 1.55 }}>
                  You've completed {FREE_TRIES} full <strong>{speciesTitle}</strong> checks — thank you for
                  caring for your companion. Continuing needs a subscription.
                </p>
              </div>

              {purchasable ? (
                <button
                  onClick={() => void handleCheckout()}
                  disabled={busy}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '0.45rem', padding: '0.8rem 1rem',
                    background: 'linear-gradient(135deg, #ff9e8a, #ff7e6a)', color: 'white',
                    border: 'none', borderRadius: 12, fontSize: '0.92rem', fontWeight: 700,
                    cursor: busy ? 'wait' : 'pointer', fontFamily: 'var(--font-family)',
                    opacity: busy ? 0.7 : 1,
                  }}
                >
                  <CreditCard size={15} /> {busy ? 'Opening checkout…' : 'Continue with a subscription'}
                </button>
              ) : (
                <div style={{
                  background: 'rgba(244,192,122,0.15)', border: '1px solid rgba(244,192,122,0.4)',
                  borderRadius: 12, padding: '0.85rem 1rem',
                }}>
                  <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.55 }}>
                    Subscriptions are launching soon — checkout isn't enabled yet, so scanning
                    stays free for now. We'll never charge without a real, verified payment flow.
                  </p>
                </div>
              )}

              {notice && (
                <p style={{ fontSize: '0.78rem', color: '#7a5220', fontWeight: 600, margin: '0.7rem 0 0', textAlign: 'center' }}>
                  {notice}
                </p>
              )}

              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                background: 'rgba(126,203,168,0.08)', borderRadius: 12,
                padding: '0.65rem 0.8rem', marginTop: '0.9rem',
              }}>
                <Heart size={13} color="#7ecba8" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
                  Charges are confirmed only after server-side verification. Your scan history and
                  pet data stay on this device regardless of subscription status.
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
