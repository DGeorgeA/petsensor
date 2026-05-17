import React, { useEffect, useState } from 'react';

type AnxietyLevel = 'LOW' | 'MEDIUM' | 'HIGH';

interface Props {
  level: AnxietyLevel;
  message: string;
}

export default function EmotionalMeter({ level, message }: Props) {
  const [fillWidth, setFillWidth] = useState('0%');
  const [meterClass, setMeterClass] = useState('meter-low');

  useEffect(() => {
    // Stagger the animation for a fluid, magical fill effect
    const timer = setTimeout(() => {
      switch (level) {
        case 'LOW':
          setFillWidth('25%');
          setMeterClass('meter-low');
          break;
        case 'MEDIUM':
          setFillWidth('65%');
          setMeterClass('meter-medium');
          break;
        case 'HIGH':
          setFillWidth('95%');
          setMeterClass('meter-high');
          break;
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [level]);

  return (
    <div className="mt-6 w-full text-center" style={{ animation: 'breathe 5s ease-in-out infinite' }}>
      <p style={{ fontSize: '1.2rem', color: 'var(--color-text-dark)', fontWeight: 500, marginBottom: '0.5rem' }}>
        {message}
      </p>
      
      <div className="emotional-meter-container">
        <div className={`emotional-meter-fill ${meterClass}`} style={{ width: fillWidth }} />
      </div>
      
      <div className="flex justify-between mt-2 px-1 text-muted" style={{ fontSize: '0.8rem', opacity: 0.7 }}>
        <span>Calm</span>
        <span>Uneasy</span>
      </div>
    </div>
  );
}
