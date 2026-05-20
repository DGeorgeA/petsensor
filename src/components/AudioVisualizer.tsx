import React, { useEffect, useRef } from 'react';

interface Props {
  isListening: boolean;
  type: 'dog' | 'horse' | 'cat';
  rms?: number;
  zcr?: number;
}

export default function AudioVisualizer({ isListening, type, rms = 0, zcr = 0 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationId: number;
    let time = 0;
    
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Draw warm glowing orb
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 80);
      
      // Determine colors based on animal type
      let activeColor = 'rgba(255, 170, 165, 0.9)'; // dog - warm peach
      let activeWaveColor = 'rgba(255, 170, 165, 0.6)';
      
      if (type === 'cat') {
        activeColor = 'rgba(220, 193, 242, 0.9)'; // cat - soft lavender
        activeWaveColor = 'rgba(220, 193, 242, 0.6)';
      } else if (type === 'horse') {
        activeColor = 'rgba(168, 230, 207, 0.9)'; // horse - calm sage/mint
        activeWaveColor = 'rgba(168, 230, 207, 0.6)';
      }
      
      if (isListening) {
        // Active sensing mode - dynamic pulsing matching RMS (mic signal level)
        const micPulse = rms * 200; // Amplify rms for visual effect
        const pulse = Math.sin(time * 0.05) * 5 + micPulse;
        
        gradient.addColorStop(0, activeColor);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, Math.max(30, 40 + pulse), 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw soft waves - wave height dynamic based on mic signal level and zcr
        ctx.beginPath();
        for (let i = 0; i < canvas.width; i++) {
          const waveHeight = Math.sin(i * (0.01 + zcr * 0.0001) + time * 0.08) * (15 + micPulse);
          if (i === 0) ctx.moveTo(i, centerY + waveHeight);
          else ctx.lineTo(i, centerY + waveHeight);
        }
        ctx.strokeStyle = activeWaveColor;
        ctx.lineWidth = 3;
        ctx.stroke();
        
      } else {
        // Idle mode
        gradient.addColorStop(0, 'rgba(200, 200, 200, 0.25)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
      
      time++;
      animationId = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isListening, type, rms, zcr]);

  return (
    <div className="visualizer-container" style={{ width: '100%', maxWidth: '300px', height: '180px', background: 'transparent', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <canvas ref={canvasRef} width={300} height={180} style={{ display: 'block', maxWidth: '100%' }} />
    </div>
  );
}
