import React from 'react';
import { motion } from 'framer-motion';
import { Mic, Video, Sparkles } from 'lucide-react';
import type { ScanMode } from '../lib/unifiedEngine';

interface Props {
  species: 'dog' | 'cat';
  /** Called synchronously from the tap — this click IS the trusted user gesture
   *  that initialises mic/camera/AudioContext. Do not defer it. */
  onSelect: (mode: ScanMode) => void;
}

interface ModeDef {
  mode: ScanMode;
  title: string;
  desc: string;
  icon: React.ReactNode;
  recommended?: boolean;
}

const MODES: ModeDef[] = [
  { mode: 'listen', title: 'Listen', desc: "Analyze your pet's vocal patterns.", icon: <Mic size={22} /> },
  { mode: 'scan',   title: 'Scan',   desc: 'Observe visible behavioural signals.', icon: <Video size={22} /> },
  { mode: 'both',   title: 'Both',   desc: 'Combine sound and visual observations.', icon: <Sparkles size={22} />, recommended: true },
];

export default function ScanModeChooser({ species, onSelect }: Props) {
  const accent = species === 'dog' ? 'var(--dog-accent)' : 'var(--cat-accent)';
  const accent2 = species === 'dog' ? 'var(--dog-accent-2)' : 'var(--cat-accent-2)';
  const ring = species === 'dog' ? 'var(--dog-ring)' : 'var(--cat-ring)';

  return (
    <div style={{ width: '100%', maxWidth: 560, margin: '0 auto' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))',
        gap: '0.7rem',
      }}>
        {MODES.map((m, i) => (
          <motion.button
            key={m.mode}
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * i, duration: 0.4 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onSelect(m.mode)}
            id={`${species}-mode-${m.mode}`}
            style={{
              position: 'relative',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
              padding: '1.1rem 0.9rem 1rem',
              borderRadius: 20,
              cursor: 'pointer',
              fontFamily: 'var(--font-family)',
              textAlign: 'center',
              background: m.recommended
                ? `linear-gradient(150deg, ${accent}, ${accent2})`
                : 'rgba(255,255,255,0.82)',
              border: m.recommended ? '1.5px solid rgba(255,255,255,0.65)' : `1.5px solid ${ring}`,
              boxShadow: m.recommended
                ? `0 10px 28px ${ring}, inset 0 1px 0 rgba(255,255,255,0.35)`
                : '0 4px 16px rgba(0,0,0,0.05)',
              color: m.recommended ? '#fff' : 'var(--color-text-dark)',
              transition: 'transform 0.12s ease, box-shadow 0.2s ease',
            }}
          >
            {m.recommended && (
              <span style={{
                position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)',
                fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.06em',
                textTransform: 'uppercase',
                background: '#fff', color: species === 'dog' ? '#c05440' : '#6f4bb0',
                borderRadius: 999, padding: '0.15rem 0.6rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)', whiteSpace: 'nowrap',
              }}>
                Recommended
              </span>
            )}
            <span style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 44, height: 44, borderRadius: 14,
              background: m.recommended ? 'rgba(255,255,255,0.22)' : `${ring}`,
              color: m.recommended ? '#fff' : undefined,
            }}>
              {m.icon}
            </span>
            <span style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '0.01em' }}>{m.title}</span>
            <span style={{
              fontSize: '0.74rem', lineHeight: 1.4, fontWeight: 500,
              color: m.recommended ? 'rgba(255,255,255,0.92)' : 'var(--color-text-muted)',
            }}>
              {m.desc}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
