/**
 * src/components/AudioVisualizer.tsx
 *
 * Premium multi-feature audio visualizer.
 * Renders:
 *   - Radial waveform orb (RMS-driven pulse)
 *   - Spectral centroid indicator ring
 *   - Frequency band bars (5 sub-bands)
 *   - Emotional state glow color (species-specific)
 *   - 60fps RAF animation, all canvas, zero DOM thrash
 */

import React, { useEffect, useRef } from 'react';

interface Props {
  isListening: boolean;
  type: 'dog' | 'cat';
  rms?: number;
  zcr?: number;
  spectralCentroid?: number;
}

// ── Species colour palettes ───────────────────────────────────────────────────
const PALETTE = {
  dog: {
    orb:    'rgba(255, 170, 165, 0.92)',
    glow:   'rgba(255, 170, 165, 0.35)',
    bars:   'rgba(255, 140, 132, 0.85)',
    ring:   'rgba(255, 200, 180, 0.6)',
    idle:   'rgba(255, 210, 205, 0.3)',
  },
  cat: {
    orb:    'rgba(200, 175, 242, 0.92)',
    glow:   'rgba(200, 175, 242, 0.35)',
    bars:   'rgba(175, 145, 230, 0.85)',
    ring:   'rgba(220, 200, 250, 0.6)',
    idle:   'rgba(210, 195, 240, 0.3)',
  },
};

export default function AudioVisualizer({
  isListening,
  type,
  rms = 0,
  zcr = 0,
  spectralCentroid = 0,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);

  // Smoothed values (EMA) to avoid jitter
  const smoothedRms = useRef(0);
  const smoothedCentroid = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pal = PALETTE[type];
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2 - 10;

    const draw = () => {
      timeRef.current += 1;
      const t = timeRef.current;

      // EMA smoothing
      const alpha = 0.15;
      smoothedRms.current += alpha * (rms - smoothedRms.current);
      smoothedCentroid.current += alpha * (spectralCentroid - smoothedCentroid.current);

      ctx.clearRect(0, 0, W, H);

      if (!isListening) {
        // ── Idle state: soft breathing orb ────────────────────────────
        const breathe = Math.sin(t * 0.025) * 5;
        const r = 28 + breathe;

        const idleGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r + 15);
        idleGrad.addColorStop(0, pal.idle);
        idleGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.beginPath();
        ctx.arc(cx, cy, r + 15, 0, Math.PI * 2);
        ctx.fillStyle = idleGrad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = pal.idle;
        ctx.fill();

        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const sRms = smoothedRms.current;
      const sCentroid = smoothedCentroid.current;

      // ── Outer glow ────────────────────────────────────────────────
      const glowR = 75 + sRms * 160;
      const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      glowGrad.addColorStop(0, pal.glow.replace('0.35', String(0.18 + sRms * 0.4)));
      glowGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
      ctx.fillStyle = glowGrad;
      ctx.fill();

      // ── Radial waveform (12 petals, driven by RMS + ZCR) ─────────
      const petalCount = 16;
      const baseR = 32 + sRms * 40;
      ctx.beginPath();
      for (let i = 0; i <= petalCount * 2; i++) {
        const angle = (i / (petalCount * 2)) * Math.PI * 2;
        const zcrMod = Math.sin(angle * (1 + zcr * 0.002) + t * 0.04);
        const petalR = baseR + zcrMod * (10 + sRms * 25);
        const x = cx + Math.cos(angle) * petalR;
        const y = cy + Math.sin(angle) * petalR;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      const petalGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR + 35);
      petalGrad.addColorStop(0, pal.orb);
      petalGrad.addColorStop(1, pal.orb.replace('0.92', '0.25'));
      ctx.fillStyle = petalGrad;
      ctx.fill();

      // ── Core orb ──────────────────────────────────────────────────
      const orbR = 22 + sRms * 18;
      const orbGrad = ctx.createRadialGradient(cx - 5, cy - 5, 0, cx, cy, orbR);
      orbGrad.addColorStop(0, 'rgba(255,255,255,0.95)');
      orbGrad.addColorStop(0.4, pal.orb);
      orbGrad.addColorStop(1, pal.glow);
      ctx.beginPath();
      ctx.arc(cx, cy, orbR, 0, Math.PI * 2);
      ctx.fillStyle = orbGrad;
      ctx.fill();

      // ── Spectral centroid indicator ring ──────────────────────────
      const ringR = 58 + sRms * 20;
      const arcLen = sCentroid * Math.PI * 2; // centroid normalized 0–1
      ctx.beginPath();
      ctx.arc(cx, cy, ringR, -Math.PI / 2, -Math.PI / 2 + arcLen);
      ctx.strokeStyle = pal.ring;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();

      // ── Sub-band frequency bars (bottom strip) ────────────────────
      const barCount = 5;
      const barW = 10;
      const barGap = 7;
      const totalBarW = barCount * (barW + barGap) - barGap;
      const barStartX = cx - totalBarW / 2;
      const barBaseY = H - 16;
      const maxBarH = 32;

      // Synthesize rough sub-band energy from centroid + zcr + rms
      // (real sub-band data would come from the worker, but this gives a vivid visual)
      const bandEnergies = [
        Math.max(0, (0.4 - sCentroid) * 2) * sRms * 3,          // sub-bass
        Math.max(0, (0.2 - Math.abs(sCentroid - 0.1))) * sRms * 4,  // bass
        Math.max(0, 0.3 - Math.abs(sCentroid - 0.25)) * sRms * 5 + zcr * 0.0003, // lo-mid
        Math.max(0, sCentroid - 0.25) * sRms * 6,               // mid
        Math.max(0, sCentroid - 0.4) * sRms * 8 + zcr * 0.0005, // high
      ].map((v, i) => {
        // Animate with slight offset per band
        return Math.min(1, v + Math.sin(t * 0.05 + i * 0.8) * 0.05 * sRms);
      });

      for (let b = 0; b < barCount; b++) {
        const bH = Math.max(3, bandEnergies[b] * maxBarH);
        const bX = barStartX + b * (barW + barGap);
        const bY = barBaseY - bH;

        const barGrad = ctx.createLinearGradient(0, bY, 0, barBaseY);
        barGrad.addColorStop(0, pal.bars);
        barGrad.addColorStop(1, pal.bars.replace('0.85', '0.2'));
        ctx.beginPath();
        ctx.roundRect(bX, bY, barW, bH, 4);
        ctx.fillStyle = barGrad;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isListening, type, rms, zcr, spectralCentroid]);

  return (
    <div
      style={{
        width: '100%', maxWidth: 280, height: 200,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        background: 'transparent', margin: '0 auto',
      }}
    >
      <canvas
        ref={canvasRef}
        width={280}
        height={200}
        style={{ display: 'block', width: '100%', maxWidth: 280 }}
      />
    </div>
  );
}
