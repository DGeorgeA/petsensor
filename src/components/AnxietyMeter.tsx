import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Info, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export type AnxietyLevel = 'LOW' | 'MODERATE' | 'HIGH';

interface Props {
  level: AnxietyLevel;
  conclusion: string;
  confidenceScore?: number;
}

export default function AnxietyMeter({ level, conclusion, confidenceScore }: Props) {
  const navigate = useNavigate();

  const getLevelConfig = (l: AnxietyLevel) => {
    switch (l) {
      case 'LOW': return { color: '#a8e6cf', label: 'Low', width: '25%' };
      case 'MODERATE': return { color: '#ffd3b6', label: 'Moderate', width: '60%' };
      case 'HIGH': return { color: '#ffaaa5', label: 'High', width: '100%' };
    }
  };

  const config = getLevelConfig(level);

  const handleSeekConsultation = () => {
    navigate('/wellness-studio?consultation=true');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{
        width: '100%',
        padding: 'clamp(1.5rem, 4vw, 2.5rem)',
        borderRadius: '24px',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.9)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.06)'
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-dark)', marginBottom: '0.25rem' }}>
          Emotional Anxiety Meter
        </h3>
        {confidenceScore && (
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Observation Confidence: {(confidenceScore * 100).toFixed(0)}%
          </p>
        )}
      </div>

      {/* Meter Bar */}
      <div style={{ position: 'relative', height: '12px', background: 'rgba(0,0,0,0.04)', borderRadius: '6px', overflow: 'hidden', marginBottom: '0.5rem' }}>
        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: config.width }}
          transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            background: config.color,
            borderRadius: '6px',
            boxShadow: `0 0 10px ${config.color}`
          }}
        />
      </div>

      {/* Meter Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
        <span style={{ color: level === 'LOW' ? '#a8e6cf' : 'inherit' }}>LOW</span>
        <span style={{ color: level === 'MODERATE' ? '#ffd3b6' : 'inherit' }}>MODERATE</span>
        <span style={{ color: level === 'HIGH' ? '#ffaaa5' : 'inherit' }}>HIGH</span>
      </div>

      {/* AI Conclusion */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '1.15rem', color: 'var(--color-text-dark)', lineHeight: 1.6, fontWeight: 500 }}>
          {conclusion}
        </p>
      </div>

      {/* Mandatory Disclaimer */}
      <div style={{ background: 'rgba(156,172,148,0.1)', borderRadius: '12px', padding: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <Info size={18} color="var(--color-sage-green)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
          Sense My Pet provides AI-assisted emotional insights and should not replace professional veterinary advice.
        </p>
      </div>

      {/* CTA Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleSeekConsultation}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: '1rem',
          background: 'var(--color-text-dark)',
          color: 'white',
          border: 'none',
          borderRadius: '14px',
          fontSize: '1rem',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
        }}
      >
        Seek Consultation <ArrowRight size={18} />
      </motion.button>
    </motion.div>
  );
}
