import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  x: string;
  y: string;
  size: number;
  color: string;
  duration: number;
  delay: number;
  driftX: number;
}

interface AmbientParticlesProps {
  count?: number;
  palette?: 'warm' | 'coral' | 'lavender' | 'sage';
  active?: boolean; // slows particles during active analysis
  style?: React.CSSProperties;
}

const PALETTES = {
  warm: [
    'rgba(255,170,165,0.55)',
    'rgba(255,211,182,0.50)',
    'rgba(244,208,104,0.45)',
    'rgba(255,200,170,0.40)',
    'rgba(255,235,200,0.35)',
  ],
  coral: [
    'rgba(255,140,120,0.60)',
    'rgba(255,170,165,0.55)',
    'rgba(255,211,182,0.45)',
    'rgba(244,160,90,0.40)',
    'rgba(255,220,195,0.35)',
  ],
  lavender: [
    'rgba(200,175,242,0.55)',
    'rgba(220,193,242,0.50)',
    'rgba(255,211,182,0.40)',
    'rgba(185,155,230,0.45)',
    'rgba(240,220,255,0.35)',
  ],
  sage: [
    'rgba(142,212,180,0.55)',
    'rgba(168,230,207,0.50)',
    'rgba(220,237,193,0.45)',
    'rgba(100,190,155,0.40)',
    'rgba(200,240,220,0.35)',
  ],
};

// Deterministic "random" from seed for stable SSR/hydration
function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

const AmbientParticles = React.memo(function AmbientParticles({
  count = 12,
  palette = 'warm',
  active = false,
  style,
}: AmbientParticlesProps) {
  const colors = PALETTES[palette];

  const particles = useMemo<Particle[]>(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: `${5 + seededRandom(i * 3) * 90}%`,
      y: `${30 + seededRandom(i * 3 + 1) * 60}%`,
      size: 4 + seededRandom(i * 3 + 2) * 7,
      color: colors[i % colors.length],
      duration: (active ? 6 : 4) + seededRandom(i * 5) * 6,
      delay: seededRandom(i * 7) * 5,
      driftX: (seededRandom(i * 11) - 0.5) * 40,
    })), [count, palette, active]);

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 1,
        ...style,
      }}
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: p.color,
            willChange: 'transform, opacity',
          }}
          animate={{
            y: [0, -55 - p.size * 3, 0],
            x: [0, p.driftX, 0],
            opacity: [0, 0.85, 0],
            scale: [0.6, 1, 0.5],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
});

export default AmbientParticles;
