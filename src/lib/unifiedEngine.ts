/**
 * src/lib/unifiedEngine.ts
 *
 * UnifiedSensingEngine — privacy-first, multimodal behavioural screening.
 *
 *   - Audio fingerprint pipeline (PetAudioEngine) → audio evidence channel
 *   - Camera worker (TF.js COCO-SSD) → real temporal visual evidence channel
 *   - Evidence-aware fusion (screening.ts) → one cautious ScreeningResult with
 *     SEPARATE severity + observation confidence, plus emergency override
 *   - Local-only: NO raw media and NO derived features/embeddings ever leave the
 *     device. Scan summaries are stored on-device (IndexedDB) via localHistory.
 *
 * The camera frames are read from the <video> element the UI already opened (no
 * second getUserMedia), summarised in the worker, and released immediately.
 */

import { PetAudioEngine, type EmotionResult, type PipelineStatus, type NoDetectionKind } from './audioPipeline';
import { addLocalScan } from './localHistory';
import { syncScanResult } from './scanSync';
import type { AnimalType } from './petEmotionLibrary';
import { contextModifier, type ScanContext } from './context';
import { VisualObservationAggregator, toVisualEvidence } from './vision/visualCues';
import type { VisualFrameObs, VisualObservation } from './vision/types';
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
  /** Latest visual observation snapshot (for the detail panel). */
  visual: VisualObservation | null;
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
  summary: 'Point the camera at your pet in good light for a body-language reading',
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

const FRAME_INTERVAL_MS = 333; // ~3 fps — enough for temporal cues, light on battery/CPU

export class UnifiedSensingEngine {
  private audioEngine: PetAudioEngine | null = null;
  private videoWorker: Worker | null = null;
  private animalType: AnimalType;

  // Audio evidence: a confirmed match is "sticky" for the scan so the summary
  // reflects the strongest confirmed observation, not the last idle frame.
  private confirmedAudio: ChannelEvidence | null = null;
  private confirmedAudioLabel: string | null = null;
  private lastNoDetection: NoDetectionKind = 'insufficient';

  // Visual evidence: accumulated across the whole scan window.
  private visualAgg = new VisualObservationAggregator();
  private lastVisual: VisualObservation | null = null;

  private context: ScanContext | null = null;
  private pipelineStatus: PipelineStatus = 'idle';
  private liveRms = 0;
  private liveZcr = 0;
  private liveCentroid = 0;
  private lastScreening: ScreeningResult | null = null;

  private onUpdate: (result: UnifiedResult) => void;

  // Video
  private videoElement: HTMLVideoElement | null = null;
  private videoInterval: number | null = null;
  private isProcessingVideo = false;

  constructor(animalType: AnimalType, onUpdate: (result: UnifiedResult) => void) {
    this.animalType = animalType;
    this.onUpdate = onUpdate;
  }

  setContext(ctx: ScanContext | null): void {
    this.context = ctx;
  }

  async start(videoEl: HTMLVideoElement): Promise<void> {
    this.videoElement = videoEl;
    this.confirmedAudio = null;
    this.confirmedAudioLabel = null;
    this.lastNoDetection = 'insufficient';
    this.visualAgg = new VisualObservationAggregator();
    this.lastVisual = null;

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
          severity: result.anxietyScore,
          quality: similarityToConfidence(result.similarity),
          indicators: [result.label],
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

    // 2. Init Video Worker (real COCO-SSD detection)
    this.videoWorker = new Worker(new URL('./videoWorker.ts', import.meta.url), { type: 'module' });
    this.videoWorker.onmessage = (e) => {
      const data = e.data;
      if (data?.type === 'RESULT') {
        this.isProcessingVideo = false;
        const obs = data.obs as VisualFrameObs;
        this.visualAgg.ingest(obs);
        this.lastVisual = this.visualAgg.snapshot(contextModifier(this.context));
        this.emit();
      }
      // 'STATUS' messages are informational; modelAvailable propagates via obs.
    };

    // 3. Start Audio (non-blocking — catches permission errors gracefully)
    await this.audioEngine.start().catch(console.error);

    // 4. Sample frames from the UI's existing <video> stream (no second camera).
    this.videoInterval = window.setInterval(() => this.processVideoFrame(), FRAME_INTERVAL_MS);
  }

  private processVideoFrame() {
    const el = this.videoElement;
    if (!el || this.isProcessingVideo || !this.videoWorker) return;
    if (el.readyState < 2 || el.videoWidth === 0) return;
    this.isProcessingVideo = true;
    createImageBitmap(el).then((bmp) => {
      this.videoWorker?.postMessage(
        { imageBitmap: bmp, animalType: this.animalType },
        [bmp as unknown as Transferable],
      );
    }).catch(() => { this.isProcessingVideo = false; });
  }

  private currentAudioChannel(): ChannelEvidence {
    return this.confirmedAudio ?? insufficientAudio(this.lastNoDetection);
  }

  private currentVisualChannel(): ChannelEvidence {
    if (!this.lastVisual) return VISUAL_UNAVAILABLE;
    return toVisualEvidence(this.lastVisual);
  }

  private emit() {
    const audio = this.currentAudioChannel();
    const visual = this.currentVisualChannel();
    const screening = fuseEvidence({ audio, visual });
    this.lastScreening = screening;

    this.onUpdate({
      screening,
      audioLabel: this.confirmedAudioLabel,
      visual: this.lastVisual,
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
    if (this.videoWorker) {
      this.videoWorker.terminate();
      this.videoWorker = null;
    }
    // NOTE: the camera MediaStream is owned by the UI (UnifiedSensingWindow),
    // which stops its own tracks. We only stop reading from the element.

    // Persist a single on-device summary for My Scans (non-media, non-reconstructable).
    this.saveHistory();

    this.confirmedAudio = null;
    this.confirmedAudioLabel = null;
    this.lastVisual = null;
    this.pipelineStatus = 'idle';
    this.liveRms = 0;
    this.liveZcr = 0;
    this.liveCentroid = 0;
    this.isProcessingVideo = false;
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
    // Optional metadata-only cloud summary (spec §9) — never media, best-effort.
    syncScanResult(this.animalType, s);
  }
}
