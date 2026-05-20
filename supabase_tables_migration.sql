-- ============================================================
-- Sense My Pet — Full Supabase Table Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- ── MANDATORY EXTENSIONS ────────────────────────────────────
-- Enable pgvector for 512-dim audio/video embeddings
CREATE EXTENSION IF NOT EXISTS vector;
-- Enable pgcrypto for UUID generation and hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── 1. pet_audio_patterns ───────────────────────────────────
CREATE TABLE IF NOT EXISTS pet_audio_patterns (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_key     text UNIQUE NOT NULL,          -- e.g. 'dog_anxious_bark'
  animal_type     text NOT NULL CHECK (animal_type IN ('dog', 'cat', 'horse')),
  emotion_label   text NOT NULL,
  confidence_base float DEFAULT 0.95,
  mfcc_signature  float[],                        -- 13 MFCC coefficients
  spectral_signature float[],                     -- constellation peaks hash array
  spectral_centroid float,                        -- normalized 0–1
  embedding_hash  text,                           -- embedding string hash
  fingerprint_hash  text,                         -- base64 fingerprint (legacy)
  fingerprint     text,                           -- base64 fingerprint
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pet_audio_patterns_animal ON pet_audio_patterns(animal_type);

-- ── 2. pet_audio_embeddings ─────────────────────────────────
CREATE TABLE IF NOT EXISTS pet_audio_embeddings (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id    uuid,
  animal_type   text NOT NULL,
  embedding     vector(512),          -- requires pgvector extension
  rms           float,
  zcr           float,
  spectral_centroid float,
  emotion_label text,
  created_at    timestamptz DEFAULT now()
);

-- ── 3. pet_video_patterns ───────────────────────────────────
CREATE TABLE IF NOT EXISTS pet_video_patterns (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  animal_type   text NOT NULL,
  posture_label text NOT NULL,
  posture_level text CHECK (posture_level IN ('LOW', 'MEDIUM', 'HIGH')),
  keypoints     jsonb,
  description   text,
  created_at    timestamptz DEFAULT now()
);

-- ── 4. pet_video_embeddings ─────────────────────────────────
CREATE TABLE IF NOT EXISTS pet_video_embeddings (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id    uuid,
  animal_type   text NOT NULL,
  frame_index   int,
  embedding     vector(256),
  posture_label text,
  confidence    float,
  created_at    timestamptz DEFAULT now()
);

-- ── 5. pet_analysis_sessions ────────────────────────────────
CREATE TABLE IF NOT EXISTS pet_analysis_sessions (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  animal_type     text NOT NULL,
  analysis_type   text CHECK (analysis_type IN ('audio', 'video', 'unified')),
  duration_ms     int,
  final_emotion   text,
  final_level     text CHECK (final_level IN ('LOW', 'MEDIUM', 'HIGH')),
  combined_score  float,
  final_message   text,
  user_agent      text,
  created_at      timestamptz DEFAULT now()
);

-- ── 6. pet_scan_results ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS pet_scan_results (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id      uuid REFERENCES pet_analysis_sessions(id) ON DELETE CASCADE,
  result_type     text CHECK (result_type IN ('audio', 'video')),
  emotion_label   text,
  confidence      float,
  anxiety_score   float,
  message         text,
  raw_features    jsonb,
  created_at      timestamptz DEFAULT now()
);

-- ── 7. pet_anxiety_scores ───────────────────────────────────
CREATE TABLE IF NOT EXISTS pet_anxiety_scores (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id      uuid REFERENCES pet_analysis_sessions(id) ON DELETE CASCADE,
  animal_type     text NOT NULL,
  pet_name        text,
  anxiety_score   float NOT NULL CHECK (anxiety_score >= 0 AND anxiety_score <= 100),
  mood_label      text,
  notes           text,
  recorded_at     timestamptz DEFAULT now()
);

-- ── 8. pet_consultation_requests ────────────────────────────
CREATE TABLE IF NOT EXISTS pet_consultation_requests (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  vet_id          text,                    -- references vet_marketplace.id
  vet_name        text,
  pet_name        text,
  scan_ids        text[],                  -- array of scan result IDs shared
  share_analysis  boolean DEFAULT true,
  status          text DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  placeholder_msg text DEFAULT 'Verified veterinary onboarding is coming soon. Please contact your veterinarian directly for urgent concerns.',
  notes           text,
  created_at      timestamptz DEFAULT now()
);

-- ── 9. pet_ui_preferences ───────────────────────────────────
CREATE TABLE IF NOT EXISTS pet_ui_preferences (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  preference_key   text UNIQUE NOT NULL,
  preference_value text NOT NULL,
  updated_at       timestamptz DEFAULT now()
);

-- Seed default preferences
INSERT INTO pet_ui_preferences (preference_key, preference_value)
VALUES
  ('smp_validation_visible', 'true'),
  ('smp_theme', 'warm')
ON CONFLICT (preference_key) DO NOTHING;

-- ── 10. pet_validation_suite_settings ──────────────────────
CREATE TABLE IF NOT EXISTS pet_validation_suite_settings (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  is_visible            boolean DEFAULT true,
  calibration_score     float,
  last_calibrated_at    timestamptz,
  test_results          jsonb,
  updated_at            timestamptz DEFAULT now()
);

-- Seed a default row
INSERT INTO pet_validation_suite_settings (is_visible)
VALUES (true)
ON CONFLICT DO NOTHING;

-- ── 11. vet_marketplace ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS vet_marketplace (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name                text NOT NULL,
  specialty           text,
  distance_km         float,
  rating              float CHECK (rating >= 0 AND rating <= 5),
  review_count        int DEFAULT 0,
  availability_label  text,
  is_available        boolean DEFAULT false,
  avatar_emoji        text,
  tags                text[],
  location_lat        float,
  location_lng        float,
  onboarded           boolean DEFAULT false,  -- true when real vet joins
  placeholder_only    boolean DEFAULT true,
  created_at          timestamptz DEFAULT now()
);

-- Seed placeholder vets
INSERT INTO vet_marketplace (name, specialty, distance_km, rating, review_count, availability_label, is_available, avatar_emoji, tags, placeholder_only)
VALUES
  ('Dr. Priya Nair',  'Small Animal & Behavioral Specialist', 0.8, 4.9, 312, 'Next: Today 3:30 PM',    true,  '👩‍⚕️', ARRAY['Dog','Cat','Anxiety'],       true),
  ('Dr. Arjun Mehta', 'Equine & Large Animal Expert',         1.4, 4.8, 198, 'Next: Tomorrow 10:00 AM', false, '👨‍⚕️', ARRAY['Horse','Large Animals'],    true),
  ('Dr. Kavya Sharma','Feline Wellness & Nutrition',          2.1, 5.0, 441, 'Next: Today 5:00 PM',    true,  '👩‍⚕️', ARRAY['Cat','Nutrition','Kitten'], true),
  ('Dr. Rohan Iyer',  'Emergency & Trauma Care',              3.0, 4.7, 259, 'Next: Tomorrow 9:00 AM',  false, '👨‍⚕️', ARRAY['Dog','Emergency','Surgery'],true)
ON CONFLICT DO NOTHING;

-- ── 12. vet_scan_shares ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS vet_scan_shares (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id     uuid REFERENCES pet_consultation_requests(id) ON DELETE CASCADE,
  scan_result_id      uuid REFERENCES pet_scan_results(id) ON DELETE SET NULL,
  animal_type         text,
  anxiety_score       float,
  mood_label          text,
  emotional_summary   text,
  shared_at           timestamptz DEFAULT now()
);

-- ── INDEXES for performance ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pet_analysis_sessions_animal  ON pet_analysis_sessions(animal_type);
CREATE INDEX IF NOT EXISTS idx_pet_analysis_sessions_created ON pet_analysis_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pet_anxiety_scores_animal     ON pet_anxiety_scores(animal_type);
CREATE INDEX IF NOT EXISTS idx_pet_anxiety_scores_recorded   ON pet_anxiety_scores(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_pet_scan_results_session      ON pet_scan_results(session_id);
CREATE INDEX IF NOT EXISTS idx_pet_scan_results_created      ON pet_scan_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vet_marketplace_available     ON vet_marketplace(is_available);
CREATE INDEX IF NOT EXISTS idx_pet_consultation_status       ON pet_consultation_requests(status);
CREATE INDEX IF NOT EXISTS idx_pet_ui_prefs_key              ON pet_ui_preferences(preference_key);

-- pgvector HNSW index for fast ANN search on 512-dim embeddings
CREATE INDEX IF NOT EXISTS idx_pet_audio_embeddings_vector
  ON pet_audio_embeddings USING hnsw (embedding vector_cosine_ops);

-- ── pgvector RPC: cosine similarity search ───────────────────
CREATE OR REPLACE FUNCTION match_pet_audio_embeddings(
  query_embedding  vector(512),
  animal_type_filter text,
  match_count      int DEFAULT 3
)
RETURNS TABLE (
  emotion_label text,
  confidence    float,
  session_id    uuid
)
LANGUAGE sql STABLE
AS $$
  SELECT
    e.emotion_label,
    1 - (e.embedding <=> query_embedding) AS confidence,
    e.session_id
  FROM pet_audio_embeddings e
  WHERE e.animal_type = animal_type_filter
    AND e.embedding IS NOT NULL
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
$$;


-- ── NOTE: pgvector ───────────────────────────────────────────
-- The embedding columns require pgvector extension.
-- Enable it with: CREATE EXTENSION IF NOT EXISTS vector;
-- If not available on your plan, remove the 'vector(...)' columns
-- or change them to: embedding jsonb
-- ─────────────────────────────────────────────────────────────

COMMENT ON TABLE pet_analysis_sessions        IS 'Each full sensing session (audio, video, or unified)';
COMMENT ON TABLE pet_scan_results             IS 'Individual audio/video result within a session';
COMMENT ON TABLE pet_anxiety_scores           IS 'Historical anxiety timeline per pet';
COMMENT ON TABLE pet_consultation_requests    IS 'Vet+ booking requests (placeholder phase)';
COMMENT ON TABLE pet_ui_preferences           IS 'User UI settings synced from localStorage';
COMMENT ON TABLE pet_validation_suite_settings IS 'Validation Suite toggle & calibration metadata';
COMMENT ON TABLE vet_marketplace              IS 'Placeholder and onboarded vet listings';
COMMENT ON TABLE vet_scan_shares              IS 'Scans shared with a vet during consultation prep';
