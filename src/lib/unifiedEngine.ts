/**
 * src/lib/unifiedEngine.ts
 *
 * Production UnifiedSensingEngine:
 *   - Integrates new PetAudioEngine (fingerprint-based)
 *   - Video worker for posture analysis
 *   - Confidence-gated emission (never emits without confirmed audio detection)
 *   - Supabase session logging
 *   - Returns "No emotional anomalies detected." when nothing confirmed
 */

import { PetAudioEngine, type EmotionResult, type PipelineStatus } from './audioPipeline';
import { supabase } from './supabase';
import type { AnimalType } from './petEmotionLibrary';

// ── Public result types ────────────────────────────────────────────────────────
export interface UnifiedResult {
  audio: {
    key: string;
    label: string;
    similarity: number;
    level: 'LOW' | 'MODERATE' | 'HIGH';
    message: string;
    anxietyScore: number;
    features: EmotionResult['features'];
  } | null;
  video: {
    posture: { label: string; confidence: number; details: string; level: 'LOW' | 'MODERATE' | 'HIGH' };
  } | null;
  combinedScore: number;       // 0–100 (0 = extreme distress, 100 = perfectly calm)
  finalLevel: 'LOW' | 'MODERATE' | 'HIGH';
  finalMessage: string;
  pipelineStatus: PipelineStatus;
  // Live visualizer data
  rms: number;
  zcr: number;
  spectralCentroid: number;
}

const NULL_RESULT: UnifiedResult = {
  audio: null,
  video: null,
  combinedScore: 100,
  finalLevel: 'LOW',
  finalMessage: 'No emotional anomalies detected.',
  pipelineStatus: 'idle',
  rms: 0,
  zcr: 0,
  spectralCentroid: 0,
};

export class UnifiedSensingEngine {
  private audioEngine: PetAudioEngine | null = null;
  private videoWorker: Worker | null = null;
  private animalType: AnimalType;

  private latestAudio: UnifiedResult['audio'] = null;
  private latestVideo: UnifiedResult['video'] = null;
  private pipelineStatus: PipelineStatus = 'idle';
  private liveRms = 0;
  private liveZcr = 0;
  private liveCentroid = 0;

  private onUpdate: (result: UnifiedResult) => void;

  // Video
  private videoElement: HTMLVideoElement | null = null;
  private videoStream: MediaStream | null = null;
  private videoInterval: number | null = null;
  private isProcessingVideo = false;

  // Supabase session
  private sessionId: string | null = null;

  // Voice speak-once guard
  private lastSpokenKey = '';

  constructor(animalType: AnimalType, onUpdate: (result: UnifiedResult) => void) {
    this.animalType = animalType;
    this.onUpdate = onUpdate;
  }

