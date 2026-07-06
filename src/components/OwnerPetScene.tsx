import React from 'react';
import type { SceneMood } from '../lib/sceneMood';

/**
 * OwnerPetScene — a warm, branded illustration of an owner cradling their pet.
 * It changes by SPECIES (dog vs cat) and is tinted by the SCAN OUTCOME band, so
 * the same emotional moment (owner + pet) is what the user sees after every scan.
 * Pure inline SVG: crisp at any size, tiny, and CSP-safe (no external assets).
 */

interface Palette { glow: string; glow2: string; ring: string; }
const MOODS: Record<SceneMood, Palette> = {
  calm:      { glow: '#a8e6cf', glow2: '#7ecba8', ring: 'rgba(126,203,168,0.55)' },
  mild:      { glow: '#ffe1a8', glow2: '#f4c07a', ring: 'rgba(244,192,122,0.55)' },
  elevated:  { glow: '#ffc4b0', glow2: '#ff9e8a', ring: 'rgba(255,158,138,0.55)' },
  high:      { glow: '#ffb0a0', glow2: '#ff7e6a', ring: 'rgba(255,126,106,0.60)' },
  emergency: { glow: '#ff9d90', glow2: '#ff5b5b', ring: 'rgba(255,91,91,0.62)' },
  muted:     { glow: '#e4dccf', glow2: '#c9c0b2', ring: 'rgba(170,158,140,0.45)' },
};

interface Props {
  species: 'dog' | 'cat';
  mood?: SceneMood;
  size?: number;
  /** Subtle idle float animation. */
  animate?: boolean;
}

export default function OwnerPetScene({ species, mood = 'calm', size = 168, animate = true }: Props) {
  const p = MOODS[mood];
  const uid = `${species}-${mood}`;
  // Skin + fur tones stay warm and consistent; only the ambient glow carries mood.
  const skin = '#f0c8a8', skinShade = '#e0b090';
  const furShade = species === 'dog' ? '#a86f3e' : '#736e7d';
  const furLight = species === 'dog' ? '#e6b483' : '#b8b2c0';

  return (
    <svg
      width={size} height={size} viewBox="0 0 200 200"
      role="img"
      aria-label={`Illustration of an owner gently holding their ${species}`}
      style={{ display: 'block', filter: `drop-shadow(0 10px 26px ${p.ring})`,
        animation: animate ? 'ownerpet-float 6s ease-in-out infinite' : undefined }}
    >
      <defs>
        <radialGradient id={`bg-${uid}`} cx="50%" cy="42%" r="62%">
          <stop offset="0%" stopColor={p.glow} />
          <stop offset="58%" stopColor={p.glow2} />
          <stop offset="100%" stopColor={p.glow2} stopOpacity="0.35" />
        </radialGradient>
        <linearGradient id={`sk-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={skin} />
          <stop offset="100%" stopColor={skinShade} />
        </linearGradient>
        <linearGradient id={`fur-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={furLight} />
          <stop offset="100%" stopColor={furShade} />
        </linearGradient>
      </defs>

      {/* Ambient disc */}
      <circle cx="100" cy="98" r="92" fill={`url(#bg-${uid})`} opacity="0.9" />
      <circle cx="100" cy="98" r="92" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />

      {/* Soft inner light */}
      <ellipse cx="82" cy="70" rx="46" ry="34" fill="rgba(255,255,255,0.35)" />

      {/* ── OWNER (behind, cradling) ─────────────────────────────────── */}
      {/* Shoulder / body */}
      <path d="M40 176 C40 132 66 112 104 112 C142 112 168 132 168 176 Z" fill={`url(#sk-${uid})`} opacity="0.96" />
      {/* Head */}
      <circle cx="132" cy="78" r="26" fill={`url(#sk-${uid})`} />
      <path d="M108 74 C108 58 120 50 132 50 C144 50 156 58 156 74 C150 66 142 62 132 62 C122 62 114 66 108 74 Z" fill={skinShade} opacity="0.6" />
      {/* Cradling arm curving around the pet */}
      <path d="M150 150 C150 120 128 108 96 112 C74 115 60 132 58 152 C74 140 96 136 112 140 C132 145 146 150 150 150 Z"
        fill={skinShade} opacity="0.9" />

      {/* ── PET (nestled in front) ───────────────────────────────────── */}
      {species === 'dog' ? (
        <g>
          {/* Droopy ears */}
          <path d="M52 118 C40 118 34 138 42 158 C52 150 58 138 60 126 Z" fill={furShade} />
          <path d="M118 116 C132 114 140 134 132 156 C122 148 116 134 114 124 Z" fill={furShade} />
          {/* Head */}
          <ellipse cx="88" cy="140" rx="42" ry="38" fill={`url(#fur-${uid})`} />
          {/* Muzzle */}
          <ellipse cx="88" cy="158" rx="24" ry="18" fill={furLight} />
          {/* Nose */}
          <ellipse cx="88" cy="150" rx="7" ry="5" fill="#3a2a22" />
          {/* Eyes */}
          <circle cx="72" cy="136" r="4.6" fill="#3a2a22" />
          <circle cx="104" cy="136" r="4.6" fill="#3a2a22" />
          <circle cx="73.5" cy="134.5" r="1.6" fill="#fff" />
          <circle cx="105.5" cy="134.5" r="1.6" fill="#fff" />
        </g>
      ) : (
        <g>
          {/* Pointy ears */}
          <path d="M58 116 L50 92 L74 108 Z" fill={`url(#fur-${uid})`} />
          <path d="M118 108 L126 86 L102 104 Z" fill={`url(#fur-${uid})`} />
          <path d="M60 112 L56 100 L70 108 Z" fill="#ffd9e0" opacity="0.8" />
          <path d="M114 104 L118 92 L106 102 Z" fill="#ffd9e0" opacity="0.8" />
          {/* Head */}
          <ellipse cx="88" cy="142" rx="40" ry="36" fill={`url(#fur-${uid})`} />
          {/* Muzzle */}
          <ellipse cx="88" cy="158" rx="18" ry="13" fill={furLight} />
          {/* Nose */}
          <path d="M84 152 L92 152 L88 157 Z" fill="#e08a94" />
          {/* Eyes (feline) */}
          <ellipse cx="72" cy="138" rx="4" ry="5.4" fill="#3a3a2a" />
          <ellipse cx="104" cy="138" rx="4" ry="5.4" fill="#3a3a2a" />
          <circle cx="73.5" cy="136" r="1.5" fill="#fff" />
          <circle cx="105.5" cy="136" r="1.5" fill="#fff" />
          {/* Whiskers */}
          <g stroke={furShade} strokeWidth="1.4" strokeLinecap="round" opacity="0.7">
            <path d="M70 158 L46 154" /><path d="M70 162 L48 164" />
            <path d="M106 158 L130 154" /><path d="M106 162 L128 164" />
          </g>
        </g>
      )}

      {/* Floating heart accent (love / bond) */}
      <path d="M150 44 c-4 -6 -13 -3 -13 5 c0 6 8 11 13 15 c5 -4 13 -9 13 -15 c0 -8 -9 -11 -13 -5 Z"
        fill="#fff" opacity="0.9" style={{ animation: animate ? 'ownerpet-heart 3.2s ease-in-out infinite' : undefined }} />
    </svg>
  );
}
