import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CinematicSensingBoxProps {
  farImageSrc: string;
  closeImageSrc: string;
  isActive: boolean; // true when listening/analyzing
  isConnecting: boolean; // true during analysis phase
  label?: string; // "Dog" | "Cat"
}

/**
 * Renders the cinematic owner-pet connection animation INSIDE the sensing box.
 * - Idle: Two "far" faces visible, separated, looking at each other
 * - Active: Cross-dissolve to "close" face image with warm glow between them
 */
export default function CinematicSensingBox({
  farImageSrc,
  closeImageSrc,
  isActive,
  isConnecting,
  label = 'Pet',
}: CinematicSensingBoxProps) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '200px',
        borderRadius: '18px',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #fdf3ec 0%, #ffecd9 100%)',
        marginBottom: '1rem',
      }}
    >
      {/* FAR image — visible when idle */}
      <motion.img
        src={farImageSrc}
        alt={`Owner and ${label} looking at each other`}
        loading="lazy"
        animate={{
          opacity: isActive ? 0 : 1,
          scale: isActive ? 1.06 : 1.0,
          filter: isActive ? 'blur(6px)' : 'blur(0px)',
        }}
        transition={{ duration: 1.6, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          willChange: 'transform, opacity',
        }}
      />

      {/* CLOSE image — revealed when active */}
      <motion.img
        src={closeImageSrc}
        alt={`Owner and ${label} emotionally bonded`}
        loading="lazy"
        animate={{
          opacity: isActive ? 1 : 0,
          scale: isActive ? 1.0 : 1.08,
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
        }}
      />

      {/* Warm glow overlay when connected */}
      <motion.div
        animate={{
          opacity: isActive && !isConnecting ? 1 : 0,
        }}
        transition={{ duration: 2.0, ease: 'easeInOut', delay: 0.8 }}
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at center, rgba(255, 211, 182, 0.5) 0%, rgba(255, 170, 165, 0.2) 50%, transparent 80%)',
          borderRadius: '18px',
          pointerEvents: 'none',
        }}
      />

      {/* Vignette frame to focus attention on the center */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(251, 247, 243, 0.35) 100%)',
          borderRadius: '18px',
          pointerEvents: 'none',
        }}
      />

      {/* Particle ambient effect when connected */}
      <AnimatePresence>
        {isActive && !isConnecting && (
          <>
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10, x: `${20 + i * 14}%` }}
                animate={{ opacity: [0, 0.8, 0], y: -40, scale: [1, 0.4] }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 2.5,
                  delay: i * 0.45,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
                style={{
                  position: 'absolute',
                  bottom: '20%',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--color-soft-gold)',
                  pointerEvents: 'none',
                  willChange: 'transform, opacity',
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Connecting label */}
      <AnimatePresence>
        {isConnecting && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.6 }}
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(255,255,255,0.75)',
              backdropFilter: 'blur(10px)',
              borderRadius: '999px',
              padding: '4px 16px',
              fontSize: '0.8rem',
              fontWeight: 500,
              color: 'var(--color-text-dark)',
              whiteSpace: 'nowrap',
              letterSpacing: '0.04em',
            }}
          >
            Sensing your {label}…
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connected label */}
      <AnimatePresence>
        {isActive && !isConnecting && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(255, 211, 182, 0.85)',
              backdropFilter: 'blur(10px)',
              borderRadius: '999px',
              padding: '4px 16px',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--color-text-dark)',
              whiteSpace: 'nowrap',
              letterSpacing: '0.04em',
            }}
          >
            ✨ Connection Active
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
