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
