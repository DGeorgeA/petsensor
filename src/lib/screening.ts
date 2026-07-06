/**
 * src/lib/screening.ts
 *
 * Cautious behavioural-SCREENING taxonomy + evidence-aware fusion.
 *
 * This module is the single source of truth for the five output classes the
 * product may show. It never claims a diagnosis. Screening cues are combined
 * across independent evidence channels (audio + visual) so that one weak
 * signal can never dominate, and the pipeline degrades honestly to
 * INSUFFICIENT_EVIDENCE / UNSUPPORTED_SUBJECT instead of inventing a verdict.
 *
 * Pure, framework-free, importable from both Web Workers and React.
 */

// ── The canonical output classes ────────────────────────────────────────────────
// EMERGENCY is produced ONLY by a conservative visual red-flag override (never by
// ordinary evidence fusion) and always bypasses the normal severity bands.
export type ScreeningClass =
  | 'RELAXED'
  | 'POSSIBLE_STRESS'
  | 'POSSIBLE_ANXIETY'
  | 'INSUFFICIENT_EVIDENCE'
  | 'UNSUPPORTED_SUBJECT'
  | 'EMERGENCY';

/** Screening category a single reference signature / cue maps to. */
export type ScreeningCategory = 'relaxed' | 'possible_stress' | 'possible_anxiety';

/** Per-channel evidence state. */
export type ChannelState = 'match' | 'insufficient' | 'unsupported' | 'absent';

export interface ChannelEvidence {
  state: ChannelState;
  /** Present only when state === 'match'. */
  category: ScreeningCategory | null;
  /** 0..1 strength of a temporally-consistent match (0 otherwise). */
  confidence: number;
  /** Short, cautious human summary of what this channel observed. */
  summary: string;

  // ── Optional richer signal (populated by the visual channel; audio may set
  //    severity from its own arousal score). Fusion degrades gracefully if absent.
  /** Channel severity, 0–100 (this channel's own distress index). */
  severity?: number;
  /** Channel observation quality, 0–1 (visibility/signal quality). */
  quality?: number;
  /** Cautious observed indicators from this channel. */
  indicators?: string[];
  /** Non-diagnostic possible explanations from this channel. */
  explanations?: string[];
  /** Conservative red flags (visual channel only). Presence forces EMERGENCY. */
  redFlags?: string[];
}

export interface EvidenceChannels {
  audio: ChannelEvidence;
  visual: ChannelEvidence;
}

/** How the result was reached — surfaced so UI copy can be modality-honest. */
export type Modality = 'audio' | 'visual' | 'multimodal' | 'none';

/** Recommended next step, ordered by urgency. */
export type RecommendedAction =
  | 'observe'
  | 'repeat'
  | 'monitor'
  | 'routine_vet'
  | 'prompt_vet'
  | 'emergency';

export interface ScreeningResult {
  screeningClass: ScreeningClass;
  /** Evidence-aware 0..1 confidence (never presented as certainty). Kept for
   *  backward-compatibility; equals observationConfidence/100. */
  confidence: number;
  headline: string;
  detail: string;
  audioSummary: string;
  visualSummary: string;

  // ── Extended screening surface (spec §7/§8) ──────────────────────────────────
  /** Stress/Distress Signal Index, 0–100. A screening index, NOT a probability. */
  severity: number;
  /** Observation confidence, 0–100. Whether we had enough evidence — separate
   *  from severity. High severity + low confidence is a valid, honest state. */
  observationConfidence: number;
  /** Which channels produced this result. */
  modality: Modality;
  /** Short, cautious observed indicators (e.g. "repeated pacing"). */
  observedIndicators: string[];
  /** Non-diagnostic possible explanations (e.g. "environmental stress"). */
  possibleExplanations: string[];
  /** Recommended next step. */
  recommendedAction: RecommendedAction;
  /** Conservative visual red flags (empty unless EMERGENCY). */
  redFlags: string[];
}

// ── User-facing copy per class (cautious language, never diagnostic) ────────────
export interface ScreeningDisplay {
  headline: string;
  detail: string;
  emoji: string;
  /** Accent colour token used by meters/badges. */
  accent: string;
}

