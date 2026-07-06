import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import HeartPawLogo from '../components/HeartPawLogo';
import AmbientParticles from '../components/AmbientParticles';
import WelcomeBack from '../components/WelcomeBack';
import OwnerPetScene from '../components/OwnerPetScene';

export default function Home() {
  const navigate = useNavigate();

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

        {/* ── PRIMARY: TWO SPECIES CARDS (P2 — these must dominate) ───────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))',
          gap: 'clamp(0.9rem, 3vw, 1.5rem)',
          width: '100%',
          maxWidth: 640,
        }}>
          {([
            { species: 'dog' as const, title: 'Sense My Dog', to: '/dog-whisperer',
              grad: 'linear-gradient(155deg, rgba(255,140,107,0.92), rgba(244,180,90,0.88))',
              ring: 'rgba(255,140,107,0.5)', delay: 0.35 },
            { species: 'cat' as const, title: 'Sense My Cat', to: '/cat-whisperer',
              grad: 'linear-gradient(155deg, rgba(165,139,216,0.92), rgba(201,169,230,0.88))',
              ring: 'rgba(165,139,216,0.5)', delay: 0.45 },
          ]).map((c) => (
            <motion.button
              key={c.species}
              type="button"
              onClick={() => navigate(c.to)}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: c.delay, duration: 0.55 }}
              whileHover={{ y: -6, boxShadow: `0 24px 56px ${c.ring}` }}
              whileTap={{ scale: 0.97 }}
              id={`home-${c.species}-card`}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
                padding: 'clamp(1.4rem, 4vw, 2rem) 1rem 1.4rem',
                background: c.grad,
                border: '1.5px solid rgba(255,255,255,0.55)',
                borderRadius: 28,
                cursor: 'pointer',
                fontFamily: 'var(--font-family)',
                boxShadow: `0 14px 40px ${c.ring}, inset 0 1px 0 rgba(255,255,255,0.4)`,
                transition: 'box-shadow 0.35s ease',
              }}
            >
              <OwnerPetScene species={c.species} mood="calm" size={116} animate={false} />
              <span style={{
                fontSize: 'clamp(1.15rem, 3vw, 1.4rem)', fontWeight: 800, color: '#fff',
                letterSpacing: '-0.01em', textShadow: '0 1px 10px rgba(60,25,5,0.35)',
              }}>
                {c.title}
              </span>
              <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'rgba(255,255,255,0.92)' }}>
                Listen · Scan · Both
              </span>
            </motion.button>
          ))}
        </div>

        {/* ── SECONDARY: compact nav (accessible, visually quiet) ─────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          style={{ display: 'flex', gap: '0.65rem', marginTop: 'clamp(1.1rem, 3vh, 1.75rem)', flexWrap: 'wrap', justifyContent: 'center' }}
        >
          {[
            { label: 'My Scans', to: '/anxiety-tracker', icon: '🐾' },
            { label: 'Vet+', to: '/vet-plus', icon: '🩺' },
          ].map((n) => (
            <button
              key={n.to}
              type="button"
              onClick={() => navigate(n.to)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                background: 'rgba(255,255,255,0.22)',
                backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
                border: '1px solid rgba(255,255,255,0.42)',
                borderRadius: 999, padding: '0.55rem 1.3rem',
                fontSize: '0.9rem', fontWeight: 600, color: '#fff4e8', cursor: 'pointer',
                fontFamily: 'var(--font-family)', textShadow: '0 1px 6px rgba(60,25,5,0.4)',
              }}
            >
              <span aria-hidden>{n.icon}</span>{n.label}
            </button>
          ))}
        </motion.div>

        {/* ── MINIMAL TRUST LINE ──────────────────────────────────────────── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.9 }}
          transition={{ delay: 0.8 }}
          style={{
            fontSize: '0.78rem',
            color: '#ffedd9',
            marginTop: 'clamp(1.5rem, 4vh, 2.5rem)',
            maxWidth: 440,
            lineHeight: 1.55,
            textShadow: '0 1px 8px rgba(60,25,5,0.55)',
            background: 'rgba(64,32,14,0.28)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: 12,
            padding: '0.6rem 1rem',
          }}
        >
          🔒 Screening, not a diagnosis. All analysis runs on your device — your pet's audio
          and video are never uploaded.
        </motion.p>
      </div>
    </>
  );
}
