import React, { useRef, useEffect, useState, useCallback } from 'react';
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

type VideoStatus = 'checking' | 'available' | 'unavailable';

export default function UnifiedSensingWindow({ isActive, animalType, rms, zcr, onVideoReady }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStatus, setVideoStatus] = useState<VideoStatus>('checking');
  const streamRef = useRef<MediaStream | null>(null);

  // ── CHECK VIDEO AVAILABILITY ON MOUNT ────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function checkVideo() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setVideoStatus('available');
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
          onVideoReady(videoRef.current);
        }
      } catch {
        if (!cancelled) setVideoStatus('unavailable');
      }
    }

    checkVideo();

    return () => {
      cancelled = true;
      // Stop camera tracks when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // When video element mounts after status becomes available
  useEffect(() => {
    if (videoStatus === 'available' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
      onVideoReady(videoRef.current);
    }
  }, [videoStatus]);

  const farImage = animalType === 'cat' ? '/assets/cat_connection_far.png' : '/assets/connection_far.png';
  const closeImage = animalType === 'cat' ? '/assets/cat_connection_close.png' : '/assets/connection_close.png';
  const accentColor = animalType === 'cat' ? 'rgba(220,193,242,0.5)' : 'rgba(255,170,165,0.5)';
  const animalEmoji = animalType === 'cat' ? '🐱' : animalType === 'horse' ? '🐴' : '🐶';

  return (
    // ── FULL-WIDTH IMMERSIVE SENSING AREA — NO ARTIFICIAL BOX ──────────
    <motion.div
      layout
      style={{
        width: '100%',
        position: 'relative',
        // No opaque background, no border, no padding box — full immersion
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* ── CINEMATIC BACKGROUND LAYER (full-width) ───────────────────── */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: 'clamp(220px, 38vw, 340px)',
          borderRadius: '28px',
          overflow: 'hidden',
        }}
      >
        <CinematicSensingBox
          farImageSrc={farImage}
          closeImageSrc={closeImage}
          isActive={isActive}
          isConnecting={false}
          label={animalType}
        />

        {/* ── FLOATING WAVEFORM — organic, not boxed ──────────────────── */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3,
            filter: `drop-shadow(0 0 16px ${accentColor})`,
          }}
        >
          <AudioVisualizer isListening={isActive} type={animalType} rms={rms} zcr={zcr} />
        </div>

        {/* ── CINEMATIC VIDEO INSET — glassmorphism, ambient glow ──────── */}
        <AnimatePresence>
          {videoStatus === 'available' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: isActive ? 1 : 0.6, scale: 1 }}
              exit={{ opacity: 0, scale: 0.88 }}
              transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
              style={{
                position: 'absolute',
                bottom: '1rem',
                right: '1rem',
                width: 'clamp(90px, 18vw, 160px)',
                aspectRatio: '4/3',
                borderRadius: '16px',
                overflow: 'hidden',
                zIndex: 5,
                // Glassmorphism frame
                border: '2px solid rgba(255,255,255,0.65)',
                boxShadow: `0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.25), 0 0 20px ${accentColor}`,
                // Ambient glow
                filter: `drop-shadow(0 0 12px ${accentColor})`,
                backdropFilter: 'blur(2px)',
              }}
            >
              {/* Glass rim overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 60%)',
                  zIndex: 2,
                  pointerEvents: 'none',
                  borderRadius: '14px',
                }}
              />
              <video
                ref={videoRef}
                muted
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── AUDIO-ONLY MODE INDICATOR (when camera unavailable) ───────── */}
        <AnimatePresence>
          {videoStatus === 'unavailable' && isActive && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                bottom: '1rem',
                right: '1rem',
                zIndex: 5,
                background: 'rgba(255,255,255,0.75)',
                backdropFilter: 'blur(12px)',
                borderRadius: '999px',
                padding: '0.4rem 0.9rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--color-text-dark)',
                letterSpacing: '0.04em',
                border: '1px solid rgba(255,255,255,0.9)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              }}
            >
              🎙️ Audio Sensing Only
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── STATUS CHIP ────────────────────────────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            top: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 6,
          }}
        >
          <AnimatePresence mode="wait">
            {isActive ? (
              <motion.div
                key="active"
                initial={{ opacity: 0, y: -8, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }}
                style={{
                  background: 'rgba(255,255,255,0.82)',
                  backdropFilter: 'blur(16px)',
                  borderRadius: '999px',
                  padding: '0.35rem 1rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--color-text-dark)',
                  letterSpacing: '0.04em',
                  border: '1px solid rgba(255,255,255,0.9)',
                  boxShadow: `0 4px 20px ${accentColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  whiteSpace: 'nowrap',
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#ff6b6b',
                    animation: 'soft-pulse 2s infinite',
                    flexShrink: 0,
                  }}
                />
                {animalEmoji} Emotional Sensing Active
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.75 }}
                exit={{ opacity: 0 }}
                style={{
                  background: 'rgba(255,255,255,0.55)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '999px',
                  padding: '0.35rem 1rem',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  color: 'var(--color-text-muted)',
                  border: '1px solid rgba(255,255,255,0.7)',
                  whiteSpace: 'nowrap',
                }}
              >
                {animalEmoji} Awaiting connection…
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
