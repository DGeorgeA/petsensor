import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlipHorizontal } from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';
import CinematicSensingBox from './CinematicSensingBox';

interface Props {
  isActive: boolean;
  isReady: boolean;
  animalType: 'dog' | 'cat';
  rms: number;
  zcr: number;
  onVideoReady: (videoElement: HTMLVideoElement) => void;
}

type VideoStatus = 'idle' | 'checking' | 'available' | 'unavailable';

/** True on phones/tablets (has touch + likely has back camera) */
function isMobileDevice(): boolean {
  return (
    ('ontouchstart' in window || navigator.maxTouchPoints > 0) &&
    /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
  );
}

export default function UnifiedSensingWindow({
  isActive, isReady, animalType, rms, zcr, onVideoReady,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStatus, setVideoStatus] = useState<VideoStatus>('idle');
  const streamRef = useRef<MediaStream | null>(null);

  // Default: back camera on mobile, front camera on desktop
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(
    () => isMobileDevice() ? 'environment' : 'user'
  );

  // ── START / RESTART CAMERA ────────────────────────────────────────────────
  const startCamera = useCallback(async (mode: 'user' | 'environment', signal: { cancelled: boolean }) => {
    // Stop any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setVideoStatus('checking');

    try {
      const constraints: MediaStreamConstraints = {
        video: isMobileDevice()
          ? { facingMode: { ideal: mode } }
          : { facingMode: mode },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (signal.cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
      streamRef.current = stream;
      setVideoStatus('available');
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
        onVideoReady(videoRef.current);
      }
    } catch {
      if (!signal.cancelled) setVideoStatus('unavailable');
    }
  }, [onVideoReady]);

  // ── CAMERA LIFECYCLE — only when READY ───────────────────────────────────
  useEffect(() => {
    if (!isReady) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setVideoStatus('idle');
      }
      return;
    }
    const signal = { cancelled: false };
    startCamera(facingMode, signal);
    return () => {
      signal.cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [isReady]);

  // ── CAMERA FLIP ───────────────────────────────────────────────────────────
  const flipCamera = useCallback(() => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    if (isReady) {
      const signal = { cancelled: false };
      startCamera(newMode, signal);
    }
  }, [facingMode, isReady, startCamera]);

  // Re-attach stream when video element mounts after status change
  useEffect(() => {
    if (videoStatus === 'available' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
      onVideoReady(videoRef.current);
    }
  }, [videoStatus]);

  const accentColor =
    animalType === 'cat' ? 'rgba(200,175,242,0.5)' :
    'rgba(255,170,165,0.5)';
  const animalEmoji =
    animalType === 'cat' ? '🐱' : '🐶';

  const areaHeight = isActive
    ? 'clamp(320px, 52vw, 480px)'
    : isReady
    ? 'clamp(280px, 45vw, 420px)'
    : 'clamp(240px, 38vw, 360px)';

  return (
    <motion.div layout style={{ width: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <motion.div
        layout
        style={{ position: 'relative', width: '100%', borderRadius: '28px', overflow: 'hidden' }}
        animate={{ height: areaHeight }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* ── CINEMATIC BACKGROUND ─────────────────────────────────────── */}
        <motion.div
          style={{ position: 'absolute', inset: 0, zIndex: 1 }}
          animate={{
            opacity: isActive ? 0.18 : 1,
            filter: isActive ? 'blur(16px) brightness(0.5)' : 'blur(0px) brightness(1)',
          }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <CinematicSensingBox
            farImageSrc={animalType === 'cat' ? '/assets/cat_connection_far.png' : '/assets/connection_far.png'}
            closeImageSrc={animalType === 'cat' ? '/assets/cat_connection_close.png' : '/assets/connection_close.png'}
            isActive={isReady}
            isConnecting={false}
            label={animalType}
          />
        </motion.div>

        {/* ── LIVE VIDEO ───────────────────────────────────────────────── */}
        <AnimatePresence>
          {videoStatus === 'available' && (
            <motion.div
              key="video"
              initial={{ opacity: 0 }}
              animate={{
                opacity: isActive ? 0.96 : 0.55,
                filter: isActive ? 'brightness(1.06) saturate(1.1)' : 'brightness(0.95)',
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
              style={{ position: 'absolute', inset: 0, zIndex: 2, overflow: 'hidden' }}
            >
              {isActive && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.10)', zIndex: 2, pointerEvents: 'none' }} />
              )}
              <motion.div
                animate={{ boxShadow: isActive ? `inset 0 0 50px ${accentColor}, inset 0 0 20px rgba(255,255,255,0.08)` : 'inset 0 0 0px transparent' }}
                transition={{ duration: 1.5 }}
                style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none', borderRadius: '28px' }}
              />
              <video
                ref={videoRef}
                muted
                playsInline
                style={{
                  width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                  /* Mirror when using front camera so it feels natural; no mirror for back cam */
                  transform: facingMode === 'user' ? 'scaleX(-1)' : 'scaleX(1)',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CAMERA FLIP BUTTON ────────────────────────────────────────── */}
        <AnimatePresence>
          {videoStatus === 'available' && isReady && (
            <motion.button
              key="flip"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.3 }}
              onClick={flipCamera}
              title={facingMode === 'user' ? 'Switch to back camera' : 'Switch to front camera'}
              aria-label="Flip camera"
              style={{
                position: 'absolute',
                bottom: '1rem',
                left: '1rem',
                zIndex: 8,
                width: 40, height: 40,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.82)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: '1.5px solid rgba(255,255,255,0.92)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                color: '#4a403a',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.10)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
            >
              <FlipHorizontal size={18} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* ── AUDIO-ONLY BADGE ─────────────────────────────────────────── */}
        <AnimatePresence>
          {videoStatus === 'unavailable' && isActive && (
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{
                position: 'absolute', bottom: '1rem', right: '1rem', zIndex: 6,
                background: 'rgba(255,255,255,0.80)', backdropFilter: 'blur(12px)',
                borderRadius: '999px', padding: '0.4rem 0.9rem',
                fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-dark)',
                letterSpacing: '0.04em', border: '1px solid rgba(255,255,255,0.92)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              }}
            >
              🎙️ Audio Sensing Only
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── FLOATING WAVEFORM ────────────────────────────────────────── */}
        <motion.div
          style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4, pointerEvents: 'none' }}
          animate={{ filter: `drop-shadow(0 0 ${isActive ? 24 : 12}px ${accentColor})` }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            animate={{ scale: isActive ? 1.25 : 1 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            style={{ width: '100%', maxWidth: isActive ? 360 : 280 }}
          >
            <AudioVisualizer isListening={isActive} type={animalType} rms={rms} zcr={zcr} />
          </motion.div>
        </motion.div>

        {/* ── STATUS CHIP ──────────────────────────────────────────────── */}
        <div style={{ position: 'absolute', top: '1rem', left: '50%', transform: 'translateX(-50%)', zIndex: 6 }}>
          <AnimatePresence mode="wait">
            {isActive ? (
              <motion.div
                key="active"
                initial={{ opacity: 0, y: -8, scale: 0.88 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }}
                style={{
                  background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(18px)',
                  borderRadius: '999px', padding: '0.35rem 1.1rem',
                  fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-dark)',
                  letterSpacing: '0.04em', border: '1px solid rgba(255,255,255,0.95)',
                  boxShadow: `0 4px 24px ${accentColor}`,
                  display: 'flex', alignItems: 'center', gap: '0.45rem', whiteSpace: 'nowrap',
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5555', animation: 'soft-pulse 2s infinite', flexShrink: 0, boxShadow: '0 0 6px rgba(255,85,85,0.6)' }} />
                {animalEmoji} Emotional Sensing Active
              </motion.div>
            ) : isReady ? (
              <motion.div
                key="ready"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                style={{
                  background: 'rgba(255,255,255,0.70)', backdropFilter: 'blur(14px)',
                  borderRadius: '999px', padding: '0.35rem 1.1rem',
                  fontSize: '0.82rem', fontWeight: 500, color: 'var(--color-text-dark)',
                  border: `1px solid ${accentColor}`, boxShadow: `0 2px 12px ${accentColor}`, whiteSpace: 'nowrap',
                }}
              >
                {animalEmoji} Ready — tap Start to begin
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }} animate={{ opacity: 0.65 }} exit={{ opacity: 0 }}
                style={{
                  background: 'rgba(255,255,255,0.50)', backdropFilter: 'blur(10px)',
                  borderRadius: '999px', padding: '0.35rem 1.1rem',
                  fontSize: '0.8rem', fontWeight: 400, color: 'var(--color-text-muted)',
                  border: '1px solid rgba(255,255,255,0.65)', whiteSpace: 'nowrap',
                }}
              >
                {animalEmoji} Awaiting connection…
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
