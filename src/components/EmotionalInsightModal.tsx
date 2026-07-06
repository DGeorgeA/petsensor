import React, { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, PhoneCall } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ScreeningClass, ScreeningResult } from '../lib/screening';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  screening: ScreeningResult;
}

// ── CLASS CONFIG (cautious screening, never diagnostic) ─────────────────────────
interface ClassConfig {
  tag: string;
  emoji: string;
  fillPct: number;
  showConfidence: boolean;
  showVet: boolean;
  barGradient: string;
  glowColor: string;
  accentColor: string;
  tagBg: string;
  tagColor: string;
}

function getClassConfig(cls: ScreeningClass): ClassConfig {
  switch (cls) {
    case 'RELAXED':
      return {
        tag: 'Relaxed indicators', emoji: '😌', fillPct: 22,
        showConfidence: true, showVet: false,
        barGradient: 'linear-gradient(90deg, #7ecba8, #a8e6cf)',
        glowColor: 'rgba(126,203,168,0.70)', accentColor: '#7ecba8',
        tagBg: 'rgba(126,203,168,0.15)', tagColor: '#3a8c65',
      };
    case 'POSSIBLE_STRESS':
      return {
        tag: 'Possible stress signals', emoji: '😐', fillPct: 60,
        showConfidence: true, showVet: true,
        barGradient: 'linear-gradient(90deg, #f4c07a, #ffd3b6)',
        glowColor: 'rgba(244,192,122,0.65)', accentColor: '#f4c07a',
        tagBg: 'rgba(244,192,122,0.15)', tagColor: '#9a6520',
      };
    case 'POSSIBLE_ANXIETY':
      return {
        tag: 'Possible anxiety signals', emoji: '😟', fillPct: 90,
        showConfidence: true, showVet: true,
        barGradient: 'linear-gradient(90deg, #ff9e8a, #ffbfaa)',
        glowColor: 'rgba(255,158,138,0.65)', accentColor: '#ff9e8a',
        tagBg: 'rgba(255,158,138,0.15)', tagColor: '#c05440',
      };
    case 'UNSUPPORTED_SUBJECT':
      return {
        tag: 'Unsupported subject', emoji: '🐾', fillPct: 0,
        showConfidence: false, showVet: false,
        barGradient: 'linear-gradient(90deg, #c9c2ba, #ddd6cd)',
        glowColor: 'rgba(160,150,140,0.5)', accentColor: '#a89e93',
        tagBg: 'rgba(160,150,140,0.14)', tagColor: '#6b6158',
      };
    case 'INSUFFICIENT_EVIDENCE':
    default:
      return {
        tag: 'Insufficient evidence', emoji: '🔍', fillPct: 8,
        showConfidence: false, showVet: false,
        barGradient: 'linear-gradient(90deg, #c9c2ba, #ddd6cd)',
        glowColor: 'rgba(160,150,140,0.5)', accentColor: '#a89e93',
        tagBg: 'rgba(160,150,140,0.14)', tagColor: '#6b6158',
      };
  }
}