  async start(videoEl: HTMLVideoElement): Promise<void> {
    this.videoElement = videoEl;

    // 1. Start Supabase session
    try {
      const { data } = await supabase
        .from('pet_analysis_sessions')
        .insert({
          animal_type: this.animalType,
          analysis_type: 'unified',
        })
        .select('id')
        .single();
      this.sessionId = data?.id ?? null;
    } catch {
      // Non-fatal: offline or key not configured
    }

    // 2. Init Audio Engine
    this.audioEngine = new PetAudioEngine(this.animalType, {
      onStatus: (status) => {
        this.pipelineStatus = status;
        this.emit();
      },
      onFeatureUpdate: (rms, zcr, centroid) => {
        this.liveRms = rms;
        this.liveZcr = zcr;
        this.liveCentroid = centroid;
        this.emit();
      },
      onDetection: async (result) => {
        this.latestAudio = {
          key: result.key,
          label: result.label,
          similarity: result.similarity,
          level: result.level,
          message: result.emotionalMessage,
          anxietyScore: result.anxietyScore,
          features: result.features,
        };
        this.emit();
        // Persist to Supabase
        await this.persistDetection(result);
      },
      onNoDetection: () => {
        // Clear audio result — no hallucination
        this.latestAudio = null;
        this.emit();
      },
    });

    // 3. Init Video Worker
    this.videoWorker = new Worker(new URL('./videoWorker.ts', import.meta.url), { type: 'module' });
    this.videoWorker.onmessage = (e) => {
      if (e.data.type === 'RESULT') {
        this.isProcessingVideo = false;
        this.latestVideo = { posture: e.data.posture };
        this.emit();
      }
    };

    // 4. Start Audio (non-blocking — catches permission errors gracefully)
    await this.audioEngine.start().catch(console.error);

    // 5. Start Video
    try {
      this.videoStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 320 }, height: { ideal: 240 } },
      });
      this.videoElement.srcObject = this.videoStream;
      await this.videoElement.play();
      // Process at 8fps to save battery; UI renders at 60fps
      this.videoInterval = window.setInterval(() => this.processVideoFrame(), 125);
    } catch {
      // Camera unavailable — audio-only mode (already handled gracefully in UI)
    }
  }

  private processVideoFrame() {
    if (!this.videoElement || this.isProcessingVideo || !this.videoWorker) return;
    if (this.videoElement.readyState < 2) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = this.videoElement.videoWidth || 320;
      canvas.height = this.videoElement.videoHeight || 240;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
      createImageBitmap(canvas).then((bmp) => {
        this.isProcessingVideo = true;
        this.videoWorker?.postMessage(
          { imageBitmap: bmp, animalType: this.animalType },
          [bmp as any],
        );
      }).catch(() => {});
    } catch {
      // Ignore frame errors
    }
  }

  private emit() {
    // Compute combined score
    let combinedScore = 100;

    if (this.latestAudio) {
      if (this.latestAudio.level === 'HIGH') combinedScore -= 45;
      else if (this.latestAudio.level === 'MODERATE') combinedScore -= 22;
      else combinedScore -= 5;
    }

    if (this.latestVideo?.posture) {
      if (this.latestVideo.posture.level === 'HIGH') combinedScore -= 35;
      else if (this.latestVideo.posture.level === 'MODERATE') combinedScore -= 15;
    }

    combinedScore = Math.max(0, Math.min(100, combinedScore));

    let finalLevel: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW';
    let finalMessage = 'No emotional anomalies detected.';

    // Only output a message if audio engine has CONFIRMED a detection
    if (this.latestAudio) {
      if (combinedScore <= 35) {
        finalLevel = 'HIGH';
        finalMessage = this.latestAudio.message;
      } else if (combinedScore <= 68) {
        finalLevel = 'MODERATE';
        finalMessage = this.latestAudio.message;
      } else {
        finalLevel = 'LOW';
        finalMessage = this.latestAudio.message;
      }
    }

    this.onUpdate({
      audio: this.latestAudio,
      video: this.latestVideo,
      combinedScore,
      finalLevel,
      finalMessage,
      pipelineStatus: this.pipelineStatus,
      rms: this.liveRms,
      zcr: this.liveZcr,
      spectralCentroid: this.liveCentroid,
    });
  }

  private async persistDetection(result: EmotionResult) {
    try {
      // Save scan result
      await supabase.from('pet_scan_results').insert({
        session_id: this.sessionId,
        result_type: 'audio',
        emotion_label: result.label,
        confidence: result.similarity,
        anxiety_score: result.anxietyScore,
        message: result.emotionalMessage,
        raw_features: result.features,
      });

      // Save anxiety score to timeline
      await supabase.from('pet_anxiety_scores').insert({
        session_id: this.sessionId,
        animal_type: this.animalType,
        anxiety_score: result.anxietyScore,
        mood_label: result.label,
      });

      // Save embedding
      await supabase.from('pet_audio_embeddings').insert({
        session_id: this.sessionId,
        animal_type: this.animalType,
        rms: result.features.rms,
        zcr: result.features.zcr,
        spectral_centroid: result.features.spectralCentroid,
        emotion_label: result.label,
        // embedding stored as array (pgvector or jsonb)
        embedding: result.embedding,
      });
    } catch {
      // Silent fail: offline mode
    }
  }

  stop() {
    if (this.audioEngine) {
      this.audioEngine.stop();
      this.audioEngine = null;
    }
    if (this.videoInterval !== null) {
      clearInterval(this.videoInterval);
      this.videoInterval = null;
    }
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(t => t.stop());
      this.videoStream = null;
    }
    if (this.videoWorker) {
      this.videoWorker.terminate();
      this.videoWorker = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    this.latestAudio = null;
    this.latestVideo = null;
    this.pipelineStatus = 'idle';
    this.liveRms = 0;
    this.liveZcr = 0;
    this.liveCentroid = 0;
  }
}
