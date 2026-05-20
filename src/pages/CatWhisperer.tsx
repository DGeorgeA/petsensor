import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AudioVisualizer from '../components/AudioVisualizer';
import CameraView from '../components/CameraView';
import CinematicSensingBox from '../components/CinematicSensingBox';
import { PetAudioEngine, EMOTION_TEMPLATES } from '../lib/audioPipeline';
import { speakWarmly } from '../lib/voice';
import ParticleHourglass from '../components/ParticleHourglass';
import EmotionalMeter from '../components/EmotionalMeter';

export default function CatWhisperer() {
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [rms, setRms] = useState(0);
  const [zcr, setZcr] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const [audioEmotion, setAudioEmotion] = useState<{
    label: string; confidence: number; level: 'LOW' | 'MEDIUM' | 'HIGH'; message: string;
  } | null>(null);
  const [postureEmotion, setPostureEmotion] = useState<{
    label: string; confidence: number; details: string; level: 'LOW' | 'MEDIUM' | 'HIGH';
  } | null>(null);

  const audioEngineRef = useRef<PetAudioEngine | null>(null);

  useEffect(() => {
    if (isListening && !isAnalyzing) {
      const engine = new PetAudioEngine('dog', (features, bestMatch, similarity) => {
        setRms(features.rms);
        setZcr(features.zcr);
        const matchTemplate = EMOTION_TEMPLATES[bestMatch];
        if (matchTemplate && similarity > 0.6) {
          let level: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
          let message = 'Your cat feels safe, content and deeply at ease with you.';
          if (bestMatch.includes('stress')) {
            level = 'HIGH';
            message = 'I sense some agitation or overstimulation. Give them space and speak softly.';
          } else if (bestMatch.includes('excited')) {
            level = 'MEDIUM';
            message = 'Playful energy detected! This might be a great moment for gentle play.';
          }
          setAudioEmotion({ label: matchTemplate.label, confidence: similarity, level, message });
        }
      });
      engine.start().catch(err => console.error('Cat audio engine failed:', err));
      audioEngineRef.current = engine;
    } else {
      if (audioEngineRef.current) { audioEngineRef.current.stop(); audioEngineRef.current = null; }
      setRms(0); setZcr(0);
      if (!isAnalyzing) setAudioEmotion(null);
    }
    return () => { if (audioEngineRef.current) audioEngineRef.current.stop(); };
  }, [isListening, isAnalyzing]);

  useEffect(() => {
    if (audioEmotion && isListening && !isAnalyzing) {
      speakWarmly(audioEmotion.message, 'en');
    }
  }, [audioEmotion?.message]);

  const handleStartSensing = () => {
    if (!isListening && !isAnalyzing) {
      setIsAnalyzing(true);
      setTimeout(() => { setIsAnalyzing(false); setIsListening(true); }, 3500);
    } else if (isListening) {
      setIsListening(false);
    }
  };

  const handlePostureUpdate = (posture: any) => {
    let level: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (posture.label.includes('Fearful') || posture.label.includes('Pacing')) level = 'HIGH';
    else if (posture.label.includes('Standing')) level = 'MEDIUM';
    setPostureEmotion({ ...posture, level });
  };

  const isActive = isListening || isAnalyzing;

  return (
    <>
      {/* ── CINEMATIC CAT PAGE BACKGROUND ──────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0, zIndex: -2, overflow: 'hidden',
          background: 'linear-gradient(160deg, #f9f3fb 0%, #fdf5f0 60%, #ffecd9 100%)',
        }}
      >
        {/* Warm lavender-peach glow */}
        <div style={{
          position: 'absolute', top: '-15%', left: '-10%',
          width: '60vw', height: '60vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(220, 193, 242, 0.15) 0%, rgba(255,211,182,0.08) 55%, transparent 75%)',
        }} />

        {/* FAR cat connection image */}
        <motion.img
          src="/assets/cat_connection_far.png"
          alt=""
          loading="lazy"
          animate={{
            opacity: isActive ? 0 : 0.28,
            scale: isActive ? 1.08 : 1.0,
            filter: isActive ? 'blur(12px) saturate(0.5)' : 'blur(1px) saturate(1.3) brightness(1.1)',
          }}
          transition={{ duration: 1.8, ease: [0.4, 0, 0.2, 1] }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', willChange: 'transform, opacity, filter' }}
        />

        {/* CLOSE cat connection image */}
        <motion.img
          src="/assets/cat_connection_close.png"
          alt=""
          loading="lazy"
          animate={{
            opacity: isActive ? 0.32 : 0,
            scale: isActive ? 1.0 : 1.06,
            filter: isAnalyzing ? 'blur(8px) saturate(0.7)' : 'blur(0px) saturate(1.4) brightness(1.05)',
          }}
          transition={{ duration: 2.0, ease: [0.4, 0, 0.2, 1], delay: 0.3 }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', willChange: 'transform, opacity, filter' }}
        />

        {/* Vignette */}
        <motion.div
          animate={{ opacity: isActive ? 0.7 : 0.4 }}
          transition={{ duration: 1.8 }}
          style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 25%, rgba(249, 243, 251, 0.75) 100%)',
          }}
        />

        {/* Ambient particles */}
        <AnimatePresence>
          {isListening && !isAnalyzing && [...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 0, x: `${10 + i * 15}%` }}
              animate={{ opacity: [0, 0.6, 0], y: '-20vh', scale: [1, 0.3] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 3.5, delay: i * 0.7, repeat: Infinity, ease: 'easeOut' }}
              style={{
                position: 'absolute', bottom: '15%',
                width: 6, height: 6, borderRadius: '50%',
                background: 'rgba(220, 193, 242, 0.8)',
                willChange: 'transform, opacity',
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* ── PAGE CONTENT ───────────────────────────────────────────────── */}
      <div
        className="flex flex-col items-center"
        style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(0.5rem, 3vw, 1rem) clamp(1rem, 4vw, 2rem)' }}
      >
        <div className="text-center" style={{ marginBottom: 'clamp(1rem, 3vh, 2rem)', width: '100%' }}>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="section-title">
            Cat Whisperer
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="section-subtitle" style={{ margin: '0 auto' }}>
            Gently understand your cat's emotional world through voice, purr patterns, and subtle body language.
          </motion.p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
          gap: 'clamp(1rem, 3vw, 2rem)',
          width: '100%',
          marginBottom: 'clamp(2rem, 5vh, 4rem)',
        }}>
          {/* Audio Sensing Card */}
          <motion.div
            whileHover={{ y: -4 }}
            style={{
              position: 'relative', overflow: 'hidden', borderRadius: '28px',
              padding: 'clamp(1.25rem, 3vw, 2rem)',
              background: 'rgba(255, 255, 255, 0.72)',
              backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
              border: '1.5px solid rgba(255,255,255,0.85)',
              boxShadow: '0 8px 32px rgba(220,193,242,0.15)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}
          >
            <AnimatePresence>
              {isAnalyzing && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ position: 'absolute', inset: 0, zIndex: 10, borderRadius: '28px', overflow: 'hidden' }}>
                  <ParticleHourglass />
                </motion.div>
              )}
            </AnimatePresence>

            <h3 className="text-center" style={{ color: '#7c5a8e', marginBottom: 'clamp(0.75rem, 2vw, 1.25rem)', fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', fontWeight: 600 }}>
              🐱 Audio Sensing
            </h3>

            {/* ★ CINEMATIC BOX INSIDE CARD ★ */}
            <CinematicSensingBox
              farImageSrc="/assets/cat_connection_far.png"
              closeImageSrc="/assets/cat_connection_close.png"
              isActive={isActive}
              isConnecting={isAnalyzing}
              label="Cat"
            />

            <AudioVisualizer isListening={isListening && !isAnalyzing} type="dog" rms={rms} zcr={zcr} />

            <div style={{ minHeight: '100px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '0.5rem' }}>
              <AnimatePresence mode="wait">
                {audioEmotion && !isAnalyzing ? (
                  <motion.div key="emotion" initial={{ opacity: 0, scale: 0.9, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} style={{ width: '100%' }}>
                    <EmotionalMeter level={audioEmotion.level} message={audioEmotion.message} />
                  </motion.div>
                ) : (
                  <motion.p key="awaiting" initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }} className="text-muted text-center" style={{ fontSize: '0.95rem' }}>
                    {isAnalyzing ? 'Feeling the connection…' : 'Awaiting connection…'}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div style={{ width: '100%', marginTop: 'clamp(0.75rem, 2vw, 1.25rem)' }}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className={`btn ${isActive ? 'btn-primary' : 'btn-cta'}`}
                onClick={handleStartSensing}
                style={{ width: '100%' }}
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                {isListening ? 'End Connection' : isAnalyzing ? 'Connecting…' : 'Sense My Cat'}
              </motion.button>
            </div>
          </motion.div>

          {/* Posture Card (Premium) */}
          <motion.div
            whileHover={{ y: -4 }}
            style={{
              position: 'relative', overflow: 'hidden', borderRadius: '28px',
              padding: 'clamp(1.25rem, 3vw, 2rem)',
              background: 'rgba(255, 255, 255, 0.72)',
              backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
              border: '1.5px solid rgba(255,255,255,0.85)',
              boxShadow: '0 8px 32px rgba(168,230,207,0.12)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}
          >
            <h3 className="text-center" style={{ color: '#4a8c6f', marginBottom: 'clamp(0.75rem, 2vw, 1.25rem)', fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', fontWeight: 600 }}>
              👁️ Body Language
            </h3>

            <div style={{ pointerEvents: isPremium ? 'auto' : 'none', opacity: isPremium ? 1 : 0.4, width: '100%', transition: 'opacity 0.4s ease' }}>
              <CameraView active={isListening && isPremium && !isAnalyzing} onPostureDetected={handlePostureUpdate} />
            </div>

            <div style={{ minHeight: '100px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '0.5rem' }}>
              <AnimatePresence mode="wait">
                {isPremium && postureEmotion && !isAnalyzing ? (
                  <motion.div key="posture" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ width: '100%' }}>
                    <EmotionalMeter level={postureEmotion.level} message={postureEmotion.details} />
                  </motion.div>
                ) : isPremium ? (
                  <motion.p key="awaiting" initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }} className="text-muted text-center" style={{ fontSize: '0.95rem' }}>
                    Awaiting posture…
                  </motion.p>
                ) : null}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {!isPremium && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(249, 243, 251, 0.78)',
                    backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '2rem', textAlign: 'center', zIndex: 15, borderRadius: '28px',
                  }}
                >
                  <Crown size={40} color="var(--color-soft-gold)" style={{ marginBottom: '1rem', filter: 'drop-shadow(0 0 12px rgba(244,208,104,0.6))' }} />
                  <h4 style={{ fontSize: 'clamp(1.1rem, 3vw, 1.4rem)', marginBottom: '0.5rem' }}>Unlock Body Language AI</h4>
                  <p className="text-muted" style={{ fontSize: '0.95rem', margin: '0.5rem 0 1.25rem', lineHeight: 1.5 }}>
                    Detect tail position, ear posture, and slow-blink trust signals in real-time.
                  </p>
                  <motion.button whileTap={{ scale: 0.95 }} className="btn btn-cta" style={{ fontSize: '1rem', padding: '0.85rem 2rem' }} onClick={() => setShowPaywall(true)}>
                    Unlock Premium
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Paywall Modal */}
        <AnimatePresence>
          {showPaywall && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(249, 243, 251, 0.82)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}
            >
              <motion.div
                initial={{ scale: 0.88, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.88, y: 24 }}
                transition={{ type: 'spring', damping: 22, stiffness: 260 }}
                style={{ maxWidth: 480, width: '100%', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(24px)', border: '1.5px solid rgba(255,255,255,0.95)', borderRadius: '28px', padding: 'clamp(2rem, 5vw, 3rem)', textAlign: 'center', boxShadow: '0 24px 60px rgba(220,193,242,0.2)' }}
              >
                <Crown size={52} color="var(--color-soft-gold)" style={{ margin: '0 auto 1.25rem', display: 'block', filter: 'drop-shadow(0 0 16px rgba(244,208,104,0.6))' }} />
                <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '0.75rem' }}>Sense My Pet Premium</h2>
                <p className="text-muted" style={{ fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  Deepen your bond through advanced multi-modal AI cat sensing.
                </p>
                <div style={{ background: 'rgba(220,193,242,0.15)', borderRadius: '18px', padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'left' }}>
                  <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Premium Features:</p>
                  <ul style={{ listStyle: 'none', padding: 0, color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                    {['✨ Purr Pattern Emotional Analysis', '✨ Slow-Blink Trust Detection', '✨ Tail & Ear Posture Insights'].map(f => (
                      <li key={f} style={{ padding: '0.5rem 0' }}>{f}</li>
                    ))}
                  </ul>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                  ₹299 <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>/ month</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <motion.button whileTap={{ scale: 0.95 }} className="btn btn-cta" style={{ fontSize: '1rem', padding: '0.9rem 2rem' }} onClick={() => { setIsPremium(true); setShowPaywall(false); }}>
                    Subscribe Now
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} className="btn" style={{ color: 'var(--color-text-muted)', padding: '0.9rem 1.5rem' }} onClick={() => setShowPaywall(false)}>
                    Maybe Later
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
