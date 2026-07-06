/**
 * src/lib/vision/visualCues.ts
 *
 * Pure, framework-free temporal aggregator for the camera channel.
 *
 * Design principles (from the Camera Framework spec + false-positive controls):
 *   - Never classify from a single frame. Everything is temporal.
 *   - Only score cues that are technically supportable from a bounding box +
 *     luminance over time. Fine-grained cues (ears, tail, lip-licking, gum
 *     colour, panting, whale-eye) are marked NOT_AVAILABLE and never fire — we
 *     do not fabricate evidence.
 *   - Stillness is treated as low-arousal (calm-leaning), NOT lethargy, because a
 *     camera cannot distinguish rest/sleep from distress. Agitation is the main
 *     defensible distress signal.
 *   - Severity (how concerning) and observation confidence (did we see enough)
 *     are computed independently.
 *   - Red flags (seizure-like, collapse) require strong, sustained evidence and
 *     bypass the score with an emergency routing.
 *
 * Supported channels (spec weights, renormalised over what we can measure):
 *   body_posture 0.22  → sustained low crouch (bbox aspect proxy)
 *   movement     0.18  → pacing / restlessness / escape-seeking (centroid dynamics)
 *   temporal_persistence 0.10 → applied as the persistence modifier (spec formula)
 */

import type {
  Species,
  VisualFrameObs,
  VisualCueState,
  VisualObservation,
  VisualPrimaryState,
} from './types';
import type { ChannelEvidence, ScreeningCategory } from '../screening';

// ── Tunables (versioned; conservative to protect against false positives) ────────
export const VISUAL_FEATURE_VERSION = 'vis-v1-20260706';

const DETECT_GATE = 0.45;          // coco-ssd score to count a usable detection
const MIN_USABLE_FRAMES = 12;      // ~4s at 3fps before any classification
const OBS_CONFIDENCE_FLOOR = 45;   // below this → INSUFFICIENT_EVIDENCE
const TARGET_WINDOW_MS = 20_000;   // spec: 20–60s; confidence ramps toward this

// Movement thresholds in normalised units/second (bbox centre displacement).
const FREEZE_SPEED = 0.02;
const ACTIVE_SPEED = 0.09;

// Posture: sustained low bbox aspect (height/width) suggests a low/crouched body.
const CROUCH_ASPECT = 0.62;

// Renormalised channel weights over the two spatial channels we can measure.
const W_POSTURE = 0.22;
const W_MOVEMENT = 0.18;
const W_SUM = W_POSTURE + W_MOVEMENT;

// Red-flag detection (conservative).
//
// We deliberately do NOT auto-detect seizure-like tremor: at ~3 fps the sampling
// rate is below the Nyquist limit for tremor frequency, so it cannot be reliably
// separated from vigorous pacing / zoomies. Auto-flagging it would risk false
// emergencies. Seizure/respiratory-distress signs are surfaced to the user as
// guidance text instead of being fabricated as detections. The one visual
// emergency we CAN defensibly detect from a bounding box is a sudden collapse:
// a large downward displacement followed by sustained immobility.
const COLLAPSE_DROP = 0.28;        // sudden downward jump of bbox centre (norm)
const COLLAPSE_STILL_MS = 2500;    // immobility required after the drop

interface CentroidSample {
  t: number;
  cx: number;
  cy: number;
  aspect: number; // h / w
  speed: number;  // units/sec vs previous usable sample
}

/**
 * Accumulates per-frame observations and produces a cautious VisualObservation.
 * Bounded: only compact numeric samples are retained (no frames).
 */
export class VisualObservationAggregator {
  private frames = 0;
  private usable = 0;
  private firstT: number | null = null;
  private lastT: number | null = null;

  private speciesVotes: Record<Species, number> = { dog: 0, cat: 0, other: 0 };

  private lumSum = 0;
  private lumCount = 0;
  private scoreSum = 0;

  private samples: CentroidSample[] = [];   // bounded ring (usable frames only)
  private prevUsable: CentroidSample | null = null;

  private modelAvailable = true;

  // Red-flag transient state
  private reversals = 0;
  private lastDir = 0;             // sign of horizontal velocity
  private oscillationStart: number | null = null;
  private collapseDropAt: number | null = null;
  private collapseStillMs = 0;

  private readonly maxSamples = 600; // ~200s at 3fps — hard bound

