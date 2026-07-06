import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, ShieldAlert, FlaskConical } from 'lucide-react';
import {
  getPaymentConfig,
  setAdminPaymentConfig,
} from '../lib/payments/PaymentService';
import type { PaymentEnvironment, ProviderCode, PaymentConfig } from '../lib/payments/types';
import { devDiagnosticsEnabled } from '../lib/devMode';

/**
 * Payment settings (P14).
 *
 * CONSUMER section: shown ONLY when payments are enabled — otherwise nothing
 * payment-related appears in the normal journey (P16: no fake checkout, no
 * "coming soon" unless strategy needs it).
 *
 * ADMIN/DEV section: appears only in dev mode (localStorage smp_dev=1). It
 * edits ONLY public configuration (mode, provider, feature flags, public client
 * id). Secrets never exist client-side — order creation/verification is the
 * Edge Function's job.
 */

const sectionLabel: React.CSSProperties = {
  fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: 'var(--color-text-muted)',
  marginBottom: '0.75rem', paddingLeft: '0.25rem',
};

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(16px)',
  border: '1.5px solid rgba(255,255,255,0.8)', borderRadius: 18,
  padding: '1.1rem 1.25rem',
};

const selectStyle: React.CSSProperties = {
  width: '100%', padding: '0.55rem 0.7rem', borderRadius: 10,
  border: '1.5px solid rgba(0,0,0,0.12)', background: '#fff',
  fontSize: '0.88rem', fontFamily: 'var(--font-family)', color: 'var(--color-text-dark)',
};

export default function PaymentSettings() {
  const [cfg, setCfg] = useState<PaymentConfig>(() => getPaymentConfig());
  const isDev = devDiagnosticsEnabled();

  const applyAdmin = (patch: Partial<PaymentConfig>) => {
    const next = { ...cfg, ...patch, features: { ...cfg.features, ...(patch.features ?? {}) } };
    setAdminPaymentConfig({
      enabled: next.enabled,
      environment: next.environment,
      provider: next.provider,
      publicClientId: next.publicClientId,
      features: next.features,
    });
    setCfg(getPaymentConfig());
  };

  const consumerVisible = cfg.enabled && cfg.environment !== 'off' && cfg.provider !== 'none';

  if (!consumerVisible && !isDev) return null; // P16: payments disabled → nothing shown

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      style={{ marginBottom: '2rem' }}
    >
      <p style={sectionLabel}>Payments</p>

      {/* ── CONSUMER: only when payments are actually enabled ─────────── */}
      {consumerVisible && (
        <div style={{ ...card, marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <CreditCard size={18} color="#4a7a62" />
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text-dark)' }}>
              Payment methods &amp; billing
            </div>
            {cfg.environment === 'test' && (
              <span style={{
                marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.05em',
                background: 'rgba(244,192,122,0.25)', color: '#9a6520',
                border: '1px solid rgba(244,192,122,0.5)', borderRadius: 999, padding: '0.15rem 0.55rem',
              }}>
                <FlaskConical size={11} /> TEST MODE
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
            Provider: <strong>{cfg.provider}</strong> · Currency: <strong>{cfg.currency}</strong>.
            Charges are only ever confirmed after server-side verification. No card details are
            stored in this app.
          </p>
        </div>
      )}

      {/* ── ADMIN / DEV: public configuration only ─────────────────────── */}
      {isDev && (
        <div style={{ ...card, borderColor: 'rgba(255,158,138,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
            <ShieldAlert size={16} color="#c05440" />
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#c05440' }}>
              Admin · payment configuration (dev mode)
            </div>
          </div>

          <div style={{ display: 'grid', gap: '0.7rem' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-dark)' }}>
              Payment system
              <select
                style={{ ...selectStyle, marginTop: 4 }}
                value={cfg.enabled ? cfg.environment : 'off'}
                onChange={(e) => {
                  const v = e.target.value as PaymentEnvironment;
                  applyAdmin({ enabled: v !== 'off', environment: v });
                }}
              >
                <option value="off">OFF</option>
                <option value="test">TEST</option>
                <option value="live">LIVE</option>
              </select>
            </label>

            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-dark)' }}>
              Provider
              <select
                style={{ ...selectStyle, marginTop: 4 }}
                value={cfg.provider}
                onChange={(e) => applyAdmin({ provider: e.target.value as ProviderCode })}
              >
                <option value="none">NONE</option>
                <option value="razorpay">RAZORPAY</option>
                <option value="paypal">PAYPAL</option>
                <option value="google_pay">GOOGLE_PAY</option>
              </select>
            </label>

            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-dark)' }}>
              Public client id (publishable — never a secret)
              <input
                style={{ ...selectStyle, marginTop: 4 }}
                value={cfg.publicClientId ?? ''}
                placeholder="e.g. rzp_test_…"
                onChange={(e) => applyAdmin({ publicClientId: e.target.value || null })}
              />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
              {([
                ['vetPlus', 'Vet+ payment'],
                ['subscription', 'Subscription'],
                ['oneTimeConsultation', 'One-time consult'],
                ['premiumScan', 'Premium scan'],
              ] as const).map(([key, label]) => (
                <label key={key} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: '0.78rem', color: 'var(--color-text-dark)', cursor: 'pointer',
                }}>
                  <input
                    type="checkbox"
                    checked={cfg.features[key]}
                    onChange={(e) => applyAdmin({ features: { ...cfg.features, [key]: e.target.checked } })}
                  />
                  {label}
                </label>
              ))}
            </div>

            <button
              type="button"
              onClick={() => { setAdminPaymentConfig(null); setCfg(getPaymentConfig()); }}
              style={{
                justifySelf: 'start', fontSize: '0.75rem', fontWeight: 700,
                background: 'transparent', border: '1px solid rgba(0,0,0,0.15)',
                borderRadius: 8, padding: '0.35rem 0.7rem', cursor: 'pointer',
                color: 'var(--color-text-muted)', fontFamily: 'var(--font-family)',
              }}
            >
              Reset to environment defaults
            </button>

            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', lineHeight: 1.45, margin: 0 }}>
              This panel stores PUBLIC configuration on this device only. Secret keys, order creation,
              signature and webhook verification live in the Supabase Edge Function — never in the app.
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
