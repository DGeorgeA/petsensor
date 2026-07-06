import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AmbientParticles from './AmbientParticles';

interface CinematicSensingBoxProps {
  farImageSrc: string;
  closeImageSrc: string;
  isActive: boolean;
  isConnecting: boolean;
  label?: string;
  /** When true: dims+blurs this layer (live video has taken over) */
  isBackgrounded?: boolean;
  palette?: 'warm' | 'coral' | 'lavender' | 'sage';
}

export default function CinematicSensingBox({
  farImageSrc,
  closeImageSrc,
  isActive,
  isConnecting,
  label = 'Pet',
  isBackgrounded = false,
  palette = 'warm',
}: CinematicSensingBoxProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(160deg, #fff5ee 0%, #fff0e6 50%, #ffe8d5 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Ambient floating particles — slowed when backgrounded */}
      <AmbientParticles
        count={14}
        palette={palette}
        active={isBackgrounded}
        style={{ zIndex: 1 }}
      />

      {/* FAR image — visible when idle */}
      <motion.img
        src={farImageSrc}
        alt={`Owner and ${label} looking at each other`}
        loading="lazy"
        animate={{
          opacity: isActive ? 0 : 0.92,
          scale: isActive ? 1.08 : 1.0,
          filter: isActive ? 'blur(8px) brightness(0.9)' : 'blur(0px) brightness(1.05)',
        }}
        transition={{ duration: 1.6, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          willChange: 'transform, opacity',
          zIndex: 2,
        }}
      />

      {/* CLOSE image — revealed when active */}
      <motion.img
        src={closeImageSrc}
        alt={`Owner and ${label} emotionally bonded`}
        loading="lazy"
        animate={{
          opacity: isActive ? 1 : 0,
          scale: isActive ? 1.0 : 1.1,
          filter: isConnecting ? 'blur(4px)' : 'blur(0px)',
        }}
        transition={{ duration: 1.8, ease: [0.4, 0, 0.2, 1], delay: isConnecting ? 0.3 : 0 }}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          willChange: 'transform, opacity',
          zIndex: 2,
        }}
      />

      {/* Warm radial glow when connected */}
      <motion.div
        animate={{
          opacity: isActive && !isConnecting ? 1 : 0,
        }}
        transition={{ duration: 2.2, ease: 'easeInOut', delay: 0.6 }}
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at center, rgba(255,211,182,0.55) 0%, rgba(255,170,165,0.22) 50%, transparent 80%)',
          pointerEvents: 'none',
          zIndex: 3,
        }}
      />

      {/* Ambient lens-glow */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          right: '-15%',
          width: '55%',
          height: '55%',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(244,208,104,0.22) 0%, rgba(255,170,165,0.10) 55%, transparent 80%)',
          animation: 'lens-drift 20s ease-in-out infinite',
          willChange: 'transform',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Vignette focus */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at center, transparent 35%, rgba(255,245,238,0.30) 100%)',
          pointerEvents: 'none',
          zIndex: 4,
        }}
      />

      {/* Particles when connected */}
      <AnimatePresence>
        {isActive && !isConnecting && (
          <>
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12, x: `${6 + i * 8}%` }}
                animate={{ opacity: [0, 0.9, 0], y: -55, scale: [1, 0.35] }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 3.0,
                  delay: i * 0.38,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
                style={{
                  position: 'absolute',
                  bottom: '18%',
                  width: 5 + (i % 3) * 2,
                  height: 5 + (i % 3) * 2,
                  borderRadius: '50%',
                  background: i % 3 === 0
                    ? 'var(--color-soft-gold)'
                    : i % 3 === 1
                    ? 'var(--color-sunset-coral)'
                    : 'var(--color-peach)',
                  pointerEvents: 'none',
                  willChange: 'transform, opacity',
                  zIndex: 5,
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Connected label */}
      <AnimatePresence>
        {isActive && !isConnecting && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            style={{
              position: 'absolute',
              bottom: '14px',
              /* margin-based centering: framer-motion owns `transform`, so a
                 translateX(-50%) here would be overwritten and the badge would
                 clip off the right edge of the card */
              left: 0,
              right: 0,
              width: 'fit-content',
              margin: '0 auto',
              background: 'rgba(255, 211, 182, 0.92)',
              backdropFilter: 'blur(12px)',
              borderRadius: '999px',
              padding: '5px 18px',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--color-text-dark)',
              whiteSpace: 'nowrap',
              letterSpacing: '0.05em',
              boxShadow: '0 2px 12px rgba(255,170,165,0.35)',
              zIndex: 6,
            }}
          >
            ✨ Connection Active
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
