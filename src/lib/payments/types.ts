/**
 * src/lib/payments/types.ts
 *
 * Provider-neutral payment abstraction (P13). The app is NOT hardcoded to any
 * gateway: UI → PaymentService → PaymentProvider interface → adapter.
 *
 * SECURITY INVARIANTS:
 *  - The frontend holds ONLY public configuration (publishable/client ids).
 *  - Secrets, order creation, signature + webhook verification, and payment
 *    reconciliation live server-side (Supabase Edge Function), never here.
 *  - No adapter may fabricate a success: without a server-verified transaction
 *    the flow ends in 'not_configured' or 'failed', never 'verified'.
 */

export type PaymentEnvironment = 'off' | 'test' | 'live';

export type ProviderCode = 'razorpay' | 'paypal' | 'google_pay' | 'none';

export type PaymentPurpose =
  | 'vet_plus_consultation'
  | 'subscription'
  | 'one_time_consultation'
  | 'premium_scan';

/** Public, non-secret runtime configuration. */
export interface PaymentConfig {
  enabled: boolean;
  environment: PaymentEnvironment;
  provider: ProviderCode;
  currency: string;
  /** Public client identifier (e.g. Razorpay key_id, PayPal client-id). NEVER a secret. */
  publicClientId: string | null;
  features: {
    vetPlus: boolean;
    subscription: boolean;
    oneTimeConsultation: boolean;
    premiumScan: boolean;
  };
}

export interface OrderRequest {
  purpose: PaymentPurpose;
  /** Minor units (paise/cents). */
  amountMinor: number;
  currency: string;
  description: string;
}

export type PaymentOutcome =
  /** Payments disabled or provider not configured — UI must not show checkout. */
  | { status: 'not_configured'; reason: string }
  /** Provider checkout opened and the user cancelled. */
  | { status: 'cancelled' }
  /** Provider/network failure. */
  | { status: 'failed'; reason: string }
  /**
   * Client-side flow finished; the ONLY trustworthy completion is server-side
   * verification, so the client returns pending_verification with the provider
   * references for the backend to verify. Never treat this as success.
   */
  | { status: 'pending_verification'; providerOrderId: string; providerPaymentId: string };

export interface PaymentProvider {
  readonly code: ProviderCode;
  readonly displayName: string;
  /** True when the public client configuration required to open checkout exists. */
  isConfigured(config: PaymentConfig): boolean;
  /**
   * Open the provider checkout for a server-created order. `serverOrderId` must
   * come from the backend (order creation is server-side only).
   */
  checkout(config: PaymentConfig, order: OrderRequest, serverOrderId: string): Promise<PaymentOutcome>;
}