export const SCREENING_DISPLAY: Record<ScreeningClass, ScreeningDisplay> = {
  RELAXED: {
    headline: 'Relaxed indicators observed',
    detail:
      'The sounds and body language we could observe look calm and settled. This is a wellness screening, not a diagnosis.',
    emoji: '😌',
    accent: 'var(--color-sage-green)',
  },
  POSSIBLE_STRESS: {
    headline: 'Possible stress-related signals observed',
    detail:
      'We observed patterns that can be associated with stress. Many things can cause these signs — keep observing, and consult a vet if you are concerned.',
    emoji: '😐',
    accent: 'var(--color-soft-gold)',
  },
  POSSIBLE_ANXIETY: {
    headline: 'Possible anxiety-related signals observed',
    detail:
      'We observed patterns that can be associated with anxiety. This is not a diagnosis — behavioural signs have many causes. If this persists, a qualified veterinarian can help.',
    emoji: '😟',
    accent: 'var(--color-sunset-coral)',
  },
  INSUFFICIENT_EVIDENCE: {
    headline: 'Insufficient evidence — try again in a quieter setting',
    detail:
      'We could not gather a clear, steady signal. Move closer, reduce background noise, and keep your pet in frame, then scan again.',
    emoji: '🔍',
    accent: 'var(--color-text-muted)',
  },
  UNSUPPORTED_SUBJECT: {
    headline: 'Unsupported subject — this feature supports dogs and cats only',
    detail:
      'We did not detect a supported dog or cat vocalisation or subject. Point the camera at your pet and scan in a quieter space.',
    emoji: '🐾',
    accent: 'var(--color-text-muted)',
  },
  EMERGENCY: {
    headline: 'Potential emergency signs detected',
    detail:
      'Seek urgent veterinary care now. Camera analysis cannot determine the cause. This screening does not replace an examination — please contact a veterinarian immediately.',
    emoji: '🚨',
    accent: 'var(--color-sunset-coral)',
  },
};

// ── Severity bands (spec §6/§7) ─────────────────────────────────────────────────
export type PrimaryState =
  | 'CALM'
  | 'MILD'
  | 'ELEVATED'
  | 'HIGH'
  | 'EMERGENCY'
  | 'INSUFFICIENT'
  | 'UNSUPPORTED';

/** Map a 0–100 severity index to its concern band. */
export function severityBand(severity: number): 'CALM' | 'MILD' | 'ELEVATED' | 'HIGH' {
  if (severity >= 75) return 'HIGH';
  if (severity >= 50) return 'ELEVATED';
  if (severity >= 25) return 'MILD';
  return 'CALM';
}

/** Recommended next step per class + band. Never manipulative; never diagnostic. */
export function recommendedActionFor(
  cls: ScreeningClass,
  severity: number,
): RecommendedAction {
  if (cls === 'EMERGENCY') return 'emergency';
  if (cls === 'INSUFFICIENT_EVIDENCE' || cls === 'UNSUPPORTED_SUBJECT') return 'repeat';
  const band = severityBand(severity);
  switch (band) {
    case 'CALM': return 'observe';
    case 'MILD': return 'monitor';
    case 'ELEVATED': return 'routine_vet';
    case 'HIGH': return 'prompt_vet';
  }
}

/** Short, action-oriented next-step copy (cautious, non-diagnostic). */
export const RECOMMENDED_ACTION_COPY: Record<RecommendedAction, string> = {
  observe: 'Relaxed indicators observed. Continue normal observation.',
  repeat: 'Move closer, improve lighting, reduce background noise, and scan again.',
  monitor: 'Some mild signals were observed. Consider environmental triggers and keep monitoring your pet.',
  routine_vet: 'Repeated signals were observed. Monitor closely and consider Vet+ if this persists, is new, or worsens.',
  prompt_vet: 'Multiple or strong signals were observed. A veterinary review may be appropriate — you can start with Vet+.',
  emergency: 'Seek urgent veterinary care now. Camera analysis cannot determine the cause.',
};

// ── Fusion tuning ──────────────────────────────────────────────────────────────
/**
 * A single strong channel must clear this to escalate to a stress/anxiety class
 * on its own. Below it (with no corroboration) we prefer INSUFFICIENT_EVIDENCE —
 * "weak audio + no visual support → insufficient evidence".
 */
