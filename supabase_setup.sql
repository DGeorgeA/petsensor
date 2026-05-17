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

-- pet_emotion_sessions
CREATE TABLE IF NOT EXISTS public.pet_emotion_sessions (
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
    session_id UUID REFERENCES public.pet_emotion_sessions(id),
    behavior_type TEXT NOT NULL,
    confidence FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- pet_anxiety_scores
CREATE TABLE IF NOT EXISTS public.pet_anxiety_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.pet_emotion_sessions(id),
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
    session_id UUID REFERENCES public.pet_emotion_sessions(id),
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
CREATE INDEX IF NOT EXISTS idx_pet_emotion_sessions_user ON public.pet_emotion_sessions(user_id);
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
