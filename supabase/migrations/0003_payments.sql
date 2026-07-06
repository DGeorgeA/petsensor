-- SenseMyPet — payment data model (P15)
-- Project ref: tcmcetpfdgpujayjbzrs
--
-- Provider-neutral tables. NOTHING here stores card numbers, CVV, banking
-- credentials, or provider SECRET keys — those never exist in this database.
-- Order creation, signature verification, and webhook reconciliation are done
-- by a Supabase Edge Function holding the provider secret in its environment.
--
-- RLS:
--   * provider config: read-only to clients, writable only via service_role.
--   * orders/transactions: users read ONLY their own rows; all writes are
--     service_role (the Edge Function) — the client can never mint an order
--     or mark a payment successful (P16/P17: no fake success).
--   * events (webhooks): service_role only.

-- ── payment_providers ─────────────────────────────────────────────────────────
create table if not exists public.payment_providers (
  id            uuid primary key default gen_random_uuid(),
  provider_code text not null unique check (provider_code in ('razorpay','paypal','google_pay')),
  enabled       boolean not null default false,
  environment   text not null default 'off' check (environment in ('off','test','live')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.payment_providers enable row level security;

drop policy if exists "payment_providers_read" on public.payment_providers;
create policy "payment_providers_read"
  on public.payment_providers for select
  to anon, authenticated
  using (true);
-- No insert/update/delete policies → admin config is service_role only.

-- ── payment_orders ────────────────────────────────────────────────────────────
create table if not exists public.payment_orders (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid,
  provider          text not null check (provider in ('razorpay','paypal','google_pay')),
  purpose           text not null check (purpose in
                      ('vet_plus_consultation','subscription','one_time_consultation','premium_scan')),
  amount_minor      integer not null check (amount_minor > 0),
  currency          text not null default 'INR',
  status            text not null default 'created' check (status in
                      ('created','pending','paid','failed','cancelled','refunded')),
  provider_order_id text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.payment_orders enable row level security;

drop policy if exists "payment_orders_read_own" on public.payment_orders;
create policy "payment_orders_read_own"
  on public.payment_orders for select
  to authenticated
  using (user_id = auth.uid());
-- No client write policies → orders are created/updated by the Edge Function only.

create index if not exists payment_orders_user_idx on public.payment_orders (user_id, created_at desc);
create index if not exists payment_orders_status_idx on public.payment_orders (status, created_at desc);

-- ── payment_transactions ──────────────────────────────────────────────────────
create table if not exists public.payment_transactions (
  id                      uuid primary key default gen_random_uuid(),
  order_id                uuid not null references public.payment_orders(id) on delete cascade,
  provider_transaction_id text,
  status                  text not null default 'initiated' check (status in
                            ('initiated','pending_verification','verified','failed','refunded')),
  verified_at             timestamptz,
  created_at              timestamptz not null default now()
);

alter table public.payment_transactions enable row level security;

drop policy if exists "payment_transactions_read_own" on public.payment_transactions;
create policy "payment_transactions_read_own"
  on public.payment_transactions for select
  to authenticated
  using (exists (
    select 1 from public.payment_orders o
    where o.id = order_id and o.user_id = auth.uid()
  ));
-- Writes: service_role only (verification happens server-side).

create index if not exists payment_transactions_order_idx on public.payment_transactions (order_id);

-- ── payment_events (webhook journal; idempotency via provider_event_id) ───────
create table if not exists public.payment_events (
  id                uuid primary key default gen_random_uuid(),
  provider          text not null,
  event_type        text not null,
  provider_event_id text not null,
  processing_status text not null default 'received' check (processing_status in
                      ('received','processed','ignored','error')),
  created_at        timestamptz not null default now(),
  unique (provider, provider_event_id)   -- duplicate webhook deliveries are no-ops
);

alter table public.payment_events enable row level security;
-- No client policies at all → service_role only.
