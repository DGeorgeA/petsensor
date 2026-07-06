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

// ── The five canonical output classes ──────────────────────────────────────────
export type ScreeningClass =
  | 'RELAXED'
  | 'POSSIBLE_STRESS'
  | 'POSSIBLE_ANXIETY'
  | 'INSUFFICIENT_EVIDENCE'
  | 'UNSUPPORTED_SUBJECT';

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
}

export interface EvidenceChannels {
  audio: ChannelEvidence;
  visual: ChannelEvidence;
}

export interface ScreeningResult {
  screeningClass: ScreeningClass;
  /** Evidence-aware 0..1 confidence (never presented as certainty). */
  confidence: number;
  headline: string;
  detail: string;
  audioSummary: string;
  visualSummary: string;
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

function build(
  screeningClass: ScreeningClass,
  confidence: number,
  audioSummary: string,
  visualSummary: string,
): ScreeningResult {
  const d = SCREENING_DISPLAY[screeningClass];
  return {
    screeningClass,
    confidence: Math.max(0, Math.min(1, confidence)),
    headline: d.headline,
    detail: d.detail,
    audioSummary,
    visualSummary,
  };
}

/**
 * Evidence-aware fusion. Order matters: unsupported → insufficient → agreement →
 * conflict → single-channel. No channel is ever assumed; absent channels stay
 * neutral (they never downgrade a supported observation, and they never invent one).
 */
export function fuseEvidence(ev: EvidenceChannels): ScreeningResult {
  const a = ev.audio ?? ABSENT_CHANNEL;
  const v = ev.visual ?? ABSENT_CHANNEL;
  const aSum = a.summary || 'No vocal data';
  const vSum = v.summary || 'No visual data';

  const audioMatch = a.state === 'match' && a.category != null;
  const visualMatch = v.state === 'match' && v.category != null;

  // 1. UNSUPPORTED SUBJECT — a channel positively rejected the subject and the
  //    other channel offers no supporting pet evidence.
  const anyUnsupported = a.state === 'unsupported' || v.state === 'unsupported';
  if (anyUnsupported && !audioMatch && !visualMatch) {
    return build('UNSUPPORTED_SUBJECT', 0, aSum, vSum);
  }

  // 2. INSUFFICIENT — nothing usable from either channel.
  if (!audioMatch && !visualMatch) {
    return build('INSUFFICIENT_EVIDENCE', 0, aSum, vSum);
  }

  // 3. Both channels matched.
  if (audioMatch && visualMatch) {
    if (a.category === v.category) {
      // Agreement → higher screening confidence.
      const conf = Math.min(1, (a.confidence + v.confidence) / 2 + 0.12);
      return build(classForCategory(a.category!), conf, aSum, vSum);
    }
    // Conflicting evidence → observe again.
    return build('INSUFFICIENT_EVIDENCE', 0, aSum, vSum);
  }

  // 4. Single channel matched.
  const only = audioMatch ? a : v;
  const cat = only.category!;

  // Relaxed can stand on a single steady channel (a calm reading is low-risk).
  if (cat === 'relaxed') {
    return build('RELAXED', only.confidence, aSum, vSum);
  }

  // A lone, weak stress/anxiety signal with no corroboration → insufficient,
  // so we never over-alert a pet owner on thin evidence.
  if (only.confidence < SOLO_STRESS_MIN_CONFIDENCE) {
    return build('INSUFFICIENT_EVIDENCE', 0, aSum, vSum);
  }

  return build(classForCategory(cat), only.confidence, aSum, vSum);
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
