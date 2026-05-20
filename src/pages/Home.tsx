import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center text-center" style={{ marginTop: 'min(10vh, 2rem)', padding: '0 1rem', position: 'relative', zIndex: 1 }}>
      
      {/* Cinematic Watermark Video Substitutes */}
      <div style={{ position: 'fixed', inset: 0, zIndex: -2, pointerEvents: 'none', overflow: 'hidden', background: 'var(--color-bg-cream)' }}>
        <img src="/assets/watermark_beagle.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.15, filter: 'blur(4px)', animation: 'cinematic-pan 30s ease-in-out infinite alternate', willChange: 'transform' }} loading="lazy" />
        <img src="/assets/watermark_cat.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.08, filter: 'blur(3px)', animation: 'cinematic-zoom 25s ease-in-out infinite alternate-reverse', willChange: 'transform' }} loading="lazy" />
      </div>

      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ animation: 'breathe 6s ease-in-out infinite' }}
      >
        <Heart size={64} color="var(--color-sunset-coral)" strokeWidth={1.5} style={{ marginBottom: '1.5rem', filter: 'drop-shadow(0 0 20px rgba(229,152,155,0.4))' }} />
      </motion.div>

      <motion.h1 
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
        className="section-title" style={{ fontSize: '3.5rem', marginBottom: '1.5rem', color: 'var(--color-text-dark)', letterSpacing: '-0.03em' }}
      >
        Sense My Pet
      </motion.h1>
      
      <motion.p 
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        className="section-subtitle" style={{ color: 'var(--color-text-dark)', maxWidth: '600px', fontWeight: 400 }}
      >
        An emotionally intelligent AI companion. Discover your pet’s true feelings through warm, empathetic listening and gentle observation.
      </motion.p>
      
      <motion.div 
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
        className="flex gap-4 mt-4 items-center justify-center flex-wrap w-full" style={{ marginBottom: 'clamp(2rem, 8vh, 5rem)', marginTop: '1rem' }}
      >
        <Link to="/dog-whisperer" className="btn btn-cta">
          <Heart fill="currentColor" size={24} />
          Sense My Dog
        </Link>
        <Link to="/horse-whisperer" className="btn btn-primary glass">
          <Activity size={24} />
          Sense My Horse
        </Link>
      </motion.div>
      
      <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', width: '100%', maxWidth: '900px' }}>
        <motion.div whileHover={{ y: -5 }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card text-center glass">
          <div className="visualizer-container mb-4" style={{ height: '160px', background: 'transparent', border: 'none' }}>
            <div className="breathing-orb" style={{ background: 'var(--gradient-sage)' }}></div>
          </div>
          <h3 style={{ fontSize: '1.5rem', color: 'var(--color-sage-green)' }}>Warm Audio Sensing</h3>
          <p className="text-muted mt-2" style={{ fontSize: '1.05rem' }}>Gently listens to vocalizations and subtle breathing to profoundly understand their comfort level.</p>
        </motion.div>
        
        <motion.div whileHover={{ y: -5 }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card text-center glass">
          <div className="visualizer-container mb-4" style={{ height: '160px', background: 'transparent', border: 'none' }}>
             <div className="breathing-orb" style={{ background: 'var(--gradient-teal)', animationDelay: '1s' }}></div>
          </div>
          <h3 style={{ fontSize: '1.5rem', color: 'var(--color-muted-teal)' }}>Gentle Observation</h3>
          <p className="text-muted mt-2" style={{ fontSize: '1.05rem' }}>Fluidly notices body language and posture to provide reassuring, emotionally intelligent insights.</p>
        </motion.div>
      </div>
      
      <motion.p 
        initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ delay: 0.8 }}
        className="text-muted mt-4" style={{ fontSize: '0.9rem', marginTop: '5rem' }}
      >
        Sense My Pet is an AI-assisted wellness companion and does not replace professional veterinary care.
      </motion.p>
    </div>
  );
}
