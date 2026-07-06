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
