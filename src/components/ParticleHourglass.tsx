import React from 'react';

export default function ParticleHourglass() {
  return (
    <div className="analysis-overlay active" style={{ animation: 'breathe 4s ease-in-out infinite' }}>
      <div className="breathing-orb" style={{ marginBottom: '2rem' }}>
        {/* Generative particles */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div 
            key={i} 
            className="particle" 
            style={{ 
              left: `${50 + Math.cos(i * 30) * 30}%`, 
              top: `${50 + Math.sin(i * 30) * 30}%`,
              animationDelay: `${i * 0.15}s` 
            }} 
          />
        ))}
      </div>
      <h3 style={{ color: 'var(--color-sage-green)', fontSize: '1.35rem', fontWeight: 400 }}>
        Gently sensing...
      </h3>
      <p className="text-muted mt-2" style={{ fontSize: '0.95rem' }}>
        Tuning into subtle emotional frequencies
      </p>
    </div>
  );
}