const SOLO_STRESS_MIN_CONFIDENCE = 0.55;

const ABSENT_CHANNEL: ChannelEvidence = {
  state: 'absent',
  category: null,
  confidence: 0,
  summary: 'No data',
};

function classForCategory(cat: ScreeningCategory): ScreeningClass {
  switch (cat) {
    case 'relaxed':
      return 'RELAXED';
    case 'possible_stress':
      return 'POSSIBLE_STRESS';
    case 'possible_anxiety':
      return 'POSSIBLE_ANXIETY';
  }
}

/** Fallback severity for a category when a channel does not supply its own. */
function categorySeverity(cat: ScreeningCategory, confidence: number): number {
  const base = cat === 'relaxed' ? 12 : cat === 'possible_stress' ? 42 : 68;
  // Nudge within the band by confidence so a strong match reads a little higher.
  const spread = cat === 'relaxed' ? 8 : 14;
  return Math.round(base + (confidence - 0.5) * spread);
}

const DEFAULT_EXPLANATIONS: Record<ScreeningCategory, string[]> = {
  relaxed: [],
  possible_stress: ['environmental stress', 'mild discomfort', 'unfamiliar surroundings'],
  possible_anxiety: ['environmental stress', 'separation-related distress', 'discomfort', 'over-arousal'],
};

interface BuildOpts {
  observationConfidence: number; // 0..100
  severity: number;              // 0..100
  modality: Modality;
  audioSummary: string;
  visualSummary: string;
  indicators?: string[];
  explanations?: string[];
  redFlags?: string[];
}

function build(screeningClass: ScreeningClass, o: BuildOpts): ScreeningResult {
  const d = SCREENING_DISPLAY[screeningClass];
  const obs = Math.max(0, Math.min(100, Math.round(o.observationConfidence)));
  const sev = Math.max(0, Math.min(100, Math.round(o.severity)));
  return {
    screeningClass,
    confidence: obs / 100,
    headline: d.headline,
    detail: d.detail,
    audioSummary: o.audioSummary,
    visualSummary: o.visualSummary,
    severity: sev,
    observationConfidence: obs,
    modality: o.modality,
    observedIndicators: o.indicators ?? [],
    possibleExplanations: o.explanations ?? [],
    recommendedAction: recommendedActionFor(screeningClass, sev),
    redFlags: o.redFlags ?? [],
  };
}

function channelSeverity(c: ChannelEvidence): number {
  if (typeof c.severity === 'number') return c.severity;
  if (c.category) return categorySeverity(c.category, c.confidence);
  return 0;
}

function gatherIndicators(...cs: ChannelEvidence[]): string[] {
  const out: string[] = [];
  for (const c of cs) for (const i of c.indicators ?? []) if (!out.includes(i)) out.push(i);
  return out;
}

function explanationsFor(cat: ScreeningCategory, ...cs: ChannelEvidence[]): string[] {
  const provided: string[] = [];
  for (const c of cs) for (const e of c.explanations ?? []) if (!provided.includes(e)) provided.push(e);
  return provided.length ? provided : DEFAULT_EXPLANATIONS[cat];
}

/**
 * Evidence-aware fusion. Order matters: emergency → unsupported → insufficient →
 * agreement → conflict → single-channel. No channel is ever assumed; absent
 * channels stay neutral (they never downgrade a supported observation, and never
 * invent one). Severity and observation confidence are kept strictly separate.
 */
