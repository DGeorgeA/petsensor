import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Square, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AudioVisualizer from '../components/AudioVisualizer';
import CameraView from '../components/CameraView';
import AmbientParticles from '../components/AmbientParticles';
import HeartPawLogo from '../components/HeartPawLogo';
import { UnifiedSensingEngine, type UnifiedResult } from '../lib/unifiedEngine';
import { speakDetection, resetVoiceGuards } from '../lib/voice';
import EmotionalMeter from '../components/EmotionalMeter';
import ParticleHourglass from '../components/ParticleHourglass';

type PageState = 'IDLE' | 'READY' | 'ACTIVE' | 'RESULTS';

export default function HorseWhisperer() {
  const [pageState, setPageState] = useState<PageState>('IDLE');
  const [isPremium, setIsPremium] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [rms, setRms] = useState(0);
  const [zcr, setZcr] = useState(0);
  const [audioEmotion, setAudioEmotion] = useState<{
    label: string; confidence: number;
    level: 'LOW' | 'MEDIUM' | 'HIGH'; message: string;
  } | null>(null);
  const [postureEmotion, setPostureEmotion] = useState<{
    label: string; confidence: number; details: string; level: 'LOW' | 'MEDIUM' | 'HIGH';
  } | null>(null);

  const engineRef = useRef<UnifiedSensingEngine | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);

  // Transition to READY 400ms after mount
  useEffect(() => {
    const t = setTimeout(() => setPageState('READY'), 400);
    return () => clearTimeout(t);
  }, []);

  // Engine lifecycle
  useEffect(() => {
    if (pageState === 'ACTIVE') {
      resetVoiceGuards();
      const engine = new UnifiedSensingEngine('horse', (result: UnifiedResult) => {
        setRms(result.rms);
        setZcr(result.zcr);
        if (result.audio) {
          const level: 'LOW' | 'MEDIUM' | 'HIGH' =
            result.audio.level === 'HIGH' ? 'HIGH' :
            result.audio.level === 'MODERATE' ? 'MEDIUM' : 'LOW';
          setAudioEmotion({
            label: result.audio.label,
            confidence: result.audio.similarity,
            level,
            message: result.audio.message,
          });
          speakDetection(result.audio.message, result.audio.key, 'en');
        }
        if (result.video?.posture) {
          const p = result.video.posture;
          const lvl: 'LOW' | 'MEDIUM' | 'HIGH' =
            p.level === 'HIGH' ? 'HIGH' : p.level === 'MODERATE' ? 'MEDIUM' : 'LOW';
          setPostureEmotion({ label: p.label, confidence: p.confidence, details: p.details, level: lvl });
        }
      });
      engineRef.current = engine;
      const dummyVideo = videoElRef.current ?? document.createElement('video');
      engine.start(dummyVideo).catch((err) => console.error('Horse engine failed:', err));
    } else {
      if (engineRef.current) {
        engineRef.current.stop();
        engineRef.current = null;
      }
      if (pageState !== 'RESULTS') {
        setRms(0); setZcr(0);
      }
      if (pageState === 'READY' || pageState === 'IDLE') {
        setAudioEmotion(null);
      }
    }
    return () => { engineRef.current?.stop(); };
  }, [pageState]);

  const handleCTA = useCallback(() => {
    if (pageState === 'READY') {
      setPageState('ACTIVE');
    } else if (pageState === 'ACTIVE') {
      setPageState('RESULTS');
    } else if (pageState === 'RESULTS') {
      setAudioEmotion(null);
      setPostureEmotion(null);
      setPageState('READY');
    }
  }, [pageState]);

  const handlePostureUpdate = useCallback((posture: any) => {
    let level: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (posture.label.includes('Fearful') || posture.label.includes('Pacing')) level = 'HIGH';
    else if (posture.label.includes('Standing')) level = 'MEDIUM';
    setPostureEmotion({ ...posture, level });
  }, []);

  const isActive = pageState === 'ACTIVE';

  return (
    <>
      {/* ── CINEMATIC BACKGROUND — sage/gold horse palette ────────────────── */}
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0, zIndex: -2, overflow: 'hidden',
          background: 'linear-gradient(160deg, #f0fbf5 0%, #edf7f2 55%, #e5f5eb 100%)',
        }}
      >
        <div style={{
          position: 'absolute', top: '-12%', right: '-10%',
          width: '58vw', height: '58vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(142,212,180,0.26) 0%, rgba(220,237,193,0.12) 50%, transparent 74%)',
          animation: 'ambient-drift 28s ease-in-out infinite',
          willChange: 'transform',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', left: '-8%',
          width: '46vw', height: '46vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168,230,207,0.20) 0%, rgba(244,208,104,0.10) 55%, transparent 78%)',
          animation: 'ambient-drift 34s ease-in-out 8s infinite reverse',
          willChange: 'transform',
        }} />
        <AmbientParticles count={10} palette="sage" />
        {/* Vignette veil */}
        <motion.div
          animate={{ opacity: isActive ? 0.88 : 0.50 }}
          transition={{ duration: 2.0 }}
          style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 50% 40%, rgba(240,251,245,0.25) 0%, rgba(240,251,245,0.90) 100%)',
          }}
        />
      </div>

      {/* ── PAGE CONTENT ──────────────────────────────────────────────────────── */}
      <div
        className="flex flex-col items-center"
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: 'clamp(0.5rem, 3vw, 2rem) clamp(1rem, 4vw, 2rem)',
          gap: 'clamp(1.5rem, 4vw, 2.5rem)',
        }}
      >
        {/* Header */}
        <div className="text-center" style={{ width: '100%' }}>
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}
          >
            <HeartPawLogo size={32} />
            <motion.h1 className="section-title" style={{ margin: 0, fontSize: 'clamp(1.8rem, 5vw, 2.8rem)' }}>
              Sense My Horse
            </motion.h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}
            className="section-subtitle"
            style={{ margin: '0 auto', fontSize: 'clamp(0.95rem, 2.2vw, 1.15rem)' }}
          >
            Dedicated stable monitoring and gentle posture tracking for equines.
          </motion.p>
        </div>

        {/* ── DUAL-CARD SENSING GRID ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'clamp(1rem, 3vw, 2rem)',
            width: '100%',
          }}
        >
          {/* ── STABLE AUDIO CARD ─────────────────────────────────────────── */}
          <motion.div
            whileHover={{ y: -5 }}
            className="card glass"
            style={{
              position: 'relative', overflow: 'hidden',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              background: 'rgba(240,251,245,0.80)',
              border: '1.5px solid rgba(168,230,207,0.40)',
              boxShadow: '0 8px 32px rgba(142,212,180,0.14)',
            }}
          >
            {/* Cinematic glow top */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
              background: 'linear-gradient(90deg, #a8e6cf, #dcedc1, #a8e6cf)',
              borderRadius: '24px 24px 0 0',
            }} />

            <AnimatePresence>
              {isActive && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ position: 'absolute', top: '0.5rem', right: '0.75rem', zIndex: 5 }}
                >
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    background: 'rgba(142,212,180,0.25)', borderRadius: '999px',
                    padding: '0.25rem 0.7rem', fontSize: '0.72rem', fontWeight: 600,
                    color: '#3a7a5a', border: '1px solid rgba(142,212,180,0.45)',
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5fba8a', animation: 'soft-pulse 2s infinite' }} />
                    Listening
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <h3 className="text-center" style={{ color: 'var(--color-sage-green)', marginBottom: '1rem', fontSize: '1.15rem', fontWeight: 600 }}>
              🎙️ Stable Sound Feed
            </h3>
            <AudioVisualizer isListening={isActive} type="horse" rms={rms} zcr={zcr} />

            <div style={{ minHeight: '110px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AnimatePresence mode="wait">
                {audioEmotion && pageState !== 'IDLE' && pageState !== 'READY' ? (
                  <motion.div key="emotion" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                    <EmotionalMeter level={audioEmotion.level} message={audioEmotion.message} />
                  </motion.div>
                ) : (
                  <motion.p key="awaiting" initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }}
                    className="text-muted text-center"
                    style={{ fontSize: '0.95rem', lineHeight: 1.5 }}
                  >
                    {pageState === 'ACTIVE' ? '🐴 Listening for vocal cues…' : 'Ready to listen'}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* ── PADDOCK MOVEMENT CARD (Premium Gated) ─────────────────────── */}
          <motion.div
            whileHover={{ y: -5 }}
            className="card glass"
            style={{
              position: 'relative', overflow: 'hidden',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              background: 'rgba(237,247,242,0.80)',
              border: '1.5px solid rgba(220,237,193,0.40)',
              boxShadow: '0 8px 32px rgba(220,237,193,0.18)',
            }}
          >
            {/* Cinematic glow top */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
              background: 'linear-gradient(90deg, #dcedc1, #a8e6cf, #dcedc1)',
              borderRadius: '24px 24px 0 0',
            }} />

            <h3 className="text-center" style={{ color: 'var(--color-muted-teal)', marginBottom: '1rem', fontSize: '1.15rem', fontWeight: 600 }}>
              👁️ Paddock Movement Analyzer
            </h3>

            <div style={{ pointerEvents: isPremium ? 'auto' : 'none', opacity: isPremium ? 1 : 0.4, width: '100%', transition: 'opacity 0.4s ease' }}>
              <CameraView active={isActive && isPremium} onPostureDetected={handlePostureUpdate} />
            </div>

            <div style={{ minHeight: '110px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AnimatePresence mode="wait">
                {isPremium && postureEmotion && isActive ? (
                  <motion.div key="posture" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                    <EmotionalMeter level={postureEmotion.level} message={postureEmotion.details} />
                  </motion.div>
                ) : isPremium ? (
                  <motion.p key="awaiting-premium" initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }}
                    className="text-muted text-center" style={{ fontSize: '0.95rem' }}
                  >
                    {isActive ? '🐴 Scanning posture…' : 'Ready to observe'}
                  </motion.p>
                ) : null}
              </AnimatePresence>
            </div>

            {/* Premium lock overlay */}
            <AnimatePresence>
              {!isPremium && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(240,251,245,0.65)', backdropFilter: 'blur(12px)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', padding: '2rem', textAlign: 'center', zIndex: 15,
                  }}
                >
                  <Crown size={42} color="var(--color-soft-gold)"
                    style={{ marginBottom: '1rem', filter: 'drop-shadow(0 0 12px rgba(244,208,104,0.55))' }}
                  />
                  <h4 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Unlock Stable AI</h4>
                  <p className="text-muted" style={{ fontSize: '0.9rem', margin: '0.5rem 0 1.25rem', lineHeight: '1.5' }}>
                    Monitor pacing, leg stress stances, and field behaviors in real-time.
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.95 }} className="btn btn-primary"
                    onClick={() => setShowPaywall(true)}
                    style={{ background: 'linear-gradient(135deg, #f4d068, #ffd3b6)' }}
                  >
                    Unlock Premium
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* ── SAGE PREMIUM CTA ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.28 }}
          style={{ width: '100%' }}
        >
          <AnimatePresence mode="wait">
            {isActive ? (
              <motion.button
                key="stop"
                initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3 }}
                whileTap={{ scale: 0.96 }}
                className="btn-cta-stop" onClick={handleCTA}
                id="horse-end-analysis" style={{ width: '100%' }}
              >
                <Square size={20} fill="currentColor" style={{ opacity: 0.85 }} />
                End Stable Analysis
              </motion.button>
            ) : pageState === 'RESULTS' ? (
              <motion.button
                key="again"
                initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3 }}
                whileTap={{ scale: 0.96 }}
                className="btn-cta"
                onClick={handleCTA}
                id="horse-start-again"
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #8ed4b4 0%, #a8e6cf 42%, #dcedc1 72%, #b8f0d4 100%)',
                  boxShadow: '0 8px 40px rgba(142,212,180,0.50)',
                }}
              >
                🔄 Sense Again
              </motion.button>
            ) : (
              <motion.button
                key="start"
                initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.4 }}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
                className="btn-cta"
                onClick={handleCTA}
                id="horse-start-analysis"
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #8ed4b4 0%, #a8e6cf 42%, #dcedc1 72%, #b8f0d4 100%)',
                  boxShadow: '0 8px 40px rgba(142,212,180,0.50), 0 2px 12px rgba(220,237,193,0.35)',
                }}
                disabled={pageState === 'IDLE'}
              >
                <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>🐴</span>
                Start Stable Analysis
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results summary */}
        <AnimatePresence>
          {pageState === 'RESULTS' && (audioEmotion || postureEmotion) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
              style={{ width: '100%', overflow: 'hidden' }}
            >
              <div style={{
                background: 'rgba(240,251,245,0.82)',
                backdropFilter: 'blur(16px)',
                borderRadius: '24px', padding: '1.5rem',
                border: '1.5px solid rgba(168,230,207,0.38)',
                boxShadow: '0 8px 32px rgba(142,212,180,0.12)',
              }}>
                <h4 style={{ color: 'var(--color-text-dark)', fontWeight: 600, marginBottom: '1rem', fontSize: '1.1rem' }}>
                  Equine Emotional Summary
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.95rem', color: 'var(--color-text-muted)' }}>
                  {audioEmotion && (
                    <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      🎙️ <strong>Vocal:</strong> {audioEmotion.message}
                    </li>
                  )}
                  {postureEmotion && (
                    <li style={{ padding: '0.5rem 0' }}>
                      👁️ <strong>Posture:</strong> {postureEmotion.details}
                    </li>
                  )}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── PREMIUM PAYWALL ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showPaywall && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(240,251,245,0.82)', backdropFilter: 'blur(14px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="card text-center glass"
              style={{ maxWidth: '480px', padding: '3rem 2.5rem', boxShadow: '0 20px 60px rgba(0,0,0,0.10)' }}
            >
              <Crown size={56} color="var(--color-soft-gold)"
                style={{ margin: '0 auto 1.5rem', filter: 'drop-shadow(0 0 16px rgba(244,208,104,0.55))' }}
              />
              <h2 style={{ fontSize: '2rem' }}>Sense My Pet Premium</h2>
              <p className="text-muted" style={{ fontSize: '1.05rem', marginTop: '0.75rem', lineHeight: '1.6' }}>
                Deepen your connection through advanced multi-modal AI sensing.
              </p>
              <div style={{ background: 'rgba(255,255,255,0.55)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', margin: '1.75rem 0', textAlign: 'left' }}>
                <p style={{ fontWeight: 600, color: 'var(--color-text-dark)', marginBottom: '0.75rem' }}>Premium Features:</p>
                <ul style={{ fontSize: '0.98rem', listStyleType: 'none', paddingLeft: 0, color: 'var(--color-text-muted)' }}>
                  {['✨ Live Posture & Movement Analysis', '✨ Unlimited Voice Assistant Translation', '✨ Interactive History & Trends'].map(f => (
                    <li key={f} style={{ margin: '0.6rem 0' }}>{f}</li>
                  ))}
                </ul>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--color-text-dark)', marginBottom: '1.75rem' }}>
                ₹299 <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>/ month</span>
              </div>
              <div className="flex gap-4 justify-center">
                <motion.button whileTap={{ scale: 0.95 }} className="btn btn-primary"
                  onClick={() => { setIsPremium(true); setShowPaywall(false); }}
                  style={{ padding: '1rem 2rem', background: 'linear-gradient(135deg, #f4d068, #ffd3b6)' }}
                >
                  Subscribe
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} className="btn"
                  style={{ background: 'transparent', color: 'var(--color-text-muted)' }}
                  onClick={() => setShowPaywall(false)}
                >
                  Maybe Later
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
