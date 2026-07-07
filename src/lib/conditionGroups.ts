/**
 * src/lib/conditionGroups.ts
 *
 * Non-diagnostic "possible condition groups" (camera spec §11) + the cautious
 * naming layer for audio reference matches.
 *
 * LANGUAGE INVARIANT: everything here is phrased as a POSSIBILITY, never a
 * diagnosis. Names describe pattern families ("separation-distress-type
 * vocalisation"), not diseases. Every surfaced name is paired with
 * VET_FOLLOWUP_COPY telling the owner to confirm with a professional.
 */

// ── Spec §11 condition groups (non-diagnostic categories only) ─────────────────
export type ConditionGroupId =
  | 'stress_anxiety'
  | 'pain_discomfort'
  | 'respiratory'
  | 'mobility'
  | 'dermatologic'
  | 'neuro_vestibular'
  | 'gastrointestinal'
  | 'systemic';

export const CONDITION_GROUP_LABELS: Record<ConditionGroupId, string> = {
  stress_anxiety: 'Stress / anxiety-related behaviour',
  pain_discomfort: 'Pain or discomfort indicators',
  respiratory: 'Respiratory effort concern',
  mobility: 'Mobility / gait concern',
  dermatologic: 'Skin & coat concern',
  neuro_vestibular: 'Neurological / vestibular concern',
  gastrointestinal: 'Gastrointestinal concern',
  systemic: 'General systemic concern',
};

/**
 * Visual cue id → condition groups the cue is *consistent with* (spec §3
 * "safe interpretation" column). Only cues the vision engine can actually
 * fire are mapped; NOT_AVAILABLE cues never reach this table.
 */
const CUE_TO_GROUPS: Record<string, ConditionGroupId[]> = {
  pacing_restless: ['stress_anxiety'],
  agitated_movement: ['stress_anxiety'],
  // Spec: low crouch → "Fear, pain or illness possible" — two groups.
  sustained_crouch: ['stress_anxiety', 'pain_discomfort'],
  // Emergency red flag (collapse) is routed via the EMERGENCY override, but the
  // group is still reportable for the vet-facing report.
  collapse: ['neuro_vestibular', 'systemic'],
};

/**
 * Condition groups consistent with the fired visual cues. Returns display
 * labels, deduped, in stable order. Empty for calm/no-signal scans.
 */
export function conditionGroupsForCues(cueIds: string[]): string[] {
  const ids: ConditionGroupId[] = [];
  for (const cue of cueIds) {
    for (const g of CUE_TO_GROUPS[cue] ?? []) {
      if (!ids.includes(g)) ids.push(g);
    }
  }
  return ids.map((g) => CONDITION_GROUP_LABELS[g]);
}

// ── Audio signature key → cautious condition-pattern name ──────────────────────
// These name the PATTERN FAMILY the bundled signature belongs to. They are used
// when a live vocalisation matches a bundled signature or a Supabase Storage
// reference fixture whose manifest entry carries no display name of its own.
interface AudioConditionInfo {
  /** Cautious display name of the matched pattern family. */
  name: string;
  group: ConditionGroupId;
}

export const AUDIO_CONDITION_INFO: Record<string, AudioConditionInfo> = {
  dog_anxious_bark: { name: 'Anxiety-type repetitive barking pattern', group: 'stress_anxiety' },
  dog_separation_whine: { name: 'Separation-distress-type whining pattern', group: 'stress_anxiety' },
  dog_calm_breathing: { name: 'Calm resting breathing pattern', group: 'stress_anxiety' },
  dog_stress_growl: { name: 'Stress-type growling pattern', group: 'stress_anxiety' },
  dog_pain_whimper: { name: 'Discomfort-type whimpering pattern', group: 'pain_discomfort' },
  dog_playful_yap: { name: 'Playful excited vocalisation pattern', group: 'stress_anxiety' },
  cat_distress_meow: { name: 'Distress-type repeated meowing pattern', group: 'stress_anxiety' },
  cat_calm_purr: { name: 'Calm purring pattern', group: 'stress_anxiety' },
  cat_fear_hiss: { name: 'Fear/defensive hissing pattern', group: 'stress_anxiety' },
  cat_discomfort_cry: { name: 'Discomfort-type prolonged crying pattern', group: 'pain_discomfort' },
};

/** Fallback naming when a reference fixture has no condition display name. */
export function fallbackConditionName(
  species: 'dog' | 'cat',
  category: 'relaxed' | 'possible_stress' | 'possible_anxiety',
): string {
  const animal = species === 'dog' ? 'canine' : 'feline';
  switch (category) {
    case 'relaxed': return `Calm ${animal} vocalisation pattern`;
    case 'possible_stress': return `Stress-type ${animal} vocalisation pattern`;
    case 'possible_anxiety': return `Anxiety-type ${animal} vocalisation pattern`;
  }
}

// ── Shared cautious copy ────────────────────────────────────────────────────────
export const VET_FOLLOWUP_COPY =
  'This could possibly be the reason, but only a professional examination can ' +
  'confirm it — please get a vet check through Vet+ or consult your local veterinarian.';

export const AI_REFERENCE_DISCLAIMER =
  'This is an AI-based screening reference only — not a veterinary diagnosis. ' +
  'Use it as a conversation starter with a qualified veterinarian, never as a ' +
  'substitute for professional examination or urgent care.';
