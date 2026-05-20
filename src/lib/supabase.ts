/**
 * src/lib/supabase.ts
 *
 * Supabase client + typed query helpers for Sense My Pet.
 * All methods are silent-fail — the app works fully offline.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tcmcetpfdgpujayjbzrs.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Connectivity check ─────────────────────────────────────────────────────────
export async function isSupabaseConnected(): Promise<boolean> {
  try {
    const { error } = await supabase.from('pet_analysis_sessions').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

// ── pgvector similarity search ────────────────────────────────────────────────
export async function findSimilarEmbedding(
  embedding: number[],
  animalType: string,
  limit = 3,
): Promise<Array<{ emotion_label: string; confidence: number; session_id: string }>> {
  try {
    // Uses pgvector cosine distance operator <=>
    const { data, error } = await supabase.rpc('match_pet_audio_embeddings', {
      query_embedding: embedding,
      animal_type_filter: animalType,
      match_count: limit,
    });
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

// ── Session helpers ───────────────────────────────────────────────────────────
export async function openSession(animalType: string, analysisType: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('pet_analysis_sessions')
      .insert({ animal_type: animalType, analysis_type: analysisType })
      .select('id')
      .single();
    if (error) return null;
    return data?.id ?? null;
  } catch {
    return null;
  }
}

export async function saveAnxietyScore(
  sessionId: string | null,
  animalType: string,
  anxietyScore: number,
  moodLabel: string,
): Promise<void> {
  if (!sessionId) return;
  try {
    await supabase.from('pet_anxiety_scores').insert({
      session_id: sessionId,
      animal_type: animalType,
      anxiety_score: anxietyScore,
      mood_label: moodLabel,
    });
  } catch {}
}

// ── Scan history (for My Scans / AnxietyTracker) ──────────────────────────────
export interface ScanRecord {
  id: string;
  created_at: string;
  result_type: string;
  emotion_label: string;
  confidence: number;
  anxiety_score: number;
  message: string;
  session?: {
    animal_type: string;
    analysis_type: string;
  };
}

export async function fetchRecentScans(limit = 20): Promise<ScanRecord[]> {
  try {
    const { data, error } = await supabase
      .from('pet_scan_results')
      .select(`
        id, created_at, result_type, emotion_label, confidence, anxiety_score, message,
        pet_analysis_sessions ( animal_type, analysis_type )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data ?? []).map((row: any) => ({
      id: row.id,
      created_at: row.created_at,
      result_type: row.result_type,
      emotion_label: row.emotion_label,
      confidence: row.confidence,
      anxiety_score: row.anxiety_score,
      message: row.message,
      session: row.pet_analysis_sessions,
    }));
  } catch {
    return [];
  }
}

// ── Reference pattern seeder (run once) ──────────────────────────────────────
export async function seedReferencePatterns(
  patterns: Array<{
    key: string;
    animal_type: string;
    emotion_label: string;
    confidence_base: number;
    mfcc_signature: number[];
    spectral_signature: number[];
    spectral_centroid: number;
    embedding: number[];
    embedding_hash: string;
    fingerprint: string;
    fingerprint_hash: string;
  }>,
): Promise<void> {
  try {
    for (const p of patterns) {
      await supabase
        .from('pet_audio_patterns')
        .upsert(
          {
            pattern_key: p.key,
            animal_type: p.animal_type,
            emotion_label: p.emotion_label,
            confidence_base: p.confidence_base,
            mfcc_signature: p.mfcc_signature,
            spectral_signature: p.spectral_signature,
            spectral_centroid: p.spectral_centroid,
            embedding_hash: p.embedding_hash,
            fingerprint: p.fingerprint,
            fingerprint_hash: p.fingerprint_hash,
          },
          { onConflict: 'pattern_key' },
        );
    }
  } catch {}
}

// Legacy compat
export async function saveSessionHistory(
  animalType: string,
  emotion: string,
  confidence: number,
  analysisType: string,
) {
  try {
    await supabase.from('pet_scan_results').insert({
      result_type: analysisType,
      emotion_label: emotion,
      confidence,
      anxiety_score: 0,
      message: emotion,
    });
  } catch {}
}
