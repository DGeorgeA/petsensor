import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Camera, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AudioVisualizer from '../components/AudioVisualizer';
import CameraView from '../components/CameraView';
import CinematicSensingBox from '../components/CinematicSensingBox';
import { PetAudioEngine, EMOTION_TEMPLATES } from '../lib/audioPipeline';
import { speakWarmly } from '../lib/voice';
import AnxietyMeter, { type AnxietyLevel } from '../components/AnxietyMeter';

export default function DogWhisperer() {
  // Audio State
  const [audioState, setAudioState] = useState<'IDLE' | 'ACTIVE' | 'RESULTS'>('IDLE');
  const [rms, setRms] = useState(0);
  const [zcr, setZcr] = useState(0);
  const [audioEmotion, setAudioEmotion] = useState<{ label: string; confidence: number; level: AnxietyLevel; message: string; } | null>(null);
  const audioEngineRef = useRef<PetAudioEngine | null>(null);

  // Video State
  const [videoState, setVideoState] = useState<'IDLE' | 'ACTIVE' | 'RESULTS'>('IDLE');
  const [postureEmotion, setPostureEmotion] = useState<{ label: string; confidence: number; level: AnxietyLevel; details: string; } | null>(null);

  // Background state (Active if either is active)
  const isActive = audioState === 'ACTIVE' || videoState === 'ACTIVE';

  // --- AUDIO LOGIC ---
  useEffect(() => {
    if (audioState === 'ACTIVE') {
      const engine = new PetAudioEngine('dog', (features, bestMatch, similarity) => {
        setRms(features.rms);
        setZcr(features.zcr);
        const matchTemplate = EMOTION_TEMPLATES[bestMatch];
        if (matchTemplate && matchTemplate.animal === 'dog' && similarity > 0.6) {
          let level: AnxietyLevel = 'LOW';
          let message = 'Your dog feels calm, relaxed, and safe in their current environment.';
          if (bestMatch.includes('stress')) {
            level = 'HIGH';
            message = 'Your dog may be experiencing high separation anxiety and stress. Please offer comforting tactile strokes.';
          } else if (bestMatch.includes('whining')) {
            level = 'MODERATE';
            message = 'Your dog is showing mild stress or seeking attention. Speak in a gentle, reassuring tone.';
          } else if (bestMatch.includes('excited')) {
            level = 'MODERATE';
            message = 'Your dog is slightly excited and alert. They are showing signs of positive engagement.';
          }
          setAudioEmotion({ label: matchTemplate.label, confidence: similarity, level, message });
        }
      });
      engine.start().catch(err => console.error('Audio engine failed:', err));
      audioEngineRef.current = engine;
    } else {
      if (audioEngineRef.current) {
        audioEngineRef.current.stop();
        audioEngineRef.current = null;
      }
      setRms(0);
      setZcr(0);
    }
    return () => { if (audioEngineRef.current) audioEngineRef.current.stop(); };
  }, [audioState]);

  useEffect(() => {
    if (audioState === 'RESULTS' && audioEmotion) {
      speakWarmly(audioEmotion.message, 'en');
    }
  }, [audioState, audioEmotion]);

  const toggleAudio = () => {
    if (audioState === 'IDLE' || audioState === 'RESULTS') {
      setAudioEmotion(null);
      setAudioState('ACTIVE'); // Instant start
    } else {
      setAudioState('RESULTS'); // Instant stop -> Results
    }
  };

  // --- VIDEO LOGIC ---
  const handlePostureUpdate = (posture: any) => {
    let level: AnxietyLevel = 'LOW';
    let details = 'Your dog appears calm and comfortable in their posture.';
    
    if (posture.label.includes('Fearful') || posture.label.includes('Pacing') || posture.label.includes('Crouching')) {
      level = 'HIGH';
      details = 'Your dog\'s posture indicates fear or high stress (tail tucked, ears back).';
    } else if (posture.label.includes('Standing') || posture.label.includes('Restlessness')) {
      level = 'MODERATE';
      details = 'Your dog appears somewhat restless and alert, but not overly distressed.';
    }
    setPostureEmotion({ label: posture.label, confidence: posture.confidence || 0.85, level, details });
  };

  const toggleVideo = () => {
    if (videoState === 'IDLE' || videoState === 'RESULTS') {
      setPostureEmotion(null);
      setVideoState('ACTIVE'); // Instant start
    } else {
      setVideoState('RESULTS'); // Instant stop -> Results
    }
  };

  return (
    <>
      {/* ── CINEMATIC PAGE BACKGROUND ──────────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0, zIndex: -2, overflow: 'hidden',
          background: 'linear-gradient(160deg, #fbf3ec 0%, #fdf7f0 60%, #ffecd9 100%)',
        }}
      >
        {/* Warm sun glow top-right */}
        <div style={{
          position: 'absolute', top: '-15%', right: '-10%',
          width: '55vw', height: '55vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(244, 208, 104, 0.2) 0%, rgba(255,170,165,0.08) 55%, transparent 75%)',
        }} />

        {/* FAR connection image — visible when idle, softly fades/blurs on active */}
        <motion.img
          src="/assets/connection_far.png"
          alt=""
          loading="lazy"
          animate={{
            opacity: isActive ? 0.15 : 0.28,
            scale: isActive ? 1.05 : 1.0,
            filter: isActive ? 'blur(16px) saturate(0.6)' : 'blur(2px) saturate(1.2) brightness(1.05)',
          }}
          transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%', objectFit: 'cover',
            willChange: 'transform, opacity, filter',
          }}
        />

        {/* CLOSE connection image — appears when active for depth */}
        <motion.img
          src="/assets/connection_close.png"
          alt=""
          loading="lazy"
          animate={{
            opacity: isActive ? 0.35 : 0,
            scale: isActive ? 1.0 : 1.06,
            filter: isActive ? 'blur(6px) saturate(1.2)' : 'blur(0px) saturate(1.4)',
          }}
          transition={{ duration: 1.8, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%', objectFit: 'cover',
            willChange: 'transform, opacity, filter',
          }}
        />

        {/* Warm vignette overlay — ensures text/UI remains highly readable without over-darkening */}
        <motion.div
          animate={{ opacity: isActive ? 0.8 : 0.5 }}
          transition={{ duration: 1.5 }}
          style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, rgba(251, 243, 236, 0.4) 10%, rgba(251, 243, 236, 0.85) 100%)',
          }}
        />

        {/* Ambient particles when actively sensing */}
        <AnimatePresence>
          {isActive && [...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 0, x: `${10 + i * 12}%` }}
              animate={{ opacity: [0, 0.5, 0], y: '-25vh', scale: [1, 0.4] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 4, delay: i * 0.5, repeat: Infinity, ease: 'easeOut' }}
              style={{
                position: 'absolute', bottom: '10%',
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--color-soft-gold)',
                willChange: 'transform, opacity',
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* ── PAGE CONTENT ───────────────────────────────────────────────── */}
      <div
        className="flex flex-col items-center"
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: 'clamp(1rem, 4vw, 3rem) clamp(1rem, 4vw, 2rem)',
          gap: 'clamp(2rem, 5vw, 4rem)',
        }}
      >
        {/* Header */}
        <div className="text-center" style={{ width: '100%' }}>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="section-title">
            Sense My Dog
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="section-subtitle" style={{ margin: '0 auto' }}>
            A soulful AI companion that gently understands your dog.
          </motion.p>
        </div>

        {/* ── AUDIO SENSING WINDOW ─────────────────────── */}
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
            boxShadow: audioState === 'ACTIVE' ? '0 12px 48px rgba(255,170,165,0.25)' : '0 8px 32px rgba(255,170,165,0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transition: 'box-shadow 0.6s ease'
          }}
        >
          <h3 className="text-center" style={{ color: '#c0665e', marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600, letterSpacing: '0.02em' }}>
            Audio Sensing
          </h3>

          <CinematicSensingBox
            farImageSrc="/assets/connection_far.png"
            closeImageSrc="/assets/connection_close.png"
            isActive={audioState === 'ACTIVE'}
            isConnecting={false} // Instant connection per BMAD
            label="Dog Audio"
          />

          <AudioVisualizer isListening={audioState === 'ACTIVE'} type="dog" rms={rms} zcr={zcr} />

          {/* Status Indicator */}
          <div style={{ height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '1rem 0' }}>
            <AnimatePresence mode="wait">
              {audioState === 'ACTIVE' ? (
                <motion.div
                  key="active"
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  style={{
                    color: '#c0665e', fontWeight: 600, fontSize: '1.05rem',
                    textShadow: '0 0 12px rgba(255,170,165,0.8)',
                    animation: 'pulse 2s infinite'
                  }}
                >
                  Connection Active
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }} style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                  Awaiting connection…
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CTA Button */}
          <div style={{ width: '100%' }}>
            <motion.button
              whileTap={{ scale: 0.96 }}
              className={`btn ${audioState === 'ACTIVE' ? 'btn-primary' : 'btn-cta'}`}
              onClick={toggleAudio}
              style={{ width: '100%', padding: '1.1rem', fontSize: '1.05rem', borderRadius: '16px' }}
            >
              {audioState === 'ACTIVE' ? <Square size={20} fill="currentColor" /> : <Mic size={20} />}
              {audioState === 'ACTIVE' ? 'End Connection' : 'Listen Now'}
            </motion.button>
          </div>

          {/* Results (Anxiety Meter) */}
          <AnimatePresence>
            {audioState === 'RESULTS' && audioEmotion && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: '2rem' }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                style={{ width: '100%', overflow: 'hidden' }}
              >
                <AnxietyMeter level={audioEmotion.level} conclusion={audioEmotion.message} confidenceScore={audioEmotion.confidence} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── GENTLE OBSERVATION WINDOW ─────────────────────── */}
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
            boxShadow: videoState === 'ACTIVE' ? '0 12px 48px rgba(168,230,207,0.3)' : '0 8px 32px rgba(168,230,207,0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transition: 'box-shadow 0.6s ease'
          }}
        >
          <h3 className="text-center" style={{ color: '#4a8c6f', marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600, letterSpacing: '0.02em' }}>
            Gentle Observation
          </h3>

          {/* Camera View */}
          <div style={{ width: '100%', borderRadius: '20px', overflow: 'hidden', filter: videoState === 'RESULTS' ? 'grayscale(0.4) brightness(0.9)' : 'none', transition: 'filter 0.8s ease' }}>
            <CameraView active={videoState === 'ACTIVE'} onPostureDetected={handlePostureUpdate} />
          </div>

          {/* Status Indicator */}
          <div style={{ height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '1.5rem 0 1rem' }}>
            <AnimatePresence mode="wait">
              {videoState === 'ACTIVE' ? (
                <motion.div
                  key="active"
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  style={{
                    color: '#4a8c6f', fontWeight: 600, fontSize: '1.05rem',
                    textShadow: '0 0 12px rgba(168,230,207,0.8)',
                    animation: 'pulse 2s infinite'
                  }}
                >
                  Observation Active
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }} style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                  Camera on standby…
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CTA Button */}
          <div style={{ width: '100%' }}>
            <motion.button
              whileTap={{ scale: 0.96 }}
              className={`btn ${videoState === 'ACTIVE' ? 'btn-primary' : 'btn-cta'}`}
              onClick={toggleVideo}
              style={{ width: '100%', padding: '1.1rem', fontSize: '1.05rem', borderRadius: '16px', background: videoState === 'ACTIVE' ? '#4a8c6f' : undefined }}
            >
              {videoState === 'ACTIVE' ? <Square size={20} fill="currentColor" /> : <Camera size={20} />}
              {videoState === 'ACTIVE' ? 'End Scan' : 'Scan Now'}
            </motion.button>
          </div>

          {/* Results (Anxiety Meter) */}
          <AnimatePresence>
            {videoState === 'RESULTS' && postureEmotion && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: '2rem' }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                style={{ width: '100%', overflow: 'hidden' }}
              >
                <AnxietyMeter level={postureEmotion.level} conclusion={postureEmotion.details} confidenceScore={postureEmotion.confidence} />
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </div>
    </>
  );
}
