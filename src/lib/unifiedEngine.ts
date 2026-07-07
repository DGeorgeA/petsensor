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

import { PetAudioEngine, type EmotionResult, type PipelineStatus, type NoDetectionKind, type AudioDiag } from './audioPipeline';
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
import { loadReferenceFixtures, type ReferenceFixture } from './referenceLoader';
import { matchAgainstReferences, type ConditionMatch } from './referenceMatch';
import { conditionGroupsForCues, AUDIO_CONDITION_INFO, CONDITION_GROUP_LABELS } from './conditionGroups';

/** Which evidence channels this scan runs (P0 flow: LISTEN / SCAN / BOTH). */
export type ScanMode = 'listen' | 'scan' | 'both';

/** Dev-only stage diagnostics (P6/P8 RCA instrumentation). Never user-facing. */
export interface EngineDiagnostics {
  mode: ScanMode;
  cameraActive: boolean;
  framesSent: number;
  framesProcessed: number;
  usableFrameRatio: number;
  species: string | null;
  speciesConfidence: number;
  visualState: string | null;
  visualSeverity: number;
  visualConfidence: number;
  cueCount: number;
  modelAvailable: boolean;
  audio: AudioDiag | null;
}

// ── Public result type ──────────────────────────────────────────────────────────
export interface UnifiedResult {
  screening: ScreeningResult;
  mode: ScanMode;
  /** Matched signature label for the detail panel (null if no confirmed match). */
  audioLabel: string | null;
  /** Latest visual observation snapshot (for the detail panel). */
  visual: VisualObservation | null;
  /** ≥60% reference-library match for the confirmed vocalisation (null below
   *  the floor / no confirmed audio). Cautious pattern-family name only. */
  conditionMatch: ConditionMatch | null;
  /** Spec §11 non-diagnostic condition groups consistent with fired visual cues. */
  visualConditionGroups: string[];
  pipelineStatus: PipelineStatus;
  // Live visualizer data
  rms: number;
  zcr: number;
  spectralCentroid: number;
  /** Dev diagnostics (read by the dev overlay only). */
  diag: EngineDiagnostics;
}

const VISUAL_UNAVAILABLE: ChannelEvidence = {
  state: 'insufficient',
  category: null,
  confidence: 0,
  summary: 'Point the camera at your pet in good light for a body-language reading',
};

