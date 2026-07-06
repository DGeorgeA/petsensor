import React from 'react';
import { motion } from 'framer-motion';
import { Info, PhoneCall } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ScreeningClass, ScreeningResult } from '../lib/screening';

interface Props {
  screening: ScreeningResult;
}

interface MeterConfig {
  tag: string;
  width: string;
  gradient: string;
  glow: string;
  tagColor: string;
  tagBg: string;
  showConfidence: boolean;
  showVet: boolean;
}

function getConfig(cls: ScreeningClass): MeterConfig {
  switch (cls) {
    case 'RELAXED':
      return { tag: 'Relaxed indicators', width: '22%', gradient: 'linear-gradient(90deg, #7ecba8, #a8e6cf)', glow: 'rgba(126,203,168,0.55)', tagColor: '#3a8c65', tagBg: 'rgba(126,203,168,0.12)', showConfidence: true, showVet: false };
    case 'POSSIBLE_STRESS':
      return { tag: 'Possible stress signals', width: '60%', gradient: 'linear-gradient(90deg, #f4c07a, #ffd3b6)', glow: 'rgba(244,192,122,0.55)', tagColor: '#9a6520', tagBg: 'rgba(244,192,122,0.12)', showConfidence: true, showVet: true };
    case 'POSSIBLE_ANXIETY':
      return { tag: 'Possible anxiety signals', width: '90%', gradient: 'linear-gradient(90deg, #ff9e8a, #ffbfaa)', glow: 'rgba(255,158,138,0.55)', tagColor: '#c05440', tagBg: 'rgba(255,158,138,0.12)', showConfidence: true, showVet: true };
    default: // INSUFFICIENT_EVIDENCE / UNSUPPORTED_SUBJECT
      return { tag: cls === 'UNSUPPORTED_SUBJECT' ? 'Unsupported subject' : 'Insufficient evidence', width: '8%', gradient: 'linear-gradient(90deg, #c9c2ba, #ddd6cd)', glow: 'rgba(160,150,140,0.45)', tagColor: '#6b6158', tagBg: 'rgba(160,150,140,0.12)', showConfidence: false, showVet: false };
  }
}

export default function AnxietyMeter({ screening }: Props) {
  const navigate = useNavigate();
  const cls = screening.screeningClass;
  const cfg = getConfig(cls);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{
        width: '100%',
        padding: 'clamp(1.5rem, 4vw, 2.5rem)',
        borderRadius: '24px',
        background: 'rgba(255,252,248,0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1.5px solid rgba(255,255,255,0.92)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.06)',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-dark)', marginBottom: '0.3rem' }}>
          Behavioural Screening Meter
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Class tag */}
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            background: cfg.tagBg, color: cfg.tagColor,
            borderRadius: '999px', padding: '0.25rem 0.75rem',
            fontSize: '0.78rem', fontWeight: 700,
            border: `1px solid ${cfg.glow}`,
          }}>
            {cfg.tag}
          </span>
          {/* Confidence */}
          {cfg.showConfidence && (
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              {(screening.confidence * 100).toFixed(0)}% confidence
            </span>
          )}
        </div>
      </div>

      {/* Meter Bar */}
      <div style={{
        position: 'relative', height: 14, borderRadius: '7px',
        background: 'rgba(0,0,0,0.05)', overflow: 'hidden',
        marginBottom: '0.45rem',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.07)',
      }}>
        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: cfg.width }}
          transition={{ duration: 1.4, ease: [0.34, 1.56, 0.64, 1] }}
          style={{
            position: 'absolute', left: 0, top: 0,
            height: '100%',
            background: cfg.gradient,
            borderRadius: '7px',
            boxShadow: `0 0 14px ${cfg.glow}`,
            animation: 'meter-glow-pulse 2.4s ease-in-out infinite',
          }}
        />
      </div>

      {/* Meter Labels */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: '0.72rem', fontWeight: 600,
        color: 'var(--color-text-muted)', marginBottom: '1.5rem',
      }}>
        <span style={{ color: cls === 'RELAXED' ? '#3a8c65' : undefined }}>RELAXED</span>
        <span style={{ color: cls === 'POSSIBLE_STRESS' ? '#9a6520' : undefined }}>STRESS</span>
        <span style={{ color: cls === 'POSSIBLE_ANXIETY' ? '#c05440' : undefined }}>ANXIETY</span>
      </div>

      {/* Screening detail */}
      <div style={{
        background: cfg.tagBg,
        borderRadius: '16px',
        padding: '1rem 1.1rem',
        marginBottom: '1.25rem',
        border: `1px solid ${cfg.glow}55`,
      }}>
        <p style={{
          fontSize: 'clamp(0.92rem, 2vw, 1.05rem)',
          color: 'var(--color-text-dark)',
          lineHeight: 1.65, fontWeight: 500,
          textAlign: 'center', margin: 0,
        }}>
          {screening.detail}
        </p>
      </div>

      {/* Disclaimer */}
      <div style={{
        background: 'rgba(126,203,168,0.08)', borderRadius: '12px',
        padding: '0.85rem 1rem',
        display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
        marginBottom: cfg.showVet ? '1.5rem' : 0,
      }}>
        <Info size={15} color="#7ecba8" style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.55, margin: 0 }}>
          AI-assisted behavioural screening based on observable sound and visual patterns. Results are
          informational only and are not a veterinary diagnosis. Behavioural signs may have many causes.
        </p>
      </div>

      {/* Vet+ CTA (only for stress/anxiety screenings) */}
      {cfg.showVet && (
        <motion.button
          whileHover={{
            scale: 1.025,
            boxShadow: '0 10px 32px rgba(255,140,120,0.45), 0 4px 12px rgba(0,0,0,0.08)',
          }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/vet-plus')}
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
            boxShadow: '0 6px 24px rgba(255,140,120,0.35), inset 0 1px 0 rgba(255,255,255,0.22)',
            position: 'relative', overflow: 'hidden',
            transition: 'box-shadow 0.3s ease',
          }}
        >
          {/* Shimmer */}
          <motion.div
            animate={{ x: ['-110%', '110%'] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }}
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
    </motion.div>
  );
}
