/**
 * src/lib/payments/adapters.ts
 *
 * Provider adapters (P13). Each adapter knows how to open ITS provider's
 * checkout given PUBLIC configuration + a SERVER-CREATED order id. None of them
 * can fabricate success: the terminal client-side state is pending_verification,
 * which the backend must verify (signature/webhook) before anything is granted.
 *
 * All three gateways (Razorpay, PayPal, Google Pay) are fully wired client-side.
 * They activate the moment a PUBLIC client id is configured (env or the admin
 * panel in Settings) and the payment system is switched to TEST/LIVE. Until
 * then every adapter reports not_configured and the UI shows no checkout (P16).
 */

import type { PaymentOutcome, PaymentProvider, ProviderCode } from './types';

function notConfigured(reason: string): PaymentOutcome {
  return { status: 'not_configured', reason };
}

function failed(reason: string): PaymentOutcome {
  return { status: 'failed', reason };
}

const inBrowser = () => typeof document !== 'undefined' && typeof window !== 'undefined';

/** Razorpay — loads checkout.js on demand; requires public key_id. */
export const RazorpayAdapter: PaymentProvider = {
  code: 'razorpay',
  displayName: 'Razorpay',
  isConfigured: (c) => !!c.publicClientId && c.environment !== 'off',
  async checkout(config, order, serverOrderId) {
    if (!this.isConfigured(config)) return notConfigured('Razorpay key_id not configured');
    if (!inBrowser()) return failed('Razorpay checkout requires a browser');
    try {
      await loadScriptOnce('https://checkout.razorpay.com/v1/checkout.js', 'razorpay-js');
      const Razorpay = (window as unknown as { Razorpay?: new (o: object) => { open(): void } }).Razorpay;
      if (!Razorpay) return failed('Razorpay script unavailable');
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
      return failed(e instanceof Error ? e.message : String(e));
    }
  },
};

// Minimal PayPal Buttons SDK surface.
interface PayPalButtonsApi {
  Buttons(opts: {
    createOrder: () => string;
    onApprove: (data: { orderID?: string; paymentID?: string }) => void;
    onCancel: () => void;
    onError: (err: unknown) => void;
  }): { render(el: HTMLElement): Promise<void> };
}

/**
 * PayPal — loads the JS SDK with the configured PUBLIC client-id and renders
 * the official Buttons in a lightweight overlay. `serverOrderId` must be a
 * backend-created PayPal order id; approval yields pending_verification for
 * the backend to capture + verify. The client never captures.
 */
export const PayPalAdapter: PaymentProvider = {
  code: 'paypal',
  displayName: 'PayPal',
  isConfigured: (c) => !!c.publicClientId && c.environment !== 'off',
  async checkout(config, order, serverOrderId) {
    if (!this.isConfigured(config)) return notConfigured('PayPal client-id not configured');
    if (!inBrowser()) return failed('PayPal checkout requires a browser');
    try {
      const src =
        'https://www.paypal.com/sdk/js' +
        `?client-id=${encodeURIComponent(config.publicClientId!)}` +
        `&currency=${encodeURIComponent(order.currency)}&intent=capture`;
      await loadScriptOnce(src, 'paypal-js');
      const paypal = (window as unknown as { paypal?: PayPalButtonsApi }).paypal;
      if (!paypal?.Buttons) return failed('PayPal SDK unavailable');

      return await new Promise<PaymentOutcome>((resolve) => {
        const overlay = mountCheckoutOverlay('Pay with PayPal', () => {
          overlay.cleanup();
          resolve({ status: 'cancelled' });
        });
        const settle = (outcome: PaymentOutcome) => { overlay.cleanup(); resolve(outcome); };
        paypal
          .Buttons({
            // The order already exists server-side — hand its id to the SDK.
            createOrder: () => serverOrderId,
            onApprove: (data) =>
              settle({
                status: 'pending_verification',
                providerOrderId: data.orderID ?? serverOrderId,
                providerPaymentId: data.paymentID ?? data.orderID ?? serverOrderId,
              }),
            onCancel: () => settle({ status: 'cancelled' }),
            onError: (err) => settle(failed(err instanceof Error ? err.message : String(err))),
          })
          .render(overlay.container)
          .catch((err: unknown) => settle(failed(err instanceof Error ? err.message : String(err))));
      });
    } catch (e) {
      return failed(e instanceof Error ? e.message : String(e));
    }
  },
};