/** Channel deliberately not part of this scan mode — neutral in fusion. */
const CHANNEL_ABSENT: ChannelEvidence = {
  state: 'absent',
  category: null,
  confidence: 0,
  summary: 'Not part of this scan',
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

  // Reference-library matching (Supabase Storage clips, downloaded read-only and
  // embedded on-device; bundled signatures as offline fallback).
  private referenceFixtures: ReferenceFixture[] = [];
  private conditionMatch: ConditionMatch | null = null;

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

  // Mode + diagnostics counters
  private mode: ScanMode = 'both';
  private framesSent = 0;
  private framesProcessed = 0;
  private lastAudioDiag: AudioDiag | null = null;

  constructor(animalType: AnimalType, onUpdate: (result: UnifiedResult) => void) {
    this.animalType = animalType;
    this.onUpdate = onUpdate;
  }

  setContext(ctx: ScanContext | null): void {
    this.context = ctx;
  }

  /** The <video> element mounts after the camera stream attaches — the UI hands
   *  it to the running engine as soon as it exists (scan/both modes). */
  setVideoElement(el: HTMLVideoElement | null): void {
    this.videoElement = el;
  }

  /**
   * Start the selected channels. MUST be called synchronously from the user's
   * LISTEN / SCAN / BOTH tap (P3): getUserMedia + AudioContext.resume consume
   * the trusted gesture, so no setTimeout / deferred indirection before this.
   * @param videoEl the UI's <video> element (null in listen-only mode).
   */
  async start(videoEl: HTMLVideoElement | null, mode: ScanMode = 'both'): Promise<void> {
    this.mode = mode;
    this.videoElement = videoEl;
    this.confirmedAudio = null;
    this.confirmedAudioLabel = null;
    this.lastNoDetection = 'insufficient';
    this.visualAgg = new VisualObservationAggregator();
    this.lastVisual = null;
    this.framesSent = 0;
    this.framesProcessed = 0;
    this.lastAudioDiag = null;
    this.conditionMatch = null;

    const wantAudio = mode === 'listen' || mode === 'both';
    const wantVideo = mode === 'scan' || mode === 'both';

    // Warm the reference library (Supabase Storage, download-only, cached in
    // IndexedDB). Best-effort: matching falls back to bundled signatures until
    // (or unless) the fixtures arrive.
    if (wantAudio) {
      void loadReferenceFixtures()
        .then((fixtures) => { this.referenceFixtures = fixtures; })
        .catch(() => {});
    }

    // 1. Audio channel (only when the user chose it)
    if (wantAudio) {
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
          this.conditionMatch = this.resolveConditionMatch(result);
          this.emit();
          // NOTE: no persistence here — raw features/embeddings never leave device.
        },
        onNoDetection: (kind) => {
          this.lastNoDetection = kind;
          this.emit();
        },
        onDiag: (diag) => {
          this.lastAudioDiag = diag;
        },
      });
    }

    // 2. Visual channel (only when the user chose it)
    if (wantVideo) {
      this.videoWorker = new Worker(new URL('./videoWorker.ts', import.meta.url), { type: 'module' });
      this.videoWorker.onmessage = (e) => {
        const data = e.data;
        if (data?.type === 'RESULT') {
          this.isProcessingVideo = false;
          this.framesProcessed++;
          const obs = data.obs as VisualFrameObs;
          this.visualAgg.ingest(obs);
          this.lastVisual = this.visualAgg.snapshot(contextModifier(this.context));
          this.emit();
        }
        // 'STATUS' messages are informational; modelAvailable propagates via obs.
      };
    }

    // 3. Start audio inside the gesture chain (permission + AudioContext.resume).
    if (wantAudio && this.audioEngine) {
      await this.audioEngine.start().catch(console.error);
    } else {
      this.pipelineStatus = 'idle';
    }

    // 4. Sample frames from the UI's <video> stream (no second camera).
    if (wantVideo) {
      this.videoInterval = window.setInterval(() => this.processVideoFrame(), FRAME_INTERVAL_MS);
    }

    this.emit();
  }

  private processVideoFrame() {
    const el = this.videoElement;
    if (!el || this.isProcessingVideo || !this.videoWorker) return;
    if (el.readyState < 2 || el.videoWidth === 0) return;
    this.isProcessingVideo = true;
    this.framesSent++;
    createImageBitmap(el).then((bmp) => {
      this.videoWorker?.postMessage(
        { imageBitmap: bmp, animalType: this.animalType },
        [bmp as unknown as Transferable],
      );
    }).catch(() => { this.isProcessingVideo = false; });
  }

  /**
   * Name the confirmed vocalisation from the reference library. Priority:
   * downloaded Supabase Storage clips (embedded on-device) → bundled signature
   * family (offline fallback). Below the 60% floor nothing is named — we never
   * force a condition (matching the app's degrade-honestly rule).
   */
  private resolveConditionMatch(result: EmotionResult): ConditionMatch | null {
    const fromReferences = matchAgainstReferences(
      result.embedding, this.animalType, this.referenceFixtures,
    );
    if (fromReferences) return fromReferences;

    // Offline/bundled fallback: the confirmed signature itself is a reference
    // pattern. Same 60% floor applies.
    if (result.similarity >= 0.6) {
      const info = AUDIO_CONDITION_INFO[result.key];
      if (info) {
        return {
          conditionName: info.name,
          matchPercent: Math.min(100, Math.round(result.similarity * 100)),
          category: result.category,
          referencePath: `bundled:${result.key}`,
          validationStatus: 'test_fixture',
        };
      }
    }
    return null;
  }

  /** Spec §11 groups consistent with what the camera actually observed. */
  private currentVisualConditionGroups(): string[] {
    const v = this.lastVisual;
    if (!v || this.mode === 'listen') return [];
    const firedCueIds = v.cues.filter((c) => c.available && c.present).map((c) => c.id);
    const groups = conditionGroupsForCues(firedCueIds);
    // The collapse red flag is not a cue — surface its groups explicitly.
    if (v.redFlags.length > 0) {
      for (const g of [CONDITION_GROUP_LABELS.neuro_vestibular, CONDITION_GROUP_LABELS.systemic]) {
        if (!groups.includes(g)) groups.push(g);
      }
    }
    return groups;
  }

  private currentAudioChannel(): ChannelEvidence {
    if (this.mode === 'scan') return CHANNEL_ABSENT;
    return this.confirmedAudio ?? insufficientAudio(this.lastNoDetection);
  }

  private currentVisualChannel(): ChannelEvidence {
    if (this.mode === 'listen') return CHANNEL_ABSENT;
    if (!this.lastVisual) return VISUAL_UNAVAILABLE;
    return toVisualEvidence(this.lastVisual);
  }

  private buildDiagnostics(): EngineDiagnostics {
    const v = this.lastVisual;
    return {
      mode: this.mode,
      cameraActive: this.videoInterval !== null && !!this.videoElement,
      framesSent: this.framesSent,
      framesProcessed: this.framesProcessed,
      usableFrameRatio: v?.usableFrameRatio ?? 0,
      species: v?.species ?? null,
      speciesConfidence: v?.speciesConfidence ?? 0,
      visualState: v?.primaryState ?? null,
      visualSeverity: v?.severity ?? 0,
      visualConfidence: v?.observationConfidence ?? 0,
      cueCount: v ? v.cues.filter((c) => c.available && c.present).length : 0,
      modelAvailable: v?.modelAvailable ?? true,
      audio: this.lastAudioDiag,
    };
  }

  private emit() {
    const audio = this.currentAudioChannel();
    const visual = this.currentVisualChannel();
    const screening = fuseEvidence({ audio, visual });
    this.lastScreening = screening;

    this.onUpdate({
      screening,
      mode: this.mode,
      audioLabel: this.confirmedAudioLabel,
      visual: this.lastVisual,
      conditionMatch: this.conditionMatch,
      visualConditionGroups: this.currentVisualConditionGroups(),
      pipelineStatus: this.pipelineStatus,
      rms: this.liveRms,
      zcr: this.liveZcr,
      spectralCentroid: this.liveCentroid,
      diag: this.buildDiagnostics(),
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
    this.conditionMatch = null;
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
      // Richer non-media summary — powers the vet-shareable report.
      severity: s.severity,
      observation_confidence: s.observationConfidence,
      modality: s.modality,
      scan_mode: this.mode,
      indicators: s.observedIndicators,
      explanations: s.possibleExplanations,
      recommended_action: s.recommendedAction,
      condition_groups: this.currentVisualConditionGroups(),
      condition_match_name: this.conditionMatch?.conditionName,
      condition_match_percent: this.conditionMatch?.matchPercent,
    }).catch(() => {});
    // Optional metadata-only cloud summary (spec §9) — never media, best-effort.
    syncScanResult(this.animalType, s);
  }
}
