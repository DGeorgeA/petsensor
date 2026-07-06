import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UnifiedSensingWindow from '../components/UnifiedSensingWindow';
import AmbientParticles from '../components/AmbientParticles';
import { UnifiedSensingEngine, type UnifiedResult } from '../lib/unifiedEngine';
import { speakDetection, resetVoiceGuards } from '../lib/voice';
import AnxietyMeter from '../components/AnxietyMeter';
import HeartPawLogo from '../components/HeartPawLogo';
import EmotionalInsightModal from '../components/EmotionalInsightModal';
import ScreeningDisclaimer from '../components/ScreeningDisclaimer';
import ContextChips from '../components/ContextChips';
import type { ScanContext } from '../lib/context';

type PageState = 'IDLE' | 'READY' | 'ACTIVE' | 'RESULTS';

export default function DogWhisperer() {
  const [pageState, setPageState] = useState<PageState>('IDLE');
  const [result, setResult] = useState<UnifiedResult | null>(null);
  const [rms, setRms] = useState(0);
  const [zcr, setZcr] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [ctx, setCtx] = useState<ScanContext>({});

  const engineRef = useRef<UnifiedSensingEngine | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);

  // Transition to READY 400ms after mount for a smooth entry animation
  useEffect(() => {
    const t = setTimeout(() => setPageState('READY'), 400);
    return () => clearTimeout(t);
  }, []);

  // Engine lifecycle — only runs in ACTIVE state
  useEffect(() => {
    if (pageState === 'ACTIVE') {
      resetVoiceGuards();
      const engine = new UnifiedSensingEngine('dog', (latestResult) => {
        setResult(latestResult);
        setRms(latestResult.rms);
        setZcr(latestResult.zcr);
        if (latestResult.audioLabel) {
          speakDetection(latestResult.screening.headline, latestResult.audioLabel, 'en');
        }
      });
      engine.setContext(ctx);
      engineRef.current = engine;
      if (videoElRef.current) {
        engine.start(videoElRef.current).catch((err) =>
          console.error('Dog engine failed to start:', err),
        );
      }
    } else {
      if (engineRef.current) {
        engineRef.current.stop();
        engineRef.current = null;
      }
      if (pageState !== 'RESULTS') {
        setRms(0);
        setZcr(0);
      }
    }
    return () => { engineRef.current?.stop(); };
  }, [pageState]);

  // Open modal whenever RESULTS state activates
  useEffect(() => {
    if (pageState === 'RESULTS' && result) {
      setModalOpen(true);
    }
  }, [pageState, result]);

  const handleCTA = useCallback(() => {
    if (pageState === 'READY') {
      setResult(null);
      setPageState('ACTIVE');
    } else if (pageState === 'ACTIVE') {
      setPageState('RESULTS');
    } else if (pageState === 'RESULTS') {
      setResult(null);
      setPageState('READY');
    }
  }, [pageState]);

  const isActive = pageState === 'ACTIVE';
  const isReady = pageState === 'READY' || pageState === 'ACTIVE';

  return (
    <>
      {/* ── FLOATING EMOTIONAL INSIGHT MODAL ─────────────────────────────── */}
      {result && (
        <EmotionalInsightModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          screening={result.screening}
          species="dog"
        />
      )}
      {/* ── CINEMATIC PAGE BACKGROUND ──────────────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -2,
          overflow: 'hidden',
          background: 'linear-gradient(160deg, #fff5ee 0%, #fff0e5 55%, #ffe8d5 100%)',
        }}
      >
        {/* Animated warm glow orb */}
        <div
          style={{
            position: 'absolute',
            top: '-15%',
            right: '-10%',
            width: '60vw',
            height: '60vw',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(244,208,104,0.26) 0%, rgba(255,170,165,0.12) 50%, transparent 74%)',
            animation: 'ambient-drift 26s ease-in-out infinite',
            willChange: 'transform',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-10%',
            left: '-8%',
            width: '48vw',
            height: '48vw',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(255,170,165,0.18) 0%, rgba(255,211,182,0.08) 55%, transparent 78%)',
            animation: 'ambient-drift 32s ease-in-out 8s infinite reverse',
            willChange: 'transform',
          }}
        />

        <AmbientParticles count={10} palette="coral" />

        {/* Background dog imagery */}
        <motion.img
          src="/assets/connection_far.png"
          alt=""
          loading="lazy"
          animate={{
            opacity: isActive ? 0.06 : 0.30,
            scale: isActive ? 1.10 : 1.0,
            filter: isActive
              ? 'blur(28px) brightness(0.72)'
              : 'blur(1.5px) brightness(1.08)',
          }}
          transition={{ duration: 2.0, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            willChange: 'transform, filter',
          }}
        />

        {/* Warm veil overlay */}
        <motion.div
          animate={{ opacity: isActive ? 0.94 : 0.58 }}
          transition={{ duration: 2.0 }}
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse at 50% 40%, rgba(255,245,238,0.28) 0%, rgba(255,245,238,0.92) 100%)',
          }}
        />
      </div>

      {/* ── PAGE CONTENT ─────────────────────────────────────────────────────── */}
      <div
        className="flex flex-col items-center"
        style={{
          maxWidth: 740,
          margin: '0 auto',
          padding: 'clamp(0.5rem, 3vw, 2rem) clamp(1rem, 4vw, 2rem)',
          gap: 'clamp(1.5rem, 4vw, 2.5rem)',
        }}
      >
        {/* ── HEADER ─────────────────────────────────────────────────────────── */}
        <div className="text-center" style={{ width: '100%' }}>
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              marginBottom: '0.5rem',
            }}
          >
            <HeartPawLogo size={32} />
            <motion.h1
              className="section-title"
              style={{ margin: 0, fontSize: 'clamp(1.8rem, 5vw, 2.8rem)' }}
            >
              Sense My Dog
            </motion.h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.12 }}
            className="section-subtitle"
            style={{ margin: '0 auto', fontSize: 'clamp(0.95rem, 2.2vw, 1.15rem)' }}
          >
            Emotionally intelligent, multi-modal AI screening for your dog.
          </motion.p>
          {!isActive && <ScreeningDisclaimer />}
        </div>

        {/* ── IMMERSIVE SENSING WINDOW ─────────────────────────────────────── */}
        <div style={{ width: '100%' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <UnifiedSensingWindow
              isActive={isActive}
              isReady={isReady}
              animalType="dog"
              rms={rms}
              zcr={zcr}
              onVideoReady={(el) => { videoElRef.current = el; }}
            />
          </motion.div>

          {/* ── PRE-SCAN CONTEXT (optional, gently modulates interpretation) ── */}
          <AnimatePresence>
            {pageState === 'READY' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.4 }}
                style={{ width: '100%', marginTop: '1.25rem' }}
              >
                <ContextChips value={ctx} onChange={setCtx} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── PREMIUM EMOTIONAL CTA ──────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            style={{ width: '100%', marginTop: '1.75rem' }}
          >
            <AnimatePresence mode="wait">
              {isActive ? (
                /* ── END ANALYSIS BUTTON ─────────────────────────── */
                <motion.button
                  key="stop"
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  whileTap={{ scale: 0.96 }}
                  className="btn-cta-stop"
                  onClick={handleCTA}
                  id="dog-end-analysis"
                  style={{ width: '100%' }}
                >
                  <Square size={20} fill="currentColor" style={{ opacity: 0.85 }} />
                  End Complete Analysis
                </motion.button>
              ) : pageState === 'RESULTS' ? (
                /* ── START AGAIN BUTTON ──────────────────────────── */
                <motion.button
                  key="again"
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  whileTap={{ scale: 0.96 }}
                  className="btn-cta"
                  onClick={handleCTA}
                  id="dog-start-again"
                  style={{ width: '100%' }}
                >
                  🔄 Sense Again
                </motion.button>
              ) : (
                /* ── START COMPLETE ANALYSIS — PREMIUM CTA ────────── */
                <motion.button
                  key="start"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  className="btn-cta"
                  onClick={handleCTA}
                  id="dog-start-analysis"
                  style={{ width: '100%' }}
                  disabled={pageState === 'IDLE'}
                >
                  <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>🐶</span>
                  Start Complete Analysis
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── RESULTS PANEL ─────────────────────────────────────────────── */}
          <AnimatePresence>
            {pageState === 'RESULTS' && result && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: '2rem' }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
                style={{ width: '100%', overflow: 'hidden' }}
              >
                <div
                  style={{
                    background: 'rgba(255,252,248,0.78)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    borderRadius: '24px',
                    padding: '1.5rem',
                    marginBottom: '1.5rem',
                    border: '1.5px solid rgba(255,255,255,0.88)',
                    boxShadow: '0 8px 32px rgba(255,170,165,0.12)',
                  }}
                >
                  <h4
                    style={{
                      color: 'var(--color-text-dark)',
                      fontWeight: 600,
                      marginBottom: '1rem',
                      fontSize: '1.1rem',
                    }}
                  >
                    Multi-Modal Screening Signals
                  </h4>
                  <ul
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: 0,
                      fontSize: '0.95rem',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      🎙️ <strong>Vocal:</strong> {result.screening.audioSummary}
                    </li>
                    <li style={{ padding: '0.5rem 0' }}>
                      👁️ <strong>Body language:</strong> {result.screening.visualSummary}
                    </li>
                  </ul>
                </div>
                <AnxietyMeter screening={result.screening} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