  ingest(o: VisualFrameObs): void {
    this.frames++;
    if (this.firstT == null) this.firstT = o.t;
    this.lastT = o.t;
    if (!o.modelAvailable) this.modelAvailable = false;

    this.lumSum += o.luminance;
    this.lumCount++;

    if (o.species) this.speciesVotes[o.species]++;

    const isUsable = o.present && o.score >= DETECT_GATE && (o.species === 'dog' || o.species === 'cat');
    if (!isUsable) {
      // A gap resets the current oscillation streak (we require continuity).
      this.oscillationStart = null;
      this.prevUsable = null;
      return;
    }

    this.usable++;
    this.scoreSum += o.score;

    const aspect = o.w > 1e-4 ? o.h / o.w : 1;
    let speed = 0;
    if (this.prevUsable) {
      const dt = Math.max(1, o.t - this.prevUsable.t) / 1000;
      const dist = Math.hypot(o.cx - this.prevUsable.cx, o.cy - this.prevUsable.cy);
      speed = dist / dt;

      // Direction-reversal counting (horizontal) → pacing / seizure oscillation.
      const dir = Math.sign(o.cx - this.prevUsable.cx);
      if (dir !== 0 && this.lastDir !== 0 && dir !== this.lastDir) {
        this.reversals++;
        if (this.oscillationStart == null) this.oscillationStart = this.prevUsable.t;
      }
      if (dir !== 0) this.lastDir = dir;

      // Collapse candidate: a sudden large downward jump of the centre.
      if (o.cy - this.prevUsable.cy > COLLAPSE_DROP) {
        this.collapseDropAt = o.t;
        this.collapseStillMs = 0;
      } else if (this.collapseDropAt != null) {
        if (speed < FREEZE_SPEED) this.collapseStillMs += (o.t - this.prevUsable.t);
        else this.collapseDropAt = null; // moved again → not a collapse
      }
    }

    const s: CentroidSample = { t: o.t, cx: o.cx, cy: o.cy, aspect, speed };
    this.samples.push(s);
    if (this.samples.length > this.maxSamples) this.samples.shift();
    this.prevUsable = s;
  }

  private resolveSpecies(): { species: Species | null; confidence: number } {
    const dog = this.speciesVotes.dog;
    const cat = this.speciesVotes.cat;
    const other = this.speciesVotes.other;
    const total = dog + cat + other;
    if (total === 0) return { species: null, confidence: 0 };
    const petTotal = dog + cat;
    // If mostly "other" and almost no dog/cat → unsupported subject.
    if (petTotal < other * 0.5) return { species: 'other', confidence: other / total };
    const species: Species = dog >= cat ? 'dog' : 'cat';
    return { species, confidence: Math.max(dog, cat) / Math.max(1, petTotal) };
  }

