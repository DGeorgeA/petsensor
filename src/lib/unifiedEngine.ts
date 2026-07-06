/**
 * src/lib/unifiedEngine.ts
 *
 * UnifiedSensingEngine — privacy-first, screening-oriented.
 *
 *   - Audio fingerprint pipeline (PetAudioEngine) → audio evidence channel
 *   - Camera worker → visual evidence channel (honest: 'unvalidated' until a
 *     real on-device pet detector exists — contributes no fabricated evidence)
 *   - Evidence-aware fusion (screening.ts) → one cautious ScreeningResult
 *   - Local-only: NO raw media and NO derived features/embeddings ever leave the
 *     device. Scan summaries are stored on-device (IndexedDB) via localHistory.
 */

import { PetAudioEngine, type EmotionResult, type PipelineStatus, type NoDetectionKind } from './audioPipeline';
import { addLocalScan } from './localHistory';
import type { AnimalType } from './petEmotionLibrary';
import {
  fuseEvidence,
  similarityToConfidence,
  type ChannelEvidence,
  type ScreeningResult,
} from './screening';

// ── Public result type ──────────────────────────────────────────────────────────
export interface UnifiedResult {
  screening: ScreeningResult;
  /** Matched signature label for the detail panel (null if no confirmed match). */
  audioLabel: string | null;
  pipelineStatus: PipelineStatus;
  // Live visualizer data
  rms: number;
  zcr: number;
  spectralCentroid: number;
}

const VISUAL_UNAVAILABLE: ChannelEvidence = {
  state: 'insufficient',
  category: null,
  confidence: 0,
  summary: 'Visual body-language screening is not yet available',
};

function insufficientAudio(kind: NoDetectionKind): ChannelEvidence {
  return {
    state: kind, // 'insufficient' | 'unsupported'
    category: null,
    confidence: 0,
    summary: kind === 'unsupported'
      ? 'No supported dog/cat vocalisation detected'
      : 'No clear, steady vocal signal yet',
  };
}

export class UnifiedSensingEngine {
  private audioEngine: PetAudioEngine | null = null;
  private videoWorker: Worker | null = null;
  private animalType: AnimalType;

  // Audio evidence: a confirmed match is "sticky" for the scan so the end-of-scan
  // summary reflects the strongest confirmed observation, not the last idle frame.
  private confirmedAudio: ChannelEvidence | null = null;
  private confirmedAudioLabel: string | null = null;
  private lastNoDetection: NoDetectionKind = 'insufficient';

  private visual: ChannelEvidence = VISUAL_UNAVAILABLE;
  private pipelineStatus: PipelineStatus = 'idle';
  private liveRms = 0;
  private liveZcr = 0;
  private liveCentroid = 0;
  private lastScreening: ScreeningResult | null = null;

  private onUpdate: (result: UnifiedResult) => void;

  // Video
  private videoElement: HTMLVideoElement | null = null;
  private videoStream: MediaStream | null = null;
  private videoInterval: number | null = null;
  private isProcessingVideo = false;

  constructor(animalType: AnimalType, onUpdate: (result: UnifiedResult) => void) {
    this.animalType = animalType;
    this.onUpdate = onUpdate;
  }

  async start(videoEl: HTMLVideoElement): Promise<void> {
    this.videoElement = videoEl;
    this.confirmedAudio = null;
    this.confirmedAudioLabel = null;
    this.lastNoDetection = 'insufficient';

    // 1. Init Audio Engine
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
      onDetection: (result: EmotionResult) => {
        this.confirmedAudio = {
          state: 'match',
          category: result.category,
          confidence: similarityToConfidence(result.similarity),
          summary: result.emotionalMessage,
        };
        this.confirmedAudioLabel = result.label;
        this.emit();
        // NOTE: no persistence here — raw features/embeddings never leave device.
      },
      onNoDetection: (kind) => {
        this.lastNoDetection = kind;
        this.emit();
      },
    });

    // 2. Init Video Worker (honest — no fabricated posture)
    this.videoWorker = new Worker(new URL('./videoWorker.ts', import.meta.url), { type: 'module' });
    this.videoWorker.onmessage = (e) => {
      if (e.data?.type === 'RESULT') {
        this.isProcessingVideo = false;
        // subject === 'unvalidated' → no visual evidence contributed.
        this.visual = VISUAL_UNAVAILABLE;
        this.emit();
      }
    };

    // 3. Start Audio (non-blocking — catches permission errors gracefully)
    await this.audioEngine.start().catch(console.error);

    // 4. Start Video (frames processed locally, released immediately)
    try {
      this.videoStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 320 }, height: { ideal: 240 } },
      });
      this.videoElement.srcObject = this.videoStream;
      await this.videoElement.play();
      this.videoInterval = window.setInterval(() => this.processVideoFrame(), 125);
    } catch {
      // Camera unavailable — audio-only mode (handled gracefully in UI)
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
          [bmp as unknown as Transferable],
        );
      }).catch(() => {});
    } catch {
      // Ignore frame errors
    }
  }

  private currentAudioChannel(): ChannelEvidence {
    return this.confirmedAudio ?? insufficientAudio(this.lastNoDetection);
  }

  private emit() {
    const audio = this.currentAudioChannel();
    const screening = fuseEvidence({ audio, visual: this.visual });
    this.lastScreening = screening;

    this.onUpdate({
      screening,
      audioLabel: this.confirmedAudioLabel,
      pipelineStatus: this.pipelineStatus,
      rms: this.liveRms,
      zcr: this.liveZcr,
      spectralCentroid: this.liveCentroid,
    });
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

    // Persist a single on-device summary for My Scans (non-media, non-reconstructable).
    this.saveHistory();

    this.confirmedAudio = null;
    this.confirmedAudioLabel = null;
    this.visual = VISUAL_UNAVAILABLE;
    this.pipelineStatus = 'idle';
    this.liveRms = 0;
    this.liveZcr = 0;
    this.liveCentroid = 0;
  }

  private saveHistory() {
    const s = this.lastScreening;
    if (!s) return;
    // Only record meaningful observations, not idle "insufficient" frames.
    if (s.screeningClass === 'INSUFFICIENT_EVIDENCE' || s.screeningClass === 'UNSUPPORTED_SUBJECT') return;
    void addLocalScan({
      animal_type: this.animalType,
      screening_class: s.screeningClass,
      confidence: s.confidence,
      headline: s.headline,
      label: this.confirmedAudioLabel ?? s.headline,
    }).catch(() => {});
  }
}
