/**
 * src/lib/payments/adapters.ts
 *
 * Provider adapters (P13). Each adapter knows how to open ITS provider's
 * checkout given PUBLIC configuration + a SERVER-CREATED order id. None of them
 * can fabricate success: the terminal client-side state is pending_verification,
 * which the backend must verify (signature/webhook) before anything is granted.
 *
 * Until production credentials + business approval exist, every adapter reports
 * not_configured (payments.enabled=false and publicClientId=null by default) —
 * the UI then shows no checkout at all (P16).
 */

import type { PaymentOutcome, PaymentProvider, ProviderCode } from './types';

function notConfigured(reason: string): PaymentOutcome {
  return { status: 'not_configured', reason };
}

/** Razorpay — loads checkout.js on demand; requires public key_id. */
export const RazorpayAdapter: PaymentProvider = {
  code: 'razorpay',
  displayName: 'Razorpay',
  isConfigured: (c) => !!c.publicClientId && c.environment !== 'off',
  async checkout(config, order, serverOrderId) {
    if (!this.isConfigured(config)) return notConfigured('Razorpay key_id not configured');
    try {
      await loadScriptOnce('https://checkout.razorpay.com/v1/checkout.js', 'razorpay-js');
      const Razorpay = (window as unknown as { Razorpay?: new (o: object) => { open(): void } }).Razorpay;
      if (!Razorpay) return { status: 'failed', reason: 'Razorpay script unavailable' };
      return await new Promise<PaymentOutcome>((resolve) => {
        const rzp = new Razorpay({
          key: config.publicClientId,
          order_id: serverOrderId,
          amount: order.amountMinor,
          currency: order.currency,
          description: order.description,
          handler: (resp: { razorpay_order_id: string; razorpay_payment_id: string }) =>
            resolve({
              status: 'pending_verification',
              providerOrderId: resp.razorpay_order_id,
              providerPaymentId: resp.razorpay_payment_id,
            }),
          modal: { ondismiss: () => resolve({ status: 'cancelled' }) },
        });
        rzp.open();
      });
    } catch (e) {
      return { status: 'failed', reason: e instanceof Error ? e.message : String(e) };
    }
  },
};

/** PayPal — placeholder adapter: reports not_configured until client-id + backend exist. */
export const PayPalAdapter: PaymentProvider = {
  code: 'paypal',
  displayName: 'PayPal',
  isConfigured: (c) => !!c.publicClientId && c.environment !== 'off',
  async checkout(config) {
    if (!this.isConfigured(config)) return notConfigured('PayPal client-id not configured');
    // SDK integration lands with backend order routes; never fake success.
    return notConfigured('PayPal checkout backend not yet enabled');
  },
};

/** Google Pay — placeholder adapter: reports not_configured until merchant config exists. */
export const GooglePayAdapter: PaymentProvider = {
  code: 'google_pay',
  displayName: 'Google Pay',
  isConfigured: (c) => !!c.publicClientId && c.environment !== 'off',
  async checkout(config) {
    if (!this.isConfigured(config)) return notConfigured('Google Pay merchant not configured');
    return notConfigured('Google Pay checkout backend not yet enabled');
  },
};

/** Explicit "no provider" adapter. */
export const NoneAdapter: PaymentProvider = {
  code: 'none',
  displayName: 'None',
  isConfigured: () => false,
  async checkout() {
    return notConfigured('No payment provider selected');
  },
};

export const ADAPTERS: Record<ProviderCode, PaymentProvider> = {
  razorpay: RazorpayAdapter,
  paypal: PayPalAdapter,
  google_pay: GooglePayAdapter,
  none: NoneAdapter,
};

// ── util ────────────────────────────────────────────────────────────────────────
const loaded = new Set<string>();
function loadScriptOnce(src: string, id: string): Promise<void> {
  if (loaded.has(id) || document.getElementById(id)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.id = id;
    s.src = src;
    s.async = true;
    s.onload = () => { loaded.add(id); resolve(); };
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}
