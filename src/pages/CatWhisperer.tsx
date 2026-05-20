import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UnifiedSensingWindow from '../components/UnifiedSensingWindow';
import { UnifiedSensingEngine, type UnifiedResult } from '../lib/unifiedEngine';
import { speakDetection, resetVoiceGuards } from '../lib/voice';
import AnxietyMeter from '../components/AnxietyMeter';

export default function CatWhisperer() {
  const [engineState, setEngineState] = useState<'IDLE' | 'ACTIVE' | 'RESULTS'>('IDLE');
  const [result, setResult] = useState<UnifiedResult | null>(null);
  
  // Real-time visualizer hooks
  const [rms, setRms] = useState(0);
  const [zcr, setZcr] = useState(0);

  const engineRef = useRef<UnifiedSensingEngine | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (engineState === 'ACTIVE') {
      resetVoiceGuards();
      const engine = new UnifiedSensingEngine('cat', (latestResult) => {
        setResult(latestResult);
        setRms(latestResult.rms);
        setZcr(latestResult.zcr);
        if (latestResult.audio?.key) {
          speakDetection(latestResult.audio.message, latestResult.audio.key, 'en');
        }
      });
      engineRef.current = engine;
      if (videoElRef.current) {
        engine.start(videoElRef.current).catch(err => console.error('Engine failed to start:', err));
      }
    } else {
      if (engineRef.current) {
        engineRef.current.stop();
        engineRef.current = null;
      }
      setRms(0);
      setZcr(0);
    }
    return () => {
      if (engineRef.current) engineRef.current.stop();
    };
  }, [engineState]);

  const toggleSensing = () => {
    if (engineState === 'IDLE' || engineState === 'RESULTS') {
      setResult(null);
      setEngineState('ACTIVE'); // Instant start < 50ms
    } else {
      setEngineState('RESULTS');
    }
  };

  const isActive = engineState === 'ACTIVE';

  return (
    <>
      {/* ── CINEMATIC PAGE BACKGROUND ──────────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0, zIndex: -2, overflow: 'hidden',
          background: 'linear-gradient(160deg, #f9f3fb 0%, #fdf5f0 60%, #ffecd9 100%)',
        }}
      >
        <div style={{
          position: 'absolute', top: '-15%', left: '-10%',
          width: '60vw', height: '60vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(220, 193, 242, 0.15) 0%, rgba(255,211,182,0.08) 55%, transparent 75%)',
        }} />

        <motion.img
          src="/assets/cat_connection_far.png"
          alt="" loading="lazy"
          animate={{
            opacity: isActive ? 0.08 : 0.25,
            scale: isActive ? 1.08 : 1.0,
            filter: isActive ? 'blur(22px) brightness(0.78)' : 'blur(2px) brightness(1)',
          }}
          transition={{ duration: 1.8, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', willChange: 'transform, filter',
          }}
        />

        <motion.img
          src="/assets/cat_connection_close.png"
          alt="" loading="lazy"
          animate={{
            opacity: isActive ? 0.28 : 0,
            scale: isActive ? 1.0 : 1.06,
            filter: isActive ? 'blur(10px) brightness(0.82)' : 'blur(0px)',
          }}
          transition={{ duration: 2.0, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', willChange: 'transform, filter',
          }}
        />

        <motion.div
          animate={{ opacity: isActive ? 0.92 : 0.55 }}
          transition={{ duration: 1.8 }}
          style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, rgba(249, 243, 251, 0.35) 10%, rgba(249, 243, 251, 0.9) 100%)',
          }}
        />
      </div>

      {/* ── PAGE CONTENT ───────────────────────────────────────────────── */}
      <div
        className="flex flex-col items-center"
        style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(1rem, 4vw, 3rem) clamp(1rem, 4vw, 2rem)', gap: 'clamp(2rem, 5vw, 4rem)' }}
      >
        <div className="text-center" style={{ width: '100%' }}>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="section-title">
            Sense My Cat
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="section-subtitle" style={{ margin: '0 auto' }}>
            A unified, multi-modal emotional AI companion.
          </motion.p>
        </div>

        <div style={{ width: '100%' }}>
          <UnifiedSensingWindow 
            isActive={isActive} 
            animalType="cat" 
            rms={rms} zcr={zcr} 
            onVideoReady={(el) => { videoElRef.current = el; }} 
          />

          <div style={{ width: '100%', marginTop: '2rem' }}>
            <motion.button
              whileTap={{ scale: 0.96 }}
              className={`btn ${isActive ? 'btn-primary' : 'btn-cta'}`}
              onClick={toggleSensing}
              style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem', borderRadius: '16px', display: 'flex', gap: '0.75rem', justifyContent: 'center', alignItems: 'center' }}
            >
              {isActive ? <Square size={22} fill="currentColor" /> : <ShieldCheck size={22} />}
              {isActive ? 'End Complete Analysis' : 'Start Complete Analysis'}
            </motion.button>
          </div>

          <AnimatePresence>
            {engineState === 'RESULTS' && result && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: '2.5rem' }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                style={{ width: '100%', overflow: 'hidden' }}
              >
                <div style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', borderRadius: '24px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                  <h4 style={{ color: 'var(--color-text-dark)', fontWeight: 600, marginBottom: '1rem', fontSize: '1.1rem' }}>Multi-Modal Insights</h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.95rem', color: 'var(--color-text-muted)' }}>
                    <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      🎙️ <strong>Vocal:</strong> {result.audio?.message || 'No vocal data'}
                    </li>
                    <li style={{ padding: '0.5rem 0' }}>
                      👁️ <strong>Posture:</strong> {result.video?.posture.details || 'No visual data'}
                    </li>
                  </ul>
                </div>
                <AnxietyMeter level={result.finalLevel} conclusion={result.finalMessage} confidenceScore={result.combinedScore / 100} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
