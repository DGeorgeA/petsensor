-- pet_audio_patterns
CREATE TABLE IF NOT EXISTS public.pet_audio_patterns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    animal_type TEXT NOT NULL,
    emotion_label TEXT NOT NULL,
    audio_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- pet_audio_embeddings
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS public.pet_audio_embeddings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pattern_id UUID REFERENCES public.pet_audio_patterns(id) ON DELETE CASCADE,
    embedding vector(512),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector Similarity Optimization (HNSW index for <10ms similarity queries)
CREATE INDEX IF NOT EXISTS idx_pet_audio_embeddings_embedding_hnsw 
ON public.pet_audio_embeddings USING hnsw (embedding vector_cosine_ops);

-- pet_sessions
CREATE TABLE IF NOT EXISTS public.pet_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    session_notes TEXT,
    overall_mood TEXT
);

-- pet_behavior_analysis
CREATE TABLE IF NOT EXISTS public.pet_behavior_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.pet_sessions(id),
    behavior_type TEXT NOT NULL,
    confidence FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- pet_anxiety_scores
CREATE TABLE IF NOT EXISTS public.pet_anxiety_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.pet_sessions(id),
    anxiety_level TEXT, -- LOW, MEDIUM, HIGH
    score_value FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- pet_voice_preferences
CREATE TABLE IF NOT EXISTS public.pet_voice_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    language TEXT DEFAULT 'en',
    voice_type TEXT DEFAULT 'warm_female',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- pet_video_posture_analysis
CREATE TABLE IF NOT EXISTS public.pet_video_posture_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.pet_sessions(id),
    posture_label TEXT,
    confidence FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- pet_ui_preferences
CREATE TABLE IF NOT EXISTS public.pet_ui_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    theme_preference TEXT DEFAULT 'zen_warm',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance caching and retrieval
CREATE INDEX IF NOT EXISTS idx_pet_audio_embeddings_pattern ON public.pet_audio_embeddings(pattern_id);
CREATE INDEX IF NOT EXISTS idx_pet_sessions_user ON public.pet_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pet_anxiety_scores_created ON public.pet_anxiety_scores(created_at);
CREATE INDEX IF NOT EXISTS idx_pet_behavior_analysis_session ON public.pet_behavior_analysis(session_id);

