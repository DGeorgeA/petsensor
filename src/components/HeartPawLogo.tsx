import React from 'react';

interface HeartPawLogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * HeartPawLogo — A premium heart shape formed by soft paw curves.
 * Colors: soft coral #ffaaa5, warm peach #ffd3b6, muted rose #e8958a, sage #a8d5b5
 * Scales beautifully from 24px (navbar) to 200px (splash).
 */
export default function HeartPawLogo({ size = 34, className, style }: HeartPawLogoProps) {
  const id = `hpl_${size}`; // unique gradient id per size
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Sense My Pet logo"
      role="img"
      style={{ flexShrink: 0, ...style }}
    >
      <defs>
        {/* Main heart gradient: coral → peach */}
        <linearGradient id={`${id}_heart`} x1="20" y1="10" x2="80" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffaaa5" />
          <stop offset="55%" stopColor="#ffd3b6" />
          <stop offset="100%" stopColor="#e8958a" />
        </linearGradient>
        {/* Paw pad gradient: sage accent */}
        <linearGradient id={`${id}_paw`} x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#a8d5b5" stopOpacity="0.7" />
        </linearGradient>
        {/* Soft glow filter */}
        <filter id={`${id}_glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── HEART SHAPE ────────────────────────────────────────────────────
          Two cubic bezier curves forming a classic heart, starting from
          the bottom-centre point (50, 88) going counter-clockwise.
          Left lobe: from bottom → top-left bump
          Right lobe: from top-right bump → bottom
      ────────────────────────────────────────────────────────────────── */}
      <path
        d="
          M 50 85
          C 20 68, 8 52, 8 36
          C 8 20, 20 12, 32 12
          C 40 12, 47 17, 50 23
          C 53 17, 60 12, 68 12
          C 80 12, 92 20, 92 36
          C 92 52, 80 68, 50 85
          Z
        "
        fill={`url(#${id}_heart)`}
        filter={`url(#${id}_glow)`}
      />

      {/* ── PAW PADS INSIDE THE HEART ──────────────────────────────────────
          1 large central pad + 3 small toe pads arranged naturally
          All use a soft white→sage gradient for warmth
      ────────────────────────────────────────────────────────────────── */}

      {/* Central large pad */}
      <ellipse
        cx="50"
        cy="56"
        rx="10"
        ry="8"
        fill={`url(#${id}_paw)`}
      />

      {/* Top-left toe */}
      <ellipse
        cx="36"
        cy="44"
        rx="5.5"
        ry="5"
        fill={`url(#${id}_paw)`}
      />

      {/* Top-center toe */}
      <ellipse
        cx="50"
        cy="40"
        rx="5.5"
        ry="5"
        fill={`url(#${id}_paw)`}
      />

      {/* Top-right toe */}
      <ellipse
        cx="64"
        cy="44"
        rx="5.5"
        ry="5"
        fill={`url(#${id}_paw)`}
      />

      {/* ── SUBTLE HIGHLIGHT SHEEN ─────────────────────────────────────── */}
      <ellipse
        cx="40"
        cy="28"
        rx="12"
        ry="7"
        fill="white"
        opacity="0.18"
        transform="rotate(-20 40 28)"
      />
    </svg>
  );
}
