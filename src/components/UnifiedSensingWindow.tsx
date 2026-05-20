import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AudioVisualizer from './AudioVisualizer';
import CinematicSensingBox from './CinematicSensingBox';

interface Props {
  isActive: boolean;
  animalType: 'dog' | 'cat' | 'horse';
  rms: number;
  zcr: number;
  onVideoReady: (videoElement: HTMLVideoElement) => void;
}

export default function UnifiedSensingWindow({ isActive, animalType, rms, zcr, onVideoReady }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      onVideoReady(videoRef.current);
    }
  }, [videoRef, onVideoReady]);

  const farImage = animalType === 'cat' ? '/assets/cat_connection_far.png' : '/assets/connection_far.png';
  const closeImage = animalType === 'cat' ? '/assets/cat_connection_close.png' : '/assets/connection_close.png';
  const labelColor = animalType === 'cat' ? '#7c5a8e' : '#c0665e';

  return (
    <motion.div
      layout
      style={{
        width: '100%',
        position: 'relative',
        borderRadius: '28px',
        padding: 'clamp(1.5rem, 4vw, 2.5rem)',
        background: 'rgba(255, 255, 255, 0.75)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1.5px solid rgba(255,255,255,0.9)',
        boxShadow: isActive ? `0 12px 48px ${animalType === 'cat' ? 'rgba(220,193,242,0.3)' : 'rgba(255,170,165,0.25)'}` : `0 8px 32px ${animalType === 'cat' ? 'rgba(220,193,242,0.15)' : 'rgba(255,170,165,0.1)'}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        transition: 'box-shadow 0.6s ease'
      }}
    >
      <h3 className="text-center" style={{ color: labelColor, marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600, letterSpacing: '0.02em' }}>
        {animalType === 'cat' ? '🐱 ' : '🐶 '}Complete Emotional Analysis
      </h3>

      <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {/* Layer 1: The warm cinematic box background */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 0 }}>
          <CinematicSensingBox
            farImageSrc={farImage}
            closeImageSrc={closeImage}
            isActive={isActive}
            isConnecting={false}
            label=""
          />
        </div>

        {/* Layer 2: PIP Live Camera Feed (elegantly blended when active) */}
        <motion.div
          animate={{
            opacity: isActive ? 0.35 : 0,
            scale: isActive ? 1 : 0.9,
            filter: 'blur(1px) contrast(1.1) grayscale(0.2)'
          }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            overflow: 'hidden',
            zIndex: 1,
            pointerEvents: 'none',
            border: '2px solid rgba(255,255,255,0.3)',
            boxShadow: '0 0 20px rgba(0,0,0,0.1) inset'
          }}
        >
          <video
            ref={videoRef}
            muted
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </motion.div>

        {/* Layer 3: Audio Visualizer overlaying everything seamlessly */}
        <div style={{ zIndex: 2, position: 'relative', filter: 'drop-shadow(0 4px 12px rgba(255,255,255,0.5))' }}>
          <AudioVisualizer isListening={isActive} type={animalType} rms={rms} zcr={zcr} />
        </div>
      </div>

      {/* Status Indicator */}
      <div style={{ height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '1rem 0' }}>
        <AnimatePresence mode="wait">
          {isActive ? (
            <motion.div
              key="active"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{
                color: labelColor, fontWeight: 600, fontSize: '1.05rem',
                textShadow: `0 0 12px ${animalType === 'cat' ? 'rgba(220,193,242,0.8)' : 'rgba(255,170,165,0.8)'}`,
                animation: 'pulse 2s infinite'
              }}
            >
              Unified Sensing Active
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }} style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
              Awaiting multi-modal connection…
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </motion.div>
  );
}
