/**
 * src/lib/sceneMood.ts
 *
 * Maps a screening outcome to the OwnerPetScene mood tint. Kept separate from the
 * component so the component file exports only a component (fast-refresh clean).
 */
import type { ScreeningClass } from './screening';

export type SceneMood = 'calm' | 'mild' | 'elevated' | 'high' | 'emergency' | 'muted';

export function moodFromClass(cls: ScreeningClass, severity = 0): SceneMood {
  switch (cls) {
    case 'RELAXED': return 'calm';
    case 'POSSIBLE_STRESS': return 'mild';
    case 'POSSIBLE_ANXIETY': return severity >= 75 ? 'high' : 'elevated';
    case 'EMERGENCY': return 'emergency';
    default: return 'muted';
  }
}
