import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import HorizontalPetRail from '../components/HorizontalPetRail';
import HeartPawLogo from '../components/HeartPawLogo';
import AmbientParticles from '../components/AmbientParticles';

export default function Home() {
  const scrollY = useRef(0);

  // Light parallax on hero logo — GPU only
  useEffect(() => {
    const onScroll = () => { scrollY.current = window.scrollY; };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      {/* ── CINEMATIC BACKGROUND — brighter, warmer, alive ───────────────── */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -2,
          overflow: 'hidden',
          background: 'linear-gradient(160deg, #ffeedd 0%, #ffded0 50%, #ffd5b8 100%)',
        }}
      >
        {/* Primary warm glow — top-right sun */}
        <div
          style={{
            position: 'absolute',
            top: '-8%',
            right: '-8%',
            width: '65vw',
            height: '65vw',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(244,208,104,0.58) 0%, rgba(255,170,165,0.36) 45%, transparent 72%)',
            animation: 'ambient-drift 28s ease-in-out infinite',
            willChange: 'transform',
          }}
        />

        {/* Secondary glow — bottom-left warmth */}
        <div
          style={{
            position: 'absolute',
            bottom: '-12%',
            left: '-10%',
            width: '55vw',
            height: '55vw',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(255,140,120,0.42) 0%, rgba(255,211,182,0.26) 50%, transparent 75%)',
            animation: 'ambient-drift 34s ease-in-out 6s infinite reverse',
            willChange: 'transform',
          }}
        />

        {/* Cinematic lens flare — centre */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '35%',
            width: '32vw',
            height: '32vw',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(255,220,170,0.55) 0%, rgba(255,200,150,0.22) 50%, transparent 72%)',
            animation: 'lens-drift 22s ease-in-out 3s infinite',
            willChange: 'transform, opacity',
          }}
        />

        {/* Beagle watermark — Ken Burns pan */}
        <img
          src="/assets/watermark_beagle.png"
          alt=""
          loading="lazy"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.58,
            filter: 'blur(1.5px) saturate(1.7) brightness(1.22) contrast(1.05)',
            animation: 'cinematic-pan 32s ease-in-out infinite alternate',
            willChange: 'transform',
          }}
        />
        {/* Cat watermark — cross-dissolve zoom */}
        <img
          src="/assets/watermark_cat.png"
          alt=""
          loading="lazy"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.30,
            filter: 'blur(1.5px) saturate(1.6) brightness(1.15)',
            animation: 'cinematic-zoom 26s ease-in-out infinite alternate-reverse',
            willChange: 'transform',
          }}
        />

        {/* Floating ambient particles */}
        <AmbientParticles count={14} palette="warm" />

        {/* Subtle edge vignette — keeps brightness, only darkens extreme edges */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(220,180,150,0.18) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* ── PAGE CONTENT ─────────────────────────────────────────────────── */}
      <div
        className="flex flex-col items-center text-center"
        style={{
          padding: 'clamp(1rem, 4vw, 2rem)',
          paddingTop: 'clamp(0.5rem, 3vh, 1.5rem)',
          minHeight: '100%',
          gap: 0,
        }}
      >
        {/* ── HERO LOGO with breathing ambient glow ──────────────────────── */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.34, 1.56, 0.64, 1] }}
          style={{
            marginBottom: 'clamp(0.75rem, 3vh, 1.5rem)',
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 100,
            height: 100,
          }}
        >
          {/* Ambient hero glow — breathes slowly */}
          <div
            style={{
              position: 'absolute',
              inset: -18,
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(255,170,165,0.38) 0%, rgba(255,211,182,0.18) 55%, transparent 80%)',
              animation: 'hero-breathe 5s ease-in-out infinite',
              willChange: 'transform, opacity',
            }}
          />

          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              filter: 'drop-shadow(0 8px 28px rgba(255,140,120,0.55))',
              zIndex: 1,
            }}
          >
            <HeartPawLogo size={84} />
          </motion.div>

          {/* Pulse rings */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '2px solid rgba(255,170,165,0.35)',
              animation: 'soft-pulse 3s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: -12,
              borderRadius: '50%',
              border: '1.5px solid rgba(255,170,165,0.18)',
              animation: 'soft-pulse 3s ease-in-out 0.9s infinite',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: -24,
              borderRadius: '50%',
              border: '1px solid rgba(255,170,165,0.09)',
              animation: 'soft-pulse 3s ease-in-out 1.8s infinite',
              pointerEvents: 'none',
            }}
          />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
          style={{
            fontSize: 'clamp(2.4rem, 7vw, 4rem)',
            fontWeight: 600,
            letterSpacing: '-0.038em',
            color: 'var(--color-text-dark)',
            lineHeight: 1.12,
            marginBottom: 'clamp(0.5rem, 2vh, 1rem)',
          }}
        >
          Sense My Pet
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
          style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.28rem)',
            color: 'var(--color-text-muted)',
            maxWidth: '560px',
            lineHeight: 1.68,
            fontWeight: 300,
            marginBottom: 'clamp(1.5rem, 5vh, 3rem)',
          }}
        >
          An emotionally intelligent AI companion. Discover your pet's true feelings through warm,
          empathetic listening and gentle observation.
        </motion.p>

        {/* ── HORIZONTAL SWIPEABLE RAIL ───────────────────────────────────── */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          style={{ width: '100%', marginBottom: 'clamp(2rem, 6vh, 4rem)' }}
        >
          <HorizontalPetRail />
        </motion.div>

        {/* Feature Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
            gap: 'clamp(1rem, 3vw, 2rem)',
            width: '100%',
            maxWidth: '860px',
          }}
        >
          {[
            {
              emoji: '🎙️',
              title: 'Warm Audio Sensing',
              desc:
                'Gently listens to vocalizations and subtle breathing patterns to understand their comfort level.',
              gradient: 'linear-gradient(135deg, rgba(255,170,165,0.22) 0%, rgba(255,211,182,0.15) 100%)',
              borderColor: 'rgba(255,170,165,0.30)',
              delay: 0.4,
            },
            {
              emoji: '👁️',
              title: 'Gentle Observation',
              desc:
                'Fluidly notices body language and posture to provide emotionally intelligent insights.',
              gradient: 'linear-gradient(135deg, rgba(168,230,207,0.22) 0%, rgba(220,237,193,0.15) 100%)',
              borderColor: 'rgba(168,230,207,0.30)',
              delay: 0.5,
            },
          ].map((card) => (
            <motion.div
              key={card.title}
              whileHover={{ y: -7, boxShadow: '0 22px 55px rgba(255,170,165,0.18)' }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: card.delay, duration: 0.6 }}
              style={{
                background: card.gradient,
                backdropFilter: 'blur(22px)',
                WebkitBackdropFilter: 'blur(22px)',
                border: `1.5px solid ${card.borderColor}`,
                borderRadius: '26px',
                padding: 'clamp(1.5rem, 4vw, 2.5rem)',
                textAlign: 'center',
                transition: 'box-shadow 0.4s ease, transform 0.4s ease',
              }}
            >
              <div
                style={{
                  fontSize: '2.4rem',
                  marginBottom: '0.8rem',
                  filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.10))',
                }}
              >
                {card.emoji}
              </div>
              <h3
                style={{
                  fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
                  color: 'var(--color-text-dark)',
                  marginBottom: '0.5rem',
                  fontWeight: 600,
                }}
              >
                {card.title}
              </h3>
              <p
                style={{
                  color: 'var(--color-text-muted)',
                  fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                  lineHeight: 1.65,
                }}
              >
                {card.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Disclaimer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.45 }}
          transition={{ delay: 0.9 }}
          style={{
            fontSize: '0.85rem',
            color: 'var(--color-text-muted)',
            marginTop: 'clamp(2rem, 6vh, 4rem)',
            maxWidth: '480px',
            lineHeight: 1.5,
          }}
        >
          Sense My Pet is an AI-assisted wellness companion and does not replace professional
          veterinary care.
        </motion.p>
      </div>
    </>
  );
}
