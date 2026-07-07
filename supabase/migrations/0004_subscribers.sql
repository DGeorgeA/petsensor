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