// ── CONFIDENCE COUNT-UP HOOK ──────────────────────────────────────────────────
function useCountUp(target: number, durationMs = 1200, startDelay = 400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const delay = setTimeout(() => {
      const steps = 48;
      const interval = durationMs / steps;
      let step = 0;
      const timer = setInterval(() => {
        step++;
        setValue(Math.round((target * step) / steps));
        if (step >= steps) clearInterval(timer);
      }, interval);
      return () => clearInterval(timer);
    }, startDelay);
    return () => clearTimeout(delay);
  }, [target, durationMs, startDelay]);
  return value;
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default React.memo(function EmotionalInsightModal({
  isOpen, onClose, screening,
}: Props) {
  const navigate = useNavigate();
  const cls = screening.screeningClass;
  const cfg = getClassConfig(cls);
  const confidencePct = Math.round(screening.confidence * 100);
  const displayConfidence = useCountUp(confidencePct, 1200, 600);

  // ── AUTO-DISMISS LOGIC ───────────────────────────────────────────────────
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startDismissTimer = useCallback((delay = 4500) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(onClose, delay);
  }, [onClose]);

  const pauseTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const resumeTimer = useCallback(() => {
    startDismissTimer(2500);
  }, [startDismissTimer]);

  useEffect(() => {
    if (isOpen) startDismissTimer(4500);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isOpen, startDismissTimer]);

  const handleVetPlus = useCallback(() => {
    onClose();
    navigate('/vet-plus');
  }, [navigate, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── CINEMATIC BACKDROP ─────────────────────────────────────── */}
          <motion.div
            key="insight-backdrop"
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(18px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 200,
              background: 'rgba(60, 40, 30, 0.38)',
              WebkitBackdropFilter: 'blur(18px)',
              cursor: 'pointer',
            }}
          />

          {/* ── FLOATING MODAL CARD ────────────────────────────────────── */}
          <motion.div
            key="insight-card"
            role="dialog"
            aria-modal="true"
            aria-label="Behavioural screening result"
            onMouseEnter={pauseTimer}
            onMouseLeave={resumeTimer}
            onTouchStart={pauseTimer}
            onTouchEnd={resumeTimer}
            initial={{ opacity: 0, scale: 0.88, y: 28, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.93, y: 16, filter: 'blur(6px)' }}
            transition={{ type: 'spring', damping: 22, stiffness: 290, mass: 0.85 }}
            style={{
              position: 'fixed',
              zIndex: 201,

              ...(window.innerWidth >= 640
                ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
                : { bottom: '1.25rem', left: '0.85rem', right: '0.85rem' }),

              width: window.innerWidth >= 640 ? 'min(480px, 88vw)' : undefined,

              background:
                'linear-gradient(160deg, rgba(255,252,248,0.97) 0%, rgba(255,240,230,0.95) 100%)',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              borderRadius: '28px',
              border: '1.5px solid rgba(255,255,255,0.92)',
              boxShadow: `
                0 32px 80px rgba(60,30,10,0.18),
                0 8px 24px rgba(60,30,10,0.10),
                0 0 0 1px rgba(255,220,195,0.35),
                inset 0 1px 0 rgba(255,255,255,0.85)
              `,
              overflow: 'hidden',
              willChange: 'transform, opacity',
            }}
          >
            {/* ── AMBIENT GLOW TOP ─────────────────────────────────── */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
              background: `radial-gradient(ellipse at 50% 0%, ${cfg.glowColor} 0%, transparent 70%)`,
              opacity: 0.45, pointerEvents: 'none', zIndex: 0,
            }} />

            {/* ── CONTENT ──────────────────────────────────────────── */}
            <div style={{ position: 'relative', zIndex: 1, padding: 'clamp(1.4rem, 4vw, 2rem)' }}>

              {/* ── CLOSE BUTTON ─────────────────────────────────── */}
              <motion.button
                whileHover={{ scale: 1.12, boxShadow: `0 0 16px ${cfg.glowColor}` }}
                whileTap={{ scale: 0.94 }}
                onClick={onClose}
                aria-label="Close"
                style={{
                  position: 'absolute', top: '1rem', right: '1rem',
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.85)',
                  border: `1.5px solid ${cfg.accentColor}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#7a6058',
                  boxShadow: `0 2px 10px ${cfg.glowColor}`,
                  transition: 'box-shadow 0.2s ease',
                  zIndex: 2,
                }}
              >
                <X size={15} />
              </motion.button>

              {/* ── HEADER ───────────────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.4 }}
                style={{ textAlign: 'center', marginBottom: '1.4rem', paddingRight: '2rem' }}
              >
                <div style={{ fontSize: '2.2rem', marginBottom: '0.4rem' }}>{cfg.emoji}</div>
                <h2 style={{
                  fontSize: 'clamp(1.15rem, 3vw, 1.4rem)',
                  fontWeight: 700,
                  color: 'var(--color-text-dark)',
                  letterSpacing: '-0.02em',
                  margin: 0,
                }}>
                  {screening.headline}
                </h2>
                <p style={{
                  fontSize: '0.82rem', color: 'var(--color-text-muted)',
                  marginTop: '0.3rem', margin: '0.3rem 0 0',
                }}>
                  On-device behavioural screening · not a diagnosis
                </p>
              </motion.div>

              {/* ── CLASS TAG + CONFIDENCE ─────────────────────────── */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.22, duration: 0.4 }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: '0.85rem',
                }}
              >
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                  background: cfg.tagBg,
                  color: cfg.tagColor,
                  borderRadius: '999px',
                  padding: '0.3rem 0.9rem',
                  fontSize: '0.82rem', fontWeight: 700,
                  border: `1px solid ${cfg.accentColor}44`,
                }}>
                  {cfg.tag}
                </span>
                {cfg.showConfidence && (
                  <span style={{
                    fontSize: '0.88rem', fontWeight: 700,
                    color: cfg.tagColor,
                    letterSpacing: '-0.01em',
                  }}>
                    {displayConfidence}% confidence
                  </span>
                )}
              </motion.div>

              {/* ── ANIMATED METER BAR ─────────────────────────────── */}
              <div style={{
                position: 'relative', height: 14, borderRadius: '7px',
                background: 'rgba(0,0,0,0.06)',
                overflow: 'hidden', marginBottom: '0.5rem',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08)',
              }}>
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: `${cfg.fillPct}%` }}
                  transition={{ delay: 0.3, duration: 1.4, ease: [0.34, 1.56, 0.64, 1] }}
                  style={{
                    position: 'absolute', top: 0, left: 0,
                    height: '100%',
                    background: cfg.barGradient,
                    borderRadius: '7px',
                    boxShadow: `0 0 12px ${cfg.glowColor}`,
                    animation: 'meter-glow-pulse 2.4s ease-in-out infinite',
                  }}
                />
              </div>

              {/* Meter tick labels */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: '0.72rem', fontWeight: 600,
                color: 'var(--color-text-muted)', marginBottom: '1.4rem',
              }}>
                <span style={{ color: cls === 'RELAXED' ? '#3a8c65' : undefined }}>RELAXED</span>
                <span style={{ color: cls === 'POSSIBLE_STRESS' ? '#9a6520' : undefined }}>STRESS</span>
                <span style={{ color: cls === 'POSSIBLE_ANXIETY' ? '#c05440' : undefined }}>ANXIETY</span>
              </div>

              {/* ── DETAIL ───────────────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                style={{
                  background: `linear-gradient(135deg, ${cfg.tagBg}, rgba(255,252,248,0.6))`,
                  border: `1px solid ${cfg.accentColor}33`,
                  borderRadius: '16px',
                  padding: '1rem 1.1rem',
                  marginBottom: '1.1rem',
                }}
              >
                <p style={{
                  fontSize: 'clamp(0.92rem, 2.2vw, 1.05rem)',
                  color: 'var(--color-text-dark)',
                  lineHeight: 1.65,
                  fontWeight: 500,
                  margin: 0,
                  textAlign: 'center',
                }}>
                  {screening.detail}
                </p>
              </motion.div>

              {/* ── DISCLAIMER ──────────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.48, duration: 0.4 }}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
                  background: 'rgba(126,203,168,0.08)',
                  borderRadius: '12px', padding: '0.75rem 0.85rem',
                  marginBottom: '1.3rem',
                }}
              >
                <Info size={15} color="#7ecba8" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{
                  fontSize: '0.78rem', color: 'var(--color-text-muted)',
                  lineHeight: 1.55, margin: 0,
                }}>
                  AI-assisted behavioural screening based on observable sound and visual patterns.
                  Results are informational only and are not a veterinary diagnosis. If you are concerned
                  about your pet's health or behaviour, consult a qualified veterinarian.
                </p>
              </motion.div>

              {/* ── VET+ CTA (only for stress/anxiety screenings) ── */}
              {cfg.showVet && (
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55, duration: 0.4 }}
                  whileHover={{
                    scale: 1.025,
                    boxShadow: '0 10px 32px rgba(255,140,120,0.45), 0 4px 12px rgba(0,0,0,0.08)',
                  }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleVetPlus}
                  style={{
                    width: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.55rem',
                    padding: '0.95rem 1.5rem',
                    background: 'linear-gradient(135deg, #ff9e8a 0%, #ff7e6a 50%, #e8685a 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '16px',
                    fontSize: 'clamp(0.94rem, 2.2vw, 1.05rem)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    letterSpacing: '0.01em',
                    boxShadow: '0 6px 24px rgba(255,140,120,0.38), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.22)',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'box-shadow 0.3s ease',
                  }}
                >
                  {/* Shimmer sweep */}
                  <motion.div
                    animate={{ x: ['-110%', '110%'] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'linear', repeatDelay: 1.2 }}
                    style={{
                      position: 'absolute', top: 0, left: 0,
                      width: '60%', height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)',
                      transform: 'skewX(-18deg)',
                      pointerEvents: 'none',
                    }}
                  />
                  <PhoneCall size={18} style={{ flexShrink: 0 }} />
                  Talk to a vet — Vet+
                </motion.button>
              )}

              {/* Auto-dismiss hint */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.42 }}
                transition={{ delay: 1.0 }}
                style={{
                  textAlign: 'center', fontSize: '0.72rem',
                  color: 'var(--color-text-muted)', marginTop: '0.75rem', marginBottom: 0,
                }}
              >
                Tap anywhere outside to dismiss
              </motion.p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});
