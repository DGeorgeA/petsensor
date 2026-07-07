/**
 * src/lib/payments/PaymentService.ts
 *
 * Single entry point the UI talks to (P13/P14). Resolves PUBLIC configuration
 * from (in order) env → device admin override (localStorage, dev/admin only),
 * routes to the configured adapter, and enforces the no-fake-success rule.
 *
 * Config keys (all PUBLIC; secrets live in the Supabase Edge Function only):
 *   env:   VITE_PAYMENTS_ENABLED, VITE_PAYMENTS_ENV, VITE_PAYMENTS_PROVIDER,
 *          VITE_PAYMENTS_CURRENCY, VITE_PAYMENTS_PUBLIC_CLIENT_ID,
 *          VITE_PAYMENTS_FEATURES (csv: vetPlus,subscription,oneTime,premiumScan)
 *   local: smp_payments_admin (JSON PaymentConfig subset — dev/admin override)
 */

import { ADAPTERS } from './adapters';
import type { PaymentConfig, PaymentOutcome, OrderRequest, PaymentPurpose, ProviderCode, PaymentEnvironment } from './types';

const ADMIN_KEY = 'smp_payments_admin';

function envStr(key: string): string | undefined {
  try {
    return (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.[key];
  } catch {
    return undefined;
  }
}

function defaultConfig(): PaymentConfig {
  const features = (envStr('VITE_PAYMENTS_FEATURES') ?? '').split(',').map((s) => s.trim());
  return {
    enabled: envStr('VITE_PAYMENTS_ENABLED') === 'true',
    environment: (envStr('VITE_PAYMENTS_ENV') as PaymentEnvironment) || 'off',
    provider: (envStr('VITE_PAYMENTS_PROVIDER') as ProviderCode) || 'none',
    currency: envStr('VITE_PAYMENTS_CURRENCY') || 'INR',
    publicClientId: envStr('VITE_PAYMENTS_PUBLIC_CLIENT_ID') || null,
    features: {
      vetPlus: features.includes('vetPlus'),
      subscription: features.includes('subscription'),
      oneTimeConsultation: features.includes('oneTime'),
      premiumScan: features.includes('premiumScan'),
    },
  };
}

/** Device-local admin override (dev/admin panel in Settings). PUBLIC values only. */
function adminOverride(): Partial<PaymentConfig> | null {
  try {
    const raw = localStorage.getItem(ADMIN_KEY);
    return raw ? (JSON.parse(raw) as Partial<PaymentConfig>) : null;
  } catch {
    return null;
  }
}

export function getPaymentConfig(): PaymentConfig {
  const base = defaultConfig();
  const admin = adminOverride();
  if (!admin) return base;
  return {
    ...base,
    ...admin,
    features: { ...base.features, ...(admin.features ?? {}) },
  };
}

export function setAdminPaymentConfig(patch: Partial<PaymentConfig> | null): void {
  try {
    if (patch === null) localStorage.removeItem(ADMIN_KEY);
    else localStorage.setItem(ADMIN_KEY, JSON.stringify(patch));
  } catch {
    /* localStorage unavailable */
  }
}

/** Device-local Hide/Unhide flag for the payment page (Settings toggle). */
export function paymentPageVisible(): boolean {
  try { return localStorage.getItem('smp_payments_visible') !== 'false'; } catch { return true; }
}

/** Is a given purchasable feature currently offered? (P16: absent → no UI.) */
export function isPurchasable(purpose: PaymentPurpose): boolean {
  const c = getPaymentConfig();
  // The user's Hide toggle removes every payment surface, not just Settings.
  if (!paymentPageVisible()) return false;
  if (!c.enabled || c.environment === 'off' || c.provider === 'none') return false;
  const adapter = ADAPTERS[c.provider];
  if (!adapter.isConfigured(c)) return false;
  switch (purpose) {
    case 'vet_plus_consultation': return c.features.vetPlus;
    case 'subscription': return c.features.subscription;
    case 'one_time_consultation': return c.features.oneTimeConsultation;
    case 'premium_scan': return c.features.premiumScan;
  }
}

/**
 * Begin a checkout. Requires a SERVER-created order id (order creation and
 * verification are backend responsibilities — the client never mints orders).
 * Returns pending_verification at best; granting anything happens only after
 * the backend verifies the transaction (P17).
 */
export async function beginCheckout(order: OrderRequest, serverOrderId: string): Promise<PaymentOutcome> {
  const c = getPaymentConfig();
  if (!c.enabled || c.environment === 'off') {
    return { status: 'not_configured', reason: 'Payments are disabled' };
  }
  const adapter = ADAPTERS[c.provider];
  return adapter.checkout(c, order, serverOrderId);
}
