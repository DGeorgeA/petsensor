import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Activity } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center text-center" style={{ marginTop: '4rem', padding: '0 1rem' }}>
      
      <div style={{ animation: 'breathe 6s ease-in-out infinite' }}>
        <Heart size={64} color="var(--color-sunset-coral)" strokeWidth={1.5} style={{ marginBottom: '1.5rem', filter: 'drop-shadow(0 0 20px rgba(229,152,155,0.4))' }} />
      </div>

      <h1 className="section-title" style={{ fontSize: '3.5rem', marginBottom: '1.5rem', color: 'var(--color-text-dark)', letterSpacing: '-0.03em' }}>
        Sense My Pet
      </h1>
      
      <p className="section-subtitle" style={{ fontSize: '1.35rem', lineHeight: '1.6', color: 'var(--color-text-muted)', maxWidth: '600px' }}>
        An emotionally intelligent AI companion. Discover your pet’s true feelings through warm, empathetic listening and gentle observation.
      </p>
      
      <div className="flex gap-6 mt-4 items-center justify-center flex-wrap" style={{ marginBottom: '5rem', marginTop: '1rem' }}>
        <Link to="/dog-whisperer" className="btn btn-cta">
          <Heart fill="currentColor" size={24} />
          Sense My Dog
        </Link>
        <Link to="/horse-whisperer" className="btn btn-primary glass" style={{ fontSize: '1.2rem', padding: '1.15rem 2.5rem' }}>
          <Activity size={24} />
          Sense My Horse
        </Link>
      </div>
      
      <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', width: '100%', maxWidth: '900px' }}>
        <div className="card text-center glass">
          <div className="visualizer-container mb-4" style={{ height: '160px', background: 'transparent', border: 'none' }}>
            <div className="breathing-orb" style={{ background: 'var(--gradient-sage)' }}></div>
          </div>
          <h3 style={{ fontSize: '1.5rem', color: 'var(--color-sage-green)' }}>Warm Audio Sensing</h3>
          <p className="text-muted mt-2" style={{ fontSize: '1.05rem' }}>Gently listens to vocalizations and subtle breathing to profoundly understand their comfort level.</p>
        </div>
        <div className="card text-center glass">
          <div className="visualizer-container mb-4" style={{ height: '160px', background: 'transparent', border: 'none' }}>
             <div className="breathing-orb" style={{ background: 'var(--gradient-teal)', animationDelay: '1s' }}></div>
          </div>
          <h3 style={{ fontSize: '1.5rem', color: 'var(--color-muted-teal)' }}>Gentle Observation</h3>
          <p className="text-muted mt-2" style={{ fontSize: '1.05rem' }}>Fluidly notices body language and posture to provide reassuring, emotionally intelligent insights.</p>
        </div>
      </div>
      
      <p className="text-muted mt-4" style={{ fontSize: '0.9rem', opacity: 0.6, marginTop: '5rem' }}>
        Sense My Pet is an AI-assisted wellness companion and does not replace professional veterinary care.
      </p>
    </div>
  );
}
