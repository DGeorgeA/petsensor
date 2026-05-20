import React from 'react';
import { motion } from 'framer-motion';
import HorizontalPetRail from '../components/HorizontalPetRail';

export default function Home() {
  return (
    <>
      {/* ── CINEMATIC BACKGROUND ────────────────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -2,
          overflow: 'hidden',
          background: 'linear-gradient(160deg, #fbf3ec 0%, #fdf7f0 60%, #ffecd9 100%)',
        }}
      >
        {/* Warm sunlight radial glow */}
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            right: '-10%',
            width: '60vw',
            height: '60vw',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(244, 208, 104, 0.18) 0%, rgba(255,170,165,0.08) 50%, transparent 75%)',
            willChange: 'transform',
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
            opacity: 0.22,
            filter: 'blur(3px) saturate(1.3) brightness(1.1)',
            animation: 'cinematic-pan 32s ease-in-out infinite alternate',
            willChange: 'transform',
          }}
        />
        {/* Cat watermark — gentle cross-dissolve zoom */}
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
            opacity: 0.12,
            filter: 'blur(2px) saturate(1.2)',
            animation: 'cinematic-zoom 26s ease-in-out infinite alternate-reverse',
            willChange: 'transform',
          }}
        />
        {/* Bottom vignette for warmth */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(251, 243, 236, 0.55) 100%)',
          }}
        />
      </div>

      {/* ── PAGE CONTENT ───────────────────────────────────────────────── */}
      <div
        className="flex flex-col items-center text-center"
        style={{
          padding: 'clamp(1rem, 4vw, 2rem)',
          paddingTop: 'clamp(0.5rem, 3vh, 1.5rem)',
          minHeight: '100%',
          gap: 0,
        }}
      >
        {/* Hero Heart */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ animation: 'breathe 6s ease-in-out infinite', marginBottom: 'clamp(0.75rem, 3vh, 1.5rem)' }}
        >
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, #ffaaa5, #ffd3b6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 12px rgba(255,170,165,0.12), 0 0 0 24px rgba(255,170,165,0.06)',
            filter: 'drop-shadow(0 4px 20px rgba(255,170,165,0.45))',
          }}>
            <span style={{ fontSize: '2rem' }}>🐾</span>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
          style={{
            fontSize: 'clamp(2.2rem, 7vw, 3.8rem)',
            fontWeight: 600,
            letterSpacing: '-0.035em',
            color: 'var(--color-text-dark)',
            lineHeight: 1.15,
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
            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
            color: 'var(--color-text-muted)',
            maxWidth: '560px',
            lineHeight: 1.65,
            fontWeight: 300,
            marginBottom: 'clamp(1.5rem, 5vh, 3rem)',
          }}
        >
          An emotionally intelligent AI companion. Discover your pet's true feelings through warm, empathetic listening and gentle observation.
        </motion.p>

        {/* ── HORIZONTAL SWIPEABLE RAIL ─────────────────────────────── */}
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
              desc: 'Gently listens to vocalizations and subtle breathing patterns to understand their comfort level.',
              color: '#ffaaa5',
              gradient: 'linear-gradient(135deg, rgba(255,170,165,0.18) 0%, rgba(255,211,182,0.12) 100%)',
              delay: 0.4,
            },
            {
              emoji: '👁️',
              title: 'Gentle Observation',
              desc: 'Fluidly notices body language and posture to provide emotionally intelligent insights.',
              color: '#a8e6cf',
              gradient: 'linear-gradient(135deg, rgba(168,230,207,0.18) 0%, rgba(220,237,193,0.12) 100%)',
              delay: 0.5,
            },
          ].map((card) => (
            <motion.div
              key={card.title}
              whileHover={{ y: -6, boxShadow: '0 20px 50px rgba(255,170,165,0.15)' }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: card.delay, duration: 0.6 }}
              style={{
                background: card.gradient,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1.5px solid rgba(255,255,255,0.75)',
                borderRadius: '24px',
                padding: 'clamp(1.5rem, 4vw, 2.5rem)',
                textAlign: 'center',
                transition: 'box-shadow 0.4s ease, transform 0.4s ease',
              }}
            >
              <div style={{
                fontSize: '2.2rem',
                marginBottom: '0.75rem',
                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.08))',
              }}>
                {card.emoji}
              </div>
              <h3 style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)', color: 'var(--color-text-dark)', marginBottom: '0.5rem', fontWeight: 600 }}>
                {card.title}
              </h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'clamp(0.9rem, 2vw, 1rem)', lineHeight: 1.6 }}>
                {card.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Disclaimer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.9 }}
          style={{
            fontSize: '0.85rem',
            color: 'var(--color-text-muted)',
            marginTop: 'clamp(2rem, 6vh, 4rem)',
            maxWidth: '480px',
            lineHeight: 1.5,
          }}
        >
          Sense My Pet is an AI-assisted wellness companion and does not replace professional veterinary care.
        </motion.p>
      </div>
    </>
  );
}