  /**
   * @param contextModifier multiplicative severity modifier from user context
   *        answers (bounded ~0.8..1.1). Applied to severity only, never to
   *        observation confidence. Defaults to 1 (no context provided).
   */
  snapshot(contextModifier = 1): VisualObservation {
    const durationMs = this.firstT != null && this.lastT != null ? this.lastT - this.firstT : 0;
    const usableFrameRatio = this.frames > 0 ? this.usable / this.frames : 0;
    const meanLum = this.lumCount > 0 ? this.lumSum / this.lumCount : 0;
    const meanScore = this.usable > 0 ? this.scoreSum / this.usable : 0;
    const { species, confidence: speciesConfidence } = this.resolveSpecies();

    // ── Movement dynamics ──────────────────────────────────────────────────────
    const speeds = this.samples.map((s) => s.speed).filter((_, i) => i > 0);
    const meanSpeed = mean(speeds);
    const speedVar = variance(speeds, meanSpeed);
    const activeRatio = speeds.length ? speeds.filter((v) => v > ACTIVE_SPEED).length / speeds.length : 0;

    // Agitation: sustained/repeated movement with reversals (pacing) + variability.
    const pacing = clamp01((this.reversals / Math.max(6, this.usable)) * 2.2);
    const restlessness = clamp01(activeRatio * 1.3 + Math.sqrt(speedVar) * 3);
    const movementIntensity = clamp01(0.55 * pacing + 0.45 * restlessness);

    // ── Posture: sustained low crouch (bbox aspect proxy) ──────────────────────
    const crouchFrames = this.samples.filter((s) => s.aspect < CROUCH_ASPECT).length;
    const crouchRatio = this.usable > 0 ? crouchFrames / this.usable : 0;
    // Require persistence before crouch contributes (single frame ≠ posture).
    const postureIntensity = crouchRatio > 0.5 ? clamp01((crouchRatio - 0.5) * 2) : 0;

    // ── Raw behaviour score (renormalised over measured channels) ──────────────
    const rawBehavior = (W_POSTURE * postureIntensity + W_MOVEMENT * movementIntensity) / W_SUM;

    // ── Temporal persistence modifier (spec formula) ───────────────────────────
    const persistence = this.persistenceRatio();
    const temporalMod = 0.72 + 0.43 * persistence; // ~[0.72, 1.15]

    let severity = clamp0100(rawBehavior * temporalMod * contextModifier * 100);

    // ── Observation confidence (evidence sufficiency) ──────────────────────────
    const lightingQ = lightingQuality(meanLum);
    const durationQ = clamp01(durationMs / TARGET_WINDOW_MS);
    const visibilityQ = clamp01(usableFrameRatio * 1.15);
    const detectionQ = clamp01(meanScore);
    const consistencyQ = speciesConfidence;
    let observationConfidence = clamp0100(
      100 * (0.28 * visibilityQ + 0.20 * detectionQ + 0.18 * lightingQ +
             0.17 * durationQ + 0.17 * consistencyQ),
    );

    // ── Red flags (conservative, sustained) ────────────────────────────────────
    const redFlags: string[] = [];
    if (this.collapseDropAt != null && this.collapseStillMs >= COLLAPSE_STILL_MS) {
      redFlags.push('sudden collapse followed by immobility');
    }

    // ── Cues (transient inference state, no frames retained) ────────────────────
    const cues = this.buildCues({ movementIntensity, postureIntensity, pacing, restlessness, crouchRatio, persistence });
    const indicators = cues.filter((c) => c.available && c.present).map((c) => c.label);
    const explanations = severity >= 25
      ? ['environmental stress', 'discomfort', 'over-arousal', 'unfamiliar surroundings or trigger']
      : [];

    // ── Primary state ──────────────────────────────────────────────────────────
    let primaryState: VisualPrimaryState;
    if (!this.modelAvailable) {
      primaryState = 'INSUFFICIENT';
      observationConfidence = 0;
    } else if (species === 'other' && speciesConfidence > 0.5 && this.usable < MIN_USABLE_FRAMES) {
      primaryState = 'UNSUPPORTED';
    } else if (this.usable < MIN_USABLE_FRAMES || observationConfidence < OBS_CONFIDENCE_FLOOR) {
      primaryState = 'INSUFFICIENT';
    } else if (redFlags.length > 0) {
      primaryState = 'EMERGENCY';
    } else {
      primaryState = bandOf(severity);
    }

    // When we cannot see enough, do not surface a severity number as if it meant something.
    if (primaryState === 'INSUFFICIENT' || primaryState === 'UNSUPPORTED') severity = 0;

    return {
      modelAvailable: this.modelAvailable,
      durationMs,
      frames: this.frames,
      usableFrames: this.usable,
      usableFrameRatio,
      species: species === 'other' ? 'other' : species,
      speciesConfidence,
      severity,
      observationConfidence,
      primaryState,
      indicators,
      explanations,
      redFlags,
      cues,
    };
  }

  private persistenceRatio(): number {
    // Fraction of the window in which agitation cues were active.
    if (this.samples.length < 2) return 0;
    const active = this.samples.filter((s) => s.speed > ACTIVE_SPEED).length;
    return clamp01(active / this.samples.length);
  }

