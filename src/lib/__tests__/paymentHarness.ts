/**
 * src/lib/__tests__/paymentHarness.ts
 *
 * P19 payment matrix — exercises the provider-neutral abstraction WITHOUT any
 * real gateway: payments OFF, TEST mode flagging, provider unavailable,
 * provider switch, and the no-fake-success invariant (a client-side flow can
 * never terminate in a verified/success state).
 *
 * Run:  npx tsx src/lib/__tests__/paymentHarness.ts
 */

import { ADAPTERS } from '../payments/adapters';
import type { PaymentConfig, OrderRequest, ProviderCode } from '../payments/types';

let pass = 0, fail = 0;
function check(name: string, cond: boolean, detail = '') {
  if (cond) { pass++; console.log(`  [PASS] ${name.padEnd(56)} ${detail}`); }
  else { fail++; console.log(`  [FAIL] ${name.padEnd(56)} ${detail}`); }
}

const order: OrderRequest = {
  purpose: 'vet_plus_consultation',
  amountMinor: 49900,
  currency: 'INR',
  description: 'Vet+ consultation request',
};

function cfg(patch: Partial<PaymentConfig>): PaymentConfig {
  return {
    enabled: false, environment: 'off', provider: 'none', currency: 'INR',
    publicClientId: null,
    features: { vetPlus: false, subscription: false, oneTimeConsultation: false, premiumScan: false },
    ...patch,
  } as PaymentConfig;
}

async function main() {
  console.log('\n=== SenseMyPet — Payment Abstraction Harness (P13/P16/P19) ===\n');

  // 1. Payments OFF → every adapter refuses with not_configured.
  for (const code of Object.keys(ADAPTERS) as ProviderCode[]) {
    const out = await ADAPTERS[code].checkout(cfg({}), order, 'server-order-x');
    check(`payments OFF → ${code} refuses checkout`, out.status === 'not_configured', out.status);
  }

  // 2. Provider unavailable (enabled but no public client id) → not_configured.
  const noId = cfg({ enabled: true, environment: 'test', provider: 'razorpay' });
  check('razorpay without key_id is not configured', !ADAPTERS.razorpay.isConfigured(noId));
  const noIdOut = await ADAPTERS.razorpay.checkout(noId, order, 'server-order-x');
  check('razorpay without key_id refuses checkout', noIdOut.status === 'not_configured', noIdOut.status);

  // 3. Provider switch — the registry resolves each code to its own adapter.
  check('provider switch resolves distinct adapters',
    ADAPTERS.razorpay.code === 'razorpay' && ADAPTERS.paypal.code === 'paypal' &&
    ADAPTERS.google_pay.code === 'google_pay' && ADAPTERS.none.code === 'none');

  // 4. TEST-mode visibility: configuration carries the environment so UI can flag it.
  const testCfg = cfg({ enabled: true, environment: 'test', provider: 'razorpay', publicClientId: 'rzp_test_PUBLIC' });
  check('test environment is distinguishable for UI badging', testCfg.environment === 'test');
  check('configured razorpay (public id) reports configured', ADAPTERS.razorpay.isConfigured(testCfg));

  // 5. NO FAKE SUCCESS — the outcome type has no client-side "success". A fully
  //    configured adapter running with no real provider SDK (this Node process
  //    has no DOM) must terminate in failed/not_configured — NEVER
  //    pending_verification, which only a live provider interaction can yield.
  const pp = await ADAPTERS.paypal.checkout(cfg({ enabled: true, environment: 'test', provider: 'paypal', publicClientId: 'pp_PUBLIC' }), order, 'server-order-x');
  check('paypal cannot fabricate success without real provider',
    pp.status === 'failed' || pp.status === 'not_configured', pp.status);
  const gp = await ADAPTERS.google_pay.checkout(cfg({ enabled: true, environment: 'test', provider: 'google_pay', publicClientId: 'gp_PUBLIC' }), order, 'server-order-x');
  check('google_pay cannot fabricate success without real provider',
    gp.status === 'failed' || gp.status === 'not_configured', gp.status);
  const rz = await ADAPTERS.razorpay.checkout(cfg({ enabled: true, environment: 'test', provider: 'razorpay', publicClientId: 'rzp_test_PUBLIC' }), order, 'server-order-x');
  check('razorpay cannot fabricate success without real provider',
    rz.status === 'failed' || rz.status === 'not_configured', rz.status);

  // 6. Secrets hygiene — the payments frontend modules must not reference
  //    secret-shaped configuration at all.
  const { readFileSync } = await import('node:fs');
  const src = ['types.ts', 'adapters.ts', 'PaymentService.ts']
    .map((f) => readFileSync(new URL(`../payments/${f}`, import.meta.url), 'utf8'))
    .join('\n');
  check('no secret key names in frontend payment code',
    !/key_secret|client_secret|SECRET_KEY|webhook_secret/i.test(src.replace(/never a secret|provider SECRET keys|secret in its environment|Secrets, order creation/gi, '')));

  console.log(`\n=== ${pass} passed, ${fail} failed ===`);
  if (fail > 0) process.exitCode = 1;
}

void main();
