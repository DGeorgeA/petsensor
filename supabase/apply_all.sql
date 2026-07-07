-- SenseMyPet — CONSOLIDATED SETUP (paste into the Supabase SQL editor and Run)
-- https://supabase.com/dashboard/project/tcmcetpfdgpujayjbzrs/sql/new
--
-- Idempotent: safe to run more than once. Creates the four table groups the
-- app expects (vet_partners, scan_results, payments, subscribers) with strict
-- RLS, plus the read policy for the audio_sense storage bucket.

-- ═══ supabase/migrations\0001_vet_partners.sql ═══════════════════════════════
-- SenseMyPet — Vet+ partner onboarding
-- Project ref: tcmcetpfdgpujayjbzrs
--
-- This is the ONLY table the client writes to. It holds professional/business
-- data submitted BY veterinarians (clinic, registration number, contact). It
-- never contains pet-owner audio, video, derived features, or scan rows — the
-- app's privacy invariant is unchanged.
--
-- RLS design:
--   - anon may INSERT an application (status is forced to 'pending' via default
--     + a WITH CHECK constraint); anon may NOT read, update, or delete.
--   - review/verification happens with the service_role key (server-side only).

create table if not exists public.vet_partners (
  id           uuid primary key default gen_random_uuid(),
  clinic_name  text        not null,
  vet_name     text        not null,
  license_no   text        not null,
  email        text        not null,
  phone        text,
  city         text,
  species      text[]      not null default '{}',
  services     text,
  message      text,
  status       text        not null default 'pending',
  source       text,
  created_at   timestamptz not null default now()
);

alter table public.vet_partners enable row level security;

-- Allow anonymous/authenticated clients to submit an application only.
drop policy if exists "vet_partners_insert_public" on public.vet_partners;
create policy "vet_partners_insert_public"
  on public.vet_partners
  for insert
  to anon, authenticated
  with check (status = 'pending');

-- No SELECT/UPDATE/DELETE policies for anon → reviewing is service_role only.

-- Helpful review index.
create index if not exists vet_partners_status_created_idx
  on public.vet_partners (status, created_at desc);

-- ═══ supabase/migrations\0002_scan_results.sql ═══════════════════════════════
-- SenseMyPet — scan_results (metadata ONLY, per product spec §9)
-- Project ref: tcmcetpfdgpujayjbzrs
--
-- Stores a minimal, non-reconstructable summary of completed screenings so the
-- product can measure aggregate usage and calibrate reference thresholds.
--
-- PRIVACY INVARIANTS (non-negotiable):
--   * NO raw audio, video, frames, features, or embeddings — metadata only.
--   * anon clients may INSERT a summary row; they may NOT read, update, or
--     delete anything (aggregate analysis happens service-side only).

create table if not exists public.scan_results (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid,                     -- nullable: app runs unauthenticated
  species             text not null check (species in ('dog', 'cat')),
  scan_mode           text not null default 'unified',
  screening_class     text not null check (screening_class in
                        ('RELAXED','POSSIBLE_STRESS','POSSIBLE_ANXIETY','EMERGENCY')),
  stress_signal_index smallint not null check (stress_signal_index between 0 and 100),
  observation_confidence smallint not null check (observation_confidence between 0 and 100),
  modality            text,                     -- audio | visual | multimodal
  model_version       text,
  app_version         text,
  created_at          timestamptz not null default now()
);

alter table public.scan_results enable row level security;

drop policy if exists "scan_results_insert_public" on public.scan_results;
create policy "scan_results_insert_public"
  on public.scan_results
  for insert
  to anon, authenticated
  with check (true);

-- No SELECT/UPDATE/DELETE policies for anon → rows are write-only from clients.

-- Real query patterns (aggregate calibration/reporting):
create index if not exists scan_results_species_created_idx
  on public.scan_results (species, created_at desc);
create index if not exists scan_results_model_version_idx
  on public.scan_results (model_version);

-- ═══ supabase/migrations\0003_payments.sql ═══════════════════════════════════
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

-- Seed one row per supported provider so the config surface always exists.
-- All start disabled/off — flipping to test/live is a deliberate service_role
-- action once real credentials + business approval exist (P16: no fake success).
insert into public.payment_providers (provider_code, enabled, environment)
values ('razorpay', false, 'off'),
       ('paypal', false, 'off'),
       ('google_pay', false, 'off')
on conflict (provider_code) do nothing;

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

-- ═══ supabase/migrations\0004_subscribers.sql ════════════════════════════════
-- SenseMyPet — subscribers (P: personalised experience consent)
-- Project ref: tcmcetpfdgpujayjbzrs
--
-- Stores ONLY what the sign-in disclaimer promises: name + email + the
-- user's Agree/Disagree consent for a personalised experience. Nothing else:
-- no scans, no pet data, no device identifiers, no analytics.
--
-- RLS: a signed-in user may insert/update/read ONLY their own row (matched by
-- their authenticated email). anon has no access at all.

create table if not exists public.subscribers (
  id                      uuid primary key default gen_random_uuid(),
  email                   text not null unique,
  name                    text not null,
  personalization_consent boolean not null default false,
  consent_at              timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

alter table public.subscribers enable row level security;

drop policy if exists "subscribers_select_own" on public.subscribers;
create policy "subscribers_select_own"
  on public.subscribers for select
  to authenticated
  using (email = (auth.jwt() ->> 'email'));

drop policy if exists "subscribers_insert_own" on public.subscribers;
create policy "subscribers_insert_own"
  on public.subscribers for insert
  to authenticated
  with check (email = (auth.jwt() ->> 'email'));

drop policy if exists "subscribers_update_own" on public.subscribers;
create policy "subscribers_update_own"
  on public.subscribers for update
  to authenticated
  using (email = (auth.jwt() ->> 'email'))
  with check (email = (auth.jwt() ->> 'email'));

-- No delete policy client-side; account/data removal is a service_role task
-- (handled on request, per the privacy promise).

create index if not exists subscribers_created_idx on public.subscribers (created_at desc);

-- ═══ storage: read policy for the audio_sense reference bucket ═══════════════
-- Allows the app (anon) to LIST and DOWNLOAD reference clips. No writes.
drop policy if exists "audio_sense_read" on storage.objects;
create policy "audio_sense_read"
  on storage.objects for select
  to anon, authenticated
  using ( bucket_id = 'audio_sense' );
