import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Crown } from 'lucide-react';
import AudioVisualizer from '../components/AudioVisualizer';
import CameraView from '../components/CameraView';
import { PetAudioEngine, EMOTION_TEMPLATES } from '../lib/audioPipeline';
import { speakWarmly } from '../lib/voice';
import ParticleHourglass from '../components/ParticleHourglass';
import EmotionalMeter from '../components/EmotionalMeter';

export default function HorseWhisperer() {
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [rms, setRms] = useState(0);
  const [zcr, setZcr] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  
  const [audioEmotion, setAudioEmotion] = useState<{ label: string; confidence: number; level: 'LOW' | 'MEDIUM' | 'HIGH'; message: string } | null>(null);
  const [postureEmotion, setPostureEmotion] = useState<{ label: string; confidence: number; details: string; level: 'LOW' | 'MEDIUM' | 'HIGH' } | null>(null);
  
  const audioEngineRef = useRef<PetAudioEngine | null>(null);

  useEffect(() => {
    if (isListening && !isAnalyzing) {
      const engine = new PetAudioEngine((features, bestMatch, similarity) => {
        setRms(features.rms);
        setZcr(features.zcr);
        
        const matchTemplate = EMOTION_TEMPLATES[bestMatch];
        if (matchTemplate && matchTemplate.animal === 'horse' && similarity > 0.6) {
          
          let level: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
          let message = "A solid, calm grounded state is maintained.";
          
          if (bestMatch.includes('stress') || bestMatch.includes('distress')) {
            level = 'HIGH';
            message = "Mild stable stress detected. Reassure them with a low, gentle whistle.";
          }
          
          setAudioEmotion({
            label: matchTemplate.label,
            confidence: similarity,
            level,
            message
          });
        }
      });
      
      engine.start().catch(err => {
        console.error("Stable audio engine failed to start:", err);
      });
      
      audioEngineRef.current = engine;
    } else {
      if (audioEngineRef.current) {
        audioEngineRef.current.stop();
        audioEngineRef.current = null;
      }
      setRms(0);
      setZcr(0);
      if (!isAnalyzing) {
        setAudioEmotion(null);
      }
    }
    
    return () => {
      if (audioEngineRef.current) {
        audioEngineRef.current.stop();
      }
    };
  }, [isListening, isAnalyzing]);

  useEffect(() => {
    if (audioEmotion && isListening && !isAnalyzing) {
      speakWarmly(audioEmotion.message, 'en');
    }
  }, [audioEmotion?.message]);

  const handleStartSensing = () => {
    if (!isListening) {
      setIsAnalyzing(true);
      setTimeout(() => {
        setIsAnalyzing(false);
        setIsListening(true);
      }, 3500);
    } else {
      setIsListening(false);
    }
  };

  const handleSelectPremiumFeature = () => {
    if (!isPremium) {
      setShowPaywall(true);
    }
  };

  const handlePostureUpdate = (posture: any) => {
    let level: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (posture.label.includes('Fearful') || posture.label.includes('Pacing')) level = 'HIGH';
    else if (posture.label.includes('Standing')) level = 'MEDIUM';
    setPostureEmotion({ ...posture, level });
  };

  return (
    <div className="flex flex-col items-center max-w-4xl mx-auto" style={{ padding: '0 1rem' }}>
      <div className="text-center mb-4">
        <h1 className="section-title">Horse Whisperer</h1>
        <p className="section-subtitle">Dedicated stable monitoring and gentle posture tracking for equines.</p>
      </div>

      <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', width: '100%', marginBottom: '4rem' }}>
        
        {/* Stable Audio */}
        <div className="card flex-col items-center glass" style={{ position: 'relative', overflow: 'hidden' }}>
          {isAnalyzing && <ParticleHourglass />}
          
          <h3 className="text-center mb-4" style={{ color: 'var(--color-sage-green)' }}>Stable Sound Feed</h3>
          <AudioVisualizer isListening={isListening && !isAnalyzing} type="horse" rms={rms} zcr={zcr} />
          
          <div style={{ minHeight: '120px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {audioEmotion && !isAnalyzing ? (
              <EmotionalMeter level={audioEmotion.level} message={audioEmotion.message} />
            ) : (
              <p className="text-muted text-center mt-4" style={{ opacity: 0.6 }}>Awaiting connection...</p>
            )}
          </div>

          <div className="flex justify-center mt-4 w-full">
            <button 
              className={`btn ${isListening ? 'btn-secondary' : 'btn-cta'}`}
              onClick={handleStartSensing}
              style={{ width: '100%' }}
            >
              {isListening ? <MicOff /> : <Mic />}
              {isListening ? 'End Connection' : 'Listen Now'}
            </button>
          </div>
        </div>

        {/* Movement Posture (Premium Gated) */}
        <div className="card flex-col items-center glass" style={{ position: 'relative', overflow: 'hidden' }}>
          <h3 className="text-center mb-4" style={{ color: 'var(--color-muted-teal)' }}>Paddock Movement Analyzer</h3>
          
          <div style={{ pointerEvents: isPremium ? 'auto' : 'none', opacity: isPremium ? 1 : 0.4, width: '100%', transition: 'opacity 0.4s ease' }}>
            <CameraView active={isListening && isPremium && !isAnalyzing} onPostureDetected={handlePostureUpdate} />
          </div>

          <div style={{ minHeight: '120px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isPremium && postureEmotion && !isAnalyzing ? (
              <EmotionalMeter level={postureEmotion.level} message={postureEmotion.details} />
            ) : (
              !isPremium ? null : <p className="text-muted text-center mt-4" style={{ opacity: 0.6 }}>Awaiting connection...</p>
            )}
          </div>

          {!isPremium && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(253, 251, 247, 0.6)',
              backdropFilter: 'blur(12px)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '2rem', textAlign: 'center', zIndex: 15
            }}>
              <Crown size={40} color="var(--color-soft-gold)" style={{ marginBottom: '1rem', filter: 'drop-shadow(0 0 10px rgba(233,196,106,0.5))' }} />
              <h4 style={{ fontSize: '1.4rem' }}>Unlock Stable AI</h4>
              <p className="text-muted" style={{ fontSize: '0.95rem', margin: '0.75rem 0 1.5rem', lineHeight: '1.5' }}>
                Monitor high-frequency pacing, leg stress stances, and field behaviors in real-time.
              </p>
              <button className="btn btn-primary" onClick={handleSelectPremiumFeature}>
                Unlock Premium
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Paywall */}
      {showPaywall && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(253, 251, 247, 0.8)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, animation: 'breathe 6s ease-in-out infinite'
        }}>
          <div className="card text-center glass" style={{ maxWidth: '480px', padding: '3rem 2.5rem', border: '1px solid rgba(255,255,255,0.9)' }}>
            <Crown size={56} color="var(--color-soft-gold)" style={{ margin: '0 auto 1.5rem', filter: 'drop-shadow(0 0 15px rgba(233,196,106,0.5))' }} />
            <h2 style={{ fontSize: '2rem' }}>Sense My Pet Premium</h2>
            <p className="text-muted mb-4" style={{ fontSize: '1.1rem', marginTop: '1rem', lineHeight: '1.6' }}>
              Deepen your connection through advanced multi-modal AI sensing.
            </p>
            
            <div style={{
              background: 'rgba(255,255,255,0.5)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem', margin: '2rem 0',
              textAlign: 'left'
            }}>
              <p style={{ fontWeight: 600, color: 'var(--color-text-dark)', marginBottom: '1rem' }}>Premium Features:</p>
              <ul style={{ fontSize: '1rem', listStyleType: 'none', paddingLeft: 0, color: 'var(--color-text-muted)' }}>
                <li style={{ margin: '0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>✨ Live Posture & Tail-Wag Analysis</li>
                <li style={{ margin: '0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>✨ Unlimited Voice Assistant Translation</li>
                <li style={{ margin: '0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>✨ Interactive History & Trends</li>
              </ul>
            </div>

            <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--color-text-dark)', marginBottom: '2rem' }}>
              ₹299 <span style={{ fontSize: '1.1rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>/ month</span>
            </div>

            <div className="flex gap-4 justify-center">
              <button className="btn btn-primary" onClick={() => { setIsPremium(true); setShowPaywall(false); }} style={{ padding: '1rem 2rem' }}>
                Subscribe (Razorpay)
              </button>
              <button className="btn" style={{ background: 'transparent', color: 'var(--color-text-muted)' }} onClick={() => setShowPaywall(false)}>
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
