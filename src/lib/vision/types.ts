/**
 * src/lib/vision/types.ts
 *
 * Shared types for the on-device camera observation pipeline. Kept framework-free
 * so the worker (detection), the main thread (aggregation), and the test harness
 * all speak the same shape.
 *
 * PRIVACY: none of these structures carry pixels. A VisualFrameObs is a tiny
 * numeric summary of one frame (a bounding box + two scalars). Frames themselves
 * are decoded, measured, and released inside the worker and never leave the device.
 */

export type Species = 'dog' | 'cat' | 'other';

/**
 * One frame's observation, produced by the detector worker. All spatial values are
 * normalised to [0,1] against the frame, so they are resolution-independent.
 */
export interface VisualFrameObs {
  /** Monotonic timestamp in ms (worker-supplied). */
  t: number;
  /** A supported subject (dog/cat) was detected this frame. */
  present: boolean;
  /** Detected species (best box), or null when nothing was found. */
  species: Species | null;
  /** Detector confidence for the primary box, 0..1. */
  score: number;
  /** Primary-box centre x, 0..1. */
  cx: number;
  /** Primary-box centre y, 0..1. */
  cy: number;
  /** Primary-box width, 0..1. */
  w: number;
  /** Primary-box height, 0..1. */
  h: number;
  /** Mean frame luminance, 0..1 (lighting-quality input). */
  luminance: number;
  /** Mean absolute inter-frame delta, 0..1 (movement / motion-blur proxy). */
  motion: number;
  /** False when the detector model failed to load — we then NEVER fabricate. */
  modelAvailable: boolean;
}

/** Transient per-cue state (spec §6). No frames are stored — only inference state. */
export interface VisualCueState {
  id: string;
  label: string;
  /** Technically supportable from a bounding box + luminance over time? */
  available: boolean;
  present: boolean;
  firstSeen: number | null;
  lastSeen: number | null;
  occurrenceCount: number;
  /** Fraction of the observed window the cue was present, 0..1. */
  persistenceRatio: number;
  /** Current cue confidence, 0..1. */
  frameConfidence: number;
}

export type VisualPrimaryState =
  | 'CALM'
  | 'MILD'
  | 'ELEVATED'
  | 'HIGH'
  | 'EMERGENCY'
  | 'INSUFFICIENT'
  | 'UNSUPPORTED';

/** Aggregated visual observation for one scan window. */
export interface VisualObservation {
  modelAvailable: boolean;
  durationMs: number;
  frames: number;
  usableFrames: number;
  usableFrameRatio: number;
  species: Species | null;
  speciesConfidence: number; // 0..1
  /** Distress/Stress Signal Index from the visual channel, 0..100. */
  severity: number;
  /** Observation confidence (evidence sufficiency), 0..100 — separate from severity. */
  observationConfidence: number;
  primaryState: VisualPrimaryState;
  indicators: string[];
  explanations: string[];
  redFlags: string[];
  cues: VisualCueState[];
}