// Minimal Google Pay API surface.
interface GPayPaymentsClient {
  loadPaymentData(req: object): Promise<{
    paymentMethodData?: { tokenizationData?: { token?: string } };
  }>;
}
interface GPayApi {
  PaymentsClient: new (opts: { environment: 'TEST' | 'PRODUCTION' }) => GPayPaymentsClient;
}

/**
 * Google Pay — loads pay.js and opens the official payment sheet. Google Pay
 * itself does not move money: it returns an encrypted, single-use payment token
 * that the BACKEND must submit to the processing gateway. So the outcome is
 * pending_verification carrying the token for server-side processing —
 * consistent with the no-fake-success rule.
 */
export const GooglePayAdapter: PaymentProvider = {
  code: 'google_pay',
  displayName: 'Google Pay',
  isConfigured: (c) => !!c.publicClientId && c.environment !== 'off',
  async checkout(config, order, serverOrderId) {
    if (!this.isConfigured(config)) return notConfigured('Google Pay merchant not configured');
    if (!inBrowser()) return failed('Google Pay checkout requires a browser');
    try {
      await loadScriptOnce('https://pay.google.com/gp/p/js/pay.js', 'gpay-js');
      const api = (window as unknown as { google?: { payments?: { api?: GPayApi } } })
        .google?.payments?.api;
      if (!api) return failed('Google Pay SDK unavailable');

      const client = new api.PaymentsClient({
        environment: config.environment === 'live' ? 'PRODUCTION' : 'TEST',
      });
      const request = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [
          {
            type: 'CARD',
            parameters: {
              allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
              allowedCardNetworks: ['VISA', 'MASTERCARD', 'AMEX', 'RUPAY'],
            },
            tokenizationSpecification: {
              type: 'PAYMENT_GATEWAY',
              // Tokens are processed server-side by the gateway the Edge
              // Function talks to; publicClientId doubles as the public
              // gateway merchant id.
              parameters: { gateway: 'razorpay', gatewayMerchantId: config.publicClientId },
            },
          },
        ],
        merchantInfo: { merchantId: config.publicClientId, merchantName: 'SenseMyPet' },
        transactionInfo: {
          totalPriceStatus: 'FINAL',
          totalPrice: (order.amountMinor / 100).toFixed(2),
          currencyCode: order.currency,
          transactionId: serverOrderId,
        },
      };

      const data = await client.loadPaymentData(request);
      const token = data.paymentMethodData?.tokenizationData?.token;
      if (!token) return failed('Google Pay returned no payment token');
      return {
        status: 'pending_verification',
        providerOrderId: serverOrderId,
        providerPaymentId: token,
      };
    } catch (e) {
      const code = (e as { statusCode?: string }).statusCode;
      if (code === 'CANCELED') return { status: 'cancelled' };
      return failed(e instanceof Error ? e.message : String(e));
    }
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

/**
 * Minimal overlay to host embedded checkout UI (PayPal Buttons render into a
 * container element rather than opening their own modal like Razorpay does).
 */
function mountCheckoutOverlay(title: string, onDismiss: () => void): {
  container: HTMLElement;
  cleanup: () => void;
} {
  const host = document.createElement('div');
  host.setAttribute('role', 'dialog');
  host.setAttribute('aria-label', title);
  host.style.cssText =
    'position:fixed;inset:0;z-index:400;display:flex;align-items:center;justify-content:center;' +
    'background:rgba(48,28,14,0.55);backdrop-filter:blur(10px);padding:1rem;';

  const card = document.createElement('div');
  card.style.cssText =
    'background:#fffcf8;border-radius:20px;padding:1.5rem;width:min(420px,94vw);' +
    'max-height:86dvh;overflow-y:auto;box-shadow:0 30px 80px rgba(60,30,10,0.3);position:relative;';

  const heading = document.createElement('div');
  heading.textContent = title;
  heading.style.cssText = 'font-weight:700;font-size:1rem;color:#3d2a20;margin-bottom:1rem;';

  const close = document.createElement('button');
  close.setAttribute('aria-label', 'Close checkout');
  close.textContent = '✕';
  close.style.cssText =
    'position:absolute;top:0.8rem;right:0.8rem;width:28px;height:28px;border-radius:50%;' +
    'border:1px solid rgba(0,0,0,0.12);background:#fff;cursor:pointer;color:#7a6058;';

  const container = document.createElement('div');

  card.append(heading, close, container);
  host.appendChild(card);
  document.body.appendChild(host);

  let done = false;
  const cleanup = () => {
    if (done) return;
    done = true;
    host.remove();
  };
  close.addEventListener('click', () => { onDismiss(); });
  host.addEventListener('click', (e) => { if (e.target === host) onDismiss(); });

  return { container, cleanup };
}