  private buildCues(m: {
    movementIntensity: number; postureIntensity: number;
    pacing: number; restlessness: number; crouchRatio: number; persistence: number;
  }): VisualCueState[] {
    const first = this.firstT;
    const last = this.lastT;
    const win = (present: boolean, conf: number): Partial<VisualCueState> => ({
      present,
      firstSeen: present ? first : null,
      lastSeen: present ? last : null,
      occurrenceCount: present ? Math.round(conf * this.usable) : 0,
      persistenceRatio: present ? m.persistence : 0,
      frameConfidence: present ? conf : 0,
    });

    const available: VisualCueState[] = [
      { id: 'relaxed_movement', label: 'settled, unhurried movement', available: true,
        ...win(m.movementIntensity < 0.25 && m.postureIntensity < 0.3 && this.usable >= MIN_USABLE_FRAMES, 1 - m.movementIntensity) } as VisualCueState,
      { id: 'pacing_restless', label: 'repeated pacing / restlessness', available: true,
        ...win(m.pacing > 0.5 || m.restlessness > 0.5, Math.max(m.pacing, m.restlessness)) } as VisualCueState,
      { id: 'sustained_crouch', label: 'sustained low / crouched posture', available: true,
        ...win(m.postureIntensity > 0.4, m.postureIntensity) } as VisualCueState,
      { id: 'agitated_movement', label: 'agitated or escape-oriented movement', available: true,
        ...win(m.movementIntensity > 0.6, m.movementIntensity) } as VisualCueState,
    ];

    // Cues we cannot honestly measure from a bounding box — declared, never fired.
    const NOT_AVAILABLE = [
      'ears_back', 'tail_tucked', 'lip_licking', 'yawning', 'whale_eye',
      'panting', 'open_mouth_breathing', 'trembling', 'overgrooming',
      'head_tilt', 'limping', 'gum_colour',
    ];
    const unavailable: VisualCueState[] = NOT_AVAILABLE.map((id) => ({
      id, label: id.replace(/_/g, ' '), available: false, present: false,
      firstSeen: null, lastSeen: null, occurrenceCount: 0, persistenceRatio: 0, frameConfidence: 0,
    }));

    return [...available, ...unavailable];
  }
}

// ── Mapping to the fusion evidence channel ───────────────────────────────────────
function categoryForBand(state: VisualPrimaryState): ScreeningCategory | null {
  switch (state) {
    case 'CALM': return 'relaxed';
    case 'MILD': return 'possible_stress';
    case 'ELEVATED':
    case 'HIGH': return 'possible_anxiety';
    default: return null;
  }
}

/** Convert an aggregated visual observation into a fusion ChannelEvidence. */
export function toVisualEvidence(o: VisualObservation): ChannelEvidence {
  if (o.redFlags.length > 0) {
    return {
      state: 'match', category: 'possible_anxiety',
      confidence: (o.observationConfidence || 50) / 100,
      summary: 'Potential emergency signs observed',
      severity: o.severity, quality: o.observationConfidence / 100,
      indicators: o.indicators, explanations: o.explanations, redFlags: o.redFlags,
    };
  }
  if (o.primaryState === 'UNSUPPORTED') {
    return { state: 'unsupported', category: null, confidence: 0,
      summary: 'No supported dog or cat clearly visible' };
  }
  if (o.primaryState === 'INSUFFICIENT') {
    return { state: 'insufficient', category: null, confidence: 0,
      summary: o.modelAvailable
        ? 'Body-language view was not clear or steady enough'
        : 'Visual detector unavailable on this device' };
  }
  const category = categoryForBand(o.primaryState);
  if (!category) {
    return { state: 'insufficient', category: null, confidence: 0, summary: 'No clear visual reading' };
  }
  return {
    state: 'match', category,
    confidence: o.observationConfidence / 100,
    summary: o.indicators.length
      ? `Observed: ${o.indicators.slice(0, 3).join(', ')}`
      : 'Calm body-language indicators',
    severity: o.severity,
    quality: o.observationConfidence / 100,
    indicators: o.indicators,
    explanations: o.explanations,
  };
}

// ── small numeric helpers ────────────────────────────────────────────────────────
function clamp01(x: number): number { return Math.max(0, Math.min(1, x)); }
function clamp0100(x: number): number { return Math.max(0, Math.min(100, x)); }
function mean(a: number[]): number { return a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0; }
function variance(a: number[], m: number): number { return a.length ? a.reduce((s, v) => s + (v - m) * (v - m), 0) / a.length : 0; }
function bandOf(sev: number): VisualPrimaryState {
  if (sev >= 75) return 'HIGH';
  if (sev >= 50) return 'ELEVATED';
  if (sev >= 25) return 'MILD';
  return 'CALM';
}
function lightingQuality(lum: number): number {
  // Best in a comfortable mid-range; penalise very dark / blown-out.
  if (lum < 0.08 || lum > 0.95) return 0.15;
  if (lum < 0.15) return 0.5;
  if (lum > 0.9) return 0.5;
  return 1;
}