export function fuseEvidence(ev: EvidenceChannels): ScreeningResult {
  const a = ev.audio ?? ABSENT_CHANNEL;
  const v = ev.visual ?? ABSENT_CHANNEL;
  const aSum = a.summary || 'No vocal data';
  const vSum = v.summary || 'No visual data';

  const audioMatch = a.state === 'match' && a.category != null;
  const visualMatch = v.state === 'match' && v.category != null;

  // 0. EMERGENCY OVERRIDE — a conservative visual red flag bypasses the score
  //    entirely (spec §8/§10). This is the only path to the EMERGENCY class.
  const redFlags = [...(v.redFlags ?? []), ...(a.redFlags ?? [])];
  if (redFlags.length > 0) {
    return build('EMERGENCY', {
      observationConfidence: Math.round((v.quality ?? 0.5) * 100),
      severity: Math.max(90, channelSeverity(v)),
      modality: visualMatch && audioMatch ? 'multimodal' : v.redFlags?.length ? 'visual' : 'audio',
      audioSummary: aSum,
      visualSummary: vSum,
      indicators: gatherIndicators(v, a),
      redFlags,
    });
  }

  // 1. UNSUPPORTED SUBJECT — a channel positively rejected the subject and the
  //    other channel offers no supporting pet evidence.
  const anyUnsupported = a.state === 'unsupported' || v.state === 'unsupported';
  if (anyUnsupported && !audioMatch && !visualMatch) {
    return build('UNSUPPORTED_SUBJECT', {
      observationConfidence: 0, severity: 0, modality: 'none',
      audioSummary: aSum, visualSummary: vSum,
    });
  }

  // 2. INSUFFICIENT — nothing usable from either channel.
  if (!audioMatch && !visualMatch) {
    return build('INSUFFICIENT_EVIDENCE', {
      observationConfidence: 0, severity: 0, modality: 'none',
      audioSummary: aSum, visualSummary: vSum,
    });
  }

  // 3. Both channels matched.
  if (audioMatch && visualMatch) {
    if (a.category === v.category) {
      // Agreement → higher observation confidence; severity is evidence-weighted.
      // The corroboration bonus applies ONLY when BOTH channels are individually
      // solid (≥0.55) — two thin, barely-matching channels must not fuse into a
      // firm-looking alarm.
      const bothSolid = Math.min(a.confidence, v.confidence) >= SOLO_STRESS_MIN_CONFIDENCE;
      const obs = Math.min(100, (a.confidence + v.confidence) / 2 * 100 + (bothSolid ? 12 : 0));
      const sev = (channelSeverity(a) + channelSeverity(v)) / 2;
      return build(classForCategory(a.category!), {
        observationConfidence: obs, severity: sev, modality: 'multimodal',
        audioSummary: aSum, visualSummary: vSum,
        indicators: gatherIndicators(a, v),
        explanations: explanationsFor(a.category!, a, v),
      });
    }
    // Conflicting evidence → observe again (mixed signals).
    return build('INSUFFICIENT_EVIDENCE', {
      observationConfidence: 0, severity: 0, modality: 'multimodal',
      audioSummary: aSum, visualSummary: vSum,
    });
  }

  // 4. Single channel matched.
  const only = audioMatch ? a : v;
  const cat = only.category!;
  const modality: Modality = audioMatch ? 'audio' : 'visual';
  const obs = only.confidence * 100;

  // Relaxed can stand on a single steady channel (a calm reading is low-risk).
  if (cat === 'relaxed') {
    return build('RELAXED', {
      observationConfidence: obs, severity: channelSeverity(only), modality,
      audioSummary: aSum, visualSummary: vSum,
      indicators: gatherIndicators(only),
      explanations: explanationsFor(cat, only),
    });
  }

  // A lone, weak stress/anxiety signal with no corroboration → insufficient,
  // so we never over-alert a pet owner on thin evidence.
  if (only.confidence < SOLO_STRESS_MIN_CONFIDENCE) {
    return build('INSUFFICIENT_EVIDENCE', {
      observationConfidence: 0, severity: 0, modality,
      audioSummary: aSum, visualSummary: vSum,
    });
  }

  return build(classForCategory(cat), {
    observationConfidence: obs, severity: channelSeverity(only), modality,
    audioSummary: aSum, visualSummary: vSum,
    indicators: gatherIndicators(only),
    explanations: explanationsFor(cat, only),
  });
}

/**
 * Map a temporal cosine-similarity (already past the ~0.92 confirmation gate,
 * so effectively in [0.85, 1.0]) to a conservative displayed confidence band.
 * We deliberately compress toward the middle so the UI never reads as certainty.
 */
export function similarityToConfidence(sim: number): number {
  const lo = 0.85;
  const norm = Math.max(0, Math.min(1, (sim - lo) / (1 - lo)));
  // Map [0,1] → [0.45, 0.9]
  return 0.45 + norm * 0.45;
}
