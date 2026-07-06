import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import HorizontalPetRail from '../components/HorizontalPetRail';
import HeartPawLogo from '../components/HeartPawLogo';
import AmbientParticles from '../components/AmbientParticles';
import WelcomeBack from '../components/WelcomeBack';

export default function Home() {
  const scrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => { scrollY.current = window.scrollY; };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      {/* ── CINEMATIC BACKGROUND ───────────────────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -2,
          overflow: 'hidden',
          /* Rich warm amber base — clearly warm, not white */
          background: 'linear-gradient(160deg, #ffeedd 0%, #ffded0 50%, #ffd5b8 100%)',
        }}
      >
        {/* Gold sun glow — top right */}
        <div style={{
          position: 'absolute', top: '-8%', right: '-8%',
          width: '65vw', height: '65vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(244,208,104,0.55) 0%, rgba(255,170,165,0.32) 45%, transparent 72%)',
          animation: 'ambient-drift 28s ease-in-out infinite',
          willChange: 'transform',
        }} />

        {/* Coral glow — bottom left */}
        <div style={{
          position: 'absolute', bottom: '-12%', left: '-10%',
          width: '55vw', height: '55vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,140,120,0.40) 0%, rgba(255,211,182,0.24) 50%, transparent 75%)',
          animation: 'ambient-drift 34s ease-in-out 6s infinite reverse',
          willChange: 'transform',
        }} />

        {/* Centre lens warmth */}
        <div style={{
          position: 'absolute', top: '20%', left: '35%',
          width: '32vw', height: '32vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,220,170,0.50) 0%, rgba(255,200,150,0.20) 50%, transparent 72%)',
          animation: 'lens-drift 22s ease-in-out 3s infinite',
          willChange: 'transform, opacity',
        }} />

        {/* ── BEAGLE — shows first (crossfade-bg-1) ──────────────────────── */}
        <img
          src="/assets/watermark_beagle.png"
          alt=""
          loading="eager"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            /* crossfade-bg-1: visible 0-40%, fade out 40-50%, hidden 50-90%, fade in 90-100% */
            animation: 'crossfade-bg-1 24s ease-in-out infinite, cinematic-pan 48s ease-in-out infinite alternate',
            filter: 'saturate(1.6) brightness(1.15) contrast(1.04)',
            willChange: 'opacity, transform',
          }}
        />

        {/* ── CAT — shows second (crossfade-bg-2) ────────────────────────── */}
        <img
          src="/assets/watermark_cat.png"
          alt=""
          loading="lazy"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            /* crossfade-bg-2: hidden 0-40%, fade in 40-50%, visible 50-90%, fade out 90-100% */
            animation: 'crossfade-bg-2 24s ease-in-out infinite, cinematic-zoom 48s ease-in-out infinite alternate-reverse',
            filter: 'saturate(1.5) brightness(1.12)',
            willChange: 'opacity, transform',
          }}
        />

        {/* Floating ambient particles */}
        <AmbientParticles count={12} palette="warm" />

        {/* Subtle edge vignette only — does NOT wash out centre */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 50% 50%, transparent 52%, rgba(180,120,80,0.14) 100%)',
          pointerEvents: 'none',
        }} />

        {/* Text contrast layer — a warm, deep scrim so white copy is ALWAYS legible,
            even over the brightest sky region of the photos */}
        <div style={{
          position: 'absolute', inset: 0,
          background:
            'linear-gradient(180deg, rgba(74,36,12,0.52) 0%, rgba(74,36,12,0.38) 26%, rgba(74,36,12,0.22) 48%, rgba(74,36,12,0.30) 78%, rgba(60,28,10,0.48) 100%)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* ── PAGE CONTENT ──────────────────────────────────────────────────── */}
      <div
        className="flex flex-col items-center text-center"
        style={{
          padding: 'clamp(1rem, 4vw, 2rem)',
          paddingTop: 'clamp(0.5rem, 3vh, 1.5rem)',
          minHeight: '100%',
          gap: 0,
        }}
      >
        {/* ── HERO LOGO ──────────────────────────────────────────────────── */}
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
            width: 100, height: 100,
          }}
        >
          <div style={{
            position: 'absolute', inset: -18, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.45) 0%, rgba(255,211,182,0.18) 55%, transparent 80%)',
            animation: 'hero-breathe 5s ease-in-out infinite',
            willChange: 'transform, opacity',
          }} />
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              filter: 'drop-shadow(0 8px 28px rgba(255,140,120,0.70))',
              zIndex: 1,
            }}
          >
            <HeartPawLogo size={84} />
          </motion.div>
          {[0, -12, -24].map((inset, i) => (
            <div key={i} style={{
              position: 'absolute', inset,
              borderRadius: '50%',
              border: `${1.8 - i * 0.3}px solid rgba(255,255,255,${0.55 - i * 0.16})`,
              animation: `soft-pulse 3s ease-in-out ${i * 0.9}s infinite`,
              pointerEvents: 'none',
            }} />
          ))}
        </motion.div>

        {/* ── TITLE — legible over any background ───────────────────────── */}
        <motion.h1
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
          style={{
            fontSize: 'clamp(2.6rem, 7vw, 4.2rem)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            /* Warm cream-white — readable, not cold, not faded */
            color: '#fff8f0',
            textShadow: '0 2px 28px rgba(200,90,30,0.60), 0 1px 6px rgba(0,0,0,0.28)',
            lineHeight: 1.1,
            marginBottom: 'clamp(0.5rem, 2vh, 1rem)',
          }}
        >
          Sense My Pet
        </motion.h1>

        {/* ── SUBTITLE — frosted pill for guaranteed contrast ────────────── */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
          style={{
            maxWidth: '540px',
            marginBottom: 'clamp(1.5rem, 5vh, 3rem)',
          }}
        >
          {/* Frosted glass pill around subtitle so it's always legible */}
          <div style={{
            background: 'rgba(64,32,14,0.34)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            border: '1px solid rgba(255,255,255,0.32)',
            borderRadius: '24px',
            padding: 'clamp(0.55rem, 1.5vh, 0.8rem) clamp(1.2rem, 4vw, 2rem)',
          }}>
            <p style={{
              fontSize: 'clamp(0.95rem, 2.2vw, 1.18rem)',
              color: '#fff4e8',
              lineHeight: 1.62,
              fontWeight: 500,
              margin: 0,
              textShadow: '0 1px 10px rgba(60,25,5,0.55)',
            }}>
              An emotionally intelligent AI companion. Discover your pet's true feelings through
              warm, empathetic listening and gentle observation.
            </p>
          </div>
        </motion.div>

        {/* ── RETURNING-VISITOR MOMENT (reason to revisit) ────────────────── */}
        <WelcomeBack />

        {/* ── HORIZONTAL SWIPEABLE RAIL ───────────────────────────────────── */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          style={{ width: '100%', marginBottom: 'clamp(2rem, 6vh, 4rem)' }}
        >
          <HorizontalPetRail />
        </motion.div>

        {/* ── FEATURE CARDS ─────────────────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
          gap: 'clamp(1rem, 3vw, 1.75rem)',
          width: '100%',
          maxWidth: '820px',
        }}>
          {[
            {
              icon: '🎙️',
              title: 'Warm Audio Sensing',
              desc: 'Gently listens to vocalizations and subtle breathing patterns to understand their comfort and emotional state.',
              accentColor: 'rgba(255,140,120,1)',
              gradientTop: 'rgba(84,42,20,0.42)',
              gradientBottom: 'rgba(110,52,26,0.34)',
              borderColor: 'rgba(255,255,255,0.35)',
              glowColor: 'rgba(255,140,120,0.25)',
              delay: 0.4,
            },
            {
              icon: '👁️',
              title: 'Gentle Observation',
              desc: 'Fluidly notices body language and posture to provide emotionally intelligent, real-time insights.',
              accentColor: 'rgba(126,203,168,1)',
              gradientTop: 'rgba(58,66,50,0.42)',
              gradientBottom: 'rgba(74,86,62,0.34)',
              borderColor: 'rgba(255,255,255,0.35)',
              glowColor: 'rgba(126,203,168,0.22)',
              delay: 0.5,
            },
          ].map((card) => (
            <motion.div
              key={card.title}
              whileHover={{ y: -8, boxShadow: `0 24px 56px ${card.glowColor}` }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: card.delay, duration: 0.65 }}
              style={{
                position: 'relative',
                background: `linear-gradient(160deg, ${card.gradientTop} 0%, ${card.gradientBottom} 100%)`,
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                border: `1.5px solid ${card.borderColor}`,
                borderRadius: '28px',
                padding: 'clamp(1.6rem, 4vw, 2.5rem)',
                textAlign: 'center',
                boxShadow: `0 8px 32px ${card.glowColor}, inset 0 1px 0 rgba(255,255,255,0.55)`,
                transition: 'box-shadow 0.4s ease, transform 0.4s ease',
                overflow: 'hidden',
              }}
            >
              {/* Top accent line */}
              <div style={{
                position: 'absolute', top: 0, left: '20%', right: '20%', height: '2.5px',
                background: `linear-gradient(90deg, transparent, ${card.accentColor}, transparent)`,
                borderRadius: '0 0 4px 4px',
              }} />

              {/* Icon container with glow */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 62, height: 62, borderRadius: '18px',
                background: `linear-gradient(135deg, ${card.gradientTop}, ${card.gradientBottom})`,
                boxShadow: `0 4px 18px ${card.glowColor}, inset 0 1px 0 rgba(255,255,255,0.65)`,
                marginBottom: '1rem',
                fontSize: '2rem',
                border: `1px solid ${card.borderColor}`,
              }}>
                {card.icon}
              </div>

              <h3 style={{
                fontSize: 'clamp(1.08rem, 2.4vw, 1.32rem)',
                color: '#fff8f0',
                marginBottom: '0.55rem',
                fontWeight: 700,
                textShadow: '0 1px 10px rgba(120,50,10,0.35)',
                letterSpacing: '-0.01em',
              }}>
                {card.title}
              </h3>
              <p style={{
                color: '#ffe9d6',
                fontSize: 'clamp(0.88rem, 1.9vw, 1rem)',
                lineHeight: 1.68,
                textShadow: '0 1px 8px rgba(60,25,5,0.45)',
                margin: 0,
              }}>
                {card.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Disclaimer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.65 }}
          transition={{ delay: 0.9 }}
          style={{
            fontSize: '0.82rem',
            color: '#ffedd9',
            marginTop: 'clamp(2rem, 6vh, 4rem)',
            maxWidth: '480px',
            lineHeight: 1.55,
            textShadow: '0 1px 8px rgba(60,25,5,0.55)',
            background: 'rgba(64,32,14,0.28)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: '14px',
            padding: '0.7rem 1rem',
          }}
        >
          Sense My Pet provides AI-assisted behavioural screening for dogs and cats — informational only,
          not a veterinary diagnosis, and never a replacement for professional veterinary care.
        </motion.p>
      </div>
    </>
  );
}