-- Subscription tables
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_name TEXT NOT NULL,
    features JSONB,
    price_monthly DECIMAL(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    plan_id UUID REFERENCES public.subscription_plans(id),
    status TEXT NOT NULL,
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pet_whisperer_premium (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.subscriptions(id),
    advanced_analytics JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- New tables requested for the complete audio sensing hierarchy
CREATE TABLE IF NOT EXISTS public.pet_anxiety_labels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    label TEXT NOT NULL,
    level TEXT NOT NULL, -- LOW, MODERATE, HIGH
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pet_audio_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    animal_type TEXT NOT NULL,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    duration_seconds INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pet_analysis_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.pet_audio_sessions(id) ON DELETE CASCADE,
    animal_type TEXT NOT NULL,
    detected_emotion TEXT NOT NULL,
    anxiety_level TEXT NOT NULL, -- LOW, MODERATE, HIGH
    confidence_score FLOAT NOT NULL,
    rms_mean FLOAT,
    zcr_mean FLOAT,
    embedding vector(512),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert anxiety labels
INSERT INTO public.pet_anxiety_labels (label, level, description) VALUES
('Calm & Content', 'LOW', 'Your pet is relaxed, breathing normally, and exhibiting comfortable body language.'),
('Mild Stress / Excitation', 'MODERATE', 'Your pet is slightly excited or showing early signs of tension. Speak in a gentle, reassuring tone.'),
('High Anxiety / Distress', 'HIGH', 'High separation anxiety or stress detected. Offer comforting tactile strokes and a calm environment.')
ON CONFLICT DO NOTHING;

-- SQL Procedure to match embeddings
CREATE OR REPLACE FUNCTION public.match_pet_audio(
  query_embedding vector(512),
  match_threshold float,
  match_count int,
  filter_animal_type text
)
RETURNS TABLE (
  id uuid,
  pattern_id uuid,
  animal_type text,
  emotion_label text,
  similarity float
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    pae.id,
    pae.pattern_id,
    pap.animal_type,
    pap.emotion_label,
    1 - (pae.embedding <=> query_embedding) AS similarity
  FROM public.pet_audio_embeddings pae
  JOIN public.pet_audio_patterns pap ON pae.pattern_id = pap.id
  WHERE pap.animal_type = filter_animal_type
    AND 1 - (pae.embedding <=> query_embedding) > match_threshold
  ORDER BY pae.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Helper transaction to insert patterns and embeddings for the audio pipeline
DO $$
DECLARE
  dog_stress_id UUID;
  dog_whine_id UUID;
  dog_calm_id UUID;
  dog_growl_id UUID;
  horse_distress_id UUID;
  cat_relaxed_id UUID;
BEGIN
  -- Insert anxious barking
  INSERT INTO public.pet_audio_patterns (animal_type, emotion_label, audio_url)
  VALUES ('dog', 'Anxious Barking / Separation Stress', 'assets/sounds/dog_anxious_bark.mp3')
  RETURNING id INTO dog_stress_id;
  
  INSERT INTO public.pet_audio_embeddings (pattern_id, embedding)
  VALUES (dog_stress_id, (SELECT array_agg(sin(i * 0.1) * 0.5 + 0.1) FROM generate_series(0, 511) i)::vector(512));

  -- Insert whining
  INSERT INTO public.pet_audio_patterns (animal_type, emotion_label, audio_url)
  VALUES ('dog', 'Whining / Seeking Attention', 'assets/sounds/dog_whine.mp3')
  RETURNING id INTO dog_whine_id;

  INSERT INTO public.pet_audio_embeddings (pattern_id, embedding)
  VALUES (dog_whine_id, (SELECT array_agg(sin(i * 0.15) * 0.4 + 0.2) FROM generate_series(0, 511) i)::vector(512));

  -- Insert calm barking
  INSERT INTO public.pet_audio_patterns (animal_type, emotion_label, audio_url)
  VALUES ('dog', 'Calm Barking / Alert Play', 'assets/sounds/dog_calm_bark.mp3')
  RETURNING id INTO dog_calm_id;

  INSERT INTO public.pet_audio_embeddings (pattern_id, embedding)
  VALUES (dog_calm_id, (SELECT array_agg(cos(i * 0.12) * 0.3 + 0.1) FROM generate_series(0, 511) i)::vector(512));

  -- Insert stress growling
  INSERT INTO public.pet_audio_patterns (animal_type, emotion_label, audio_url)
  VALUES ('dog', 'Stress Growling / Protective Fear', 'assets/sounds/dog_stress_growl.mp3')
  RETURNING id INTO dog_growl_id;

  INSERT INTO public.pet_audio_embeddings (pattern_id, embedding)
  VALUES (dog_growl_id, (SELECT array_agg(cos(i * 0.08) * 0.5 - 0.1) FROM generate_series(0, 511) i)::vector(512));

  -- Insert horse distress
  INSERT INTO public.pet_audio_patterns (animal_type, emotion_label, audio_url)
  VALUES ('horse', 'Distress / Stable Stress Whinny', 'assets/sounds/horse_distress.mp3')
  RETURNING id INTO horse_distress_id;

  INSERT INTO public.pet_audio_embeddings (pattern_id, embedding)
  VALUES (horse_distress_id, (SELECT array_agg(sin(i * 0.08) * 0.6 + 0.15) FROM generate_series(0, 511) i)::vector(512));

  -- Insert relaxed cat sounds
  INSERT INTO public.pet_audio_patterns (animal_type, emotion_label, audio_url)
  VALUES ('cat', 'Relaxed Purr / Comfort Vibrations', 'assets/sounds/cat_relaxed_purr.mp3')
  RETURNING id INTO cat_relaxed_id;

  INSERT INTO public.pet_audio_embeddings (pattern_id, embedding)
  VALUES (cat_relaxed_id, (SELECT array_agg(sin(i * 0.03) * 0.2) FROM generate_series(0, 511) i)::vector(512));
END $$;

-- Video Pipeline Tables
CREATE TABLE IF NOT EXISTS public.pet_visual_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    animal_type TEXT NOT NULL,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    duration_seconds INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pet_video_patterns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    animal_type TEXT NOT NULL,
    posture_label TEXT NOT NULL, -- Tail position, Ear position, Eye stress, Restlessness, Crouching, Fear posture, Relaxed posture
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pet_video_embeddings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pattern_id UUID REFERENCES public.pet_video_patterns(id) ON DELETE CASCADE,
    embedding vector(512),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pet_posture_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.pet_visual_sessions(id) ON DELETE CASCADE,
    detected_posture TEXT NOT NULL,
    confidence_score FLOAT NOT NULL,
    embedding vector(512),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pet_behavior_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.pet_visual_sessions(id) ON DELETE CASCADE,
    overall_anxiety_level TEXT NOT NULL, -- LOW, MODERATE, HIGH
    summary_message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unified Multi-Modal Architecture Tables
CREATE TABLE IF NOT EXISTS public.pet_multimodal_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    animal_type TEXT NOT NULL,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    duration_seconds INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pet_combined_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.pet_multimodal_sessions(id) ON DELETE CASCADE,
    audio_emotion TEXT NOT NULL,
    video_posture TEXT NOT NULL,
    combined_embedding vector(512),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pet_emotional_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.pet_multimodal_sessions(id) ON DELETE CASCADE,
    final_wellness_score FLOAT NOT NULL, -- e.g., 0-100 where 100 is perfectly calm
    audio_anxiety_level TEXT NOT NULL,
    video_anxiety_level TEXT NOT NULL,
    overall_anxiety_level TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pet_ai_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.pet_multimodal_sessions(id) ON DELETE CASCADE,
    insight_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pet_recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.pet_multimodal_sessions(id) ON DELETE CASCADE,
    recommendation_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
