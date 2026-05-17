import { createClient } from '@supabase/supabase-js';

// These should ideally be in .env, but falling back to the requested instance
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tcmcetpfdgpujayjbzrs.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'dummy-anon-key-replace-me';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function saveSessionHistory(animalType: string, emotion: string, confidence: number, analysisType: string) {
  try {
    // Attempt to save to our new isolated backend tables
    const { error } = await supabase
      .from('pet_analysis_history')
      .insert([
        {
          animal_type: animalType,
          detected_emotion: emotion,
          confidence_score: confidence,
          analysis_type: analysisType
        }
      ]);
      
    if (error) {
      console.warn("Supabase save error (likely missing valid anon key):", error.message);
    }
  } catch (err) {
    console.warn("Supabase integration error:", err);
  }
}
