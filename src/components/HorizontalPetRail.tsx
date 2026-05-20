import React, { useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, Waves, Activity, Brain, Smile, Shield } from 'lucide-react';

const RAIL_ITEMS = [
  { path: '/dog-whisperer',   icon: Heart,    label: 'Sense My Dog',   gradient: 'linear-gradient(135deg, #ffaaa5, #ffd3b6)' },
  { path: '/horse-whisperer', icon: Activity, label: 'Sense My Horse',  gradient: 'linear-gradient(135deg, #a8e6cf, #dcedc1)' },
  { path: '/anxiety-tracker', icon: Brain,    label: 'Anxiety Scan',   gradient: 'linear-gradient(135deg, #ffd3b6, #f4d068)' },
  { path: '/wellness-studio', icon: Smile,    label: 'Pet Mood',       gradient: 'linear-gradient(135deg, #dcedc1, #a8e6cf)' },
  { path: '/vocal-calibration',icon: Waves,   label: 'Whisperer Mode', gradient: 'linear-gradient(135deg, #f4d068, #ffd3b6)' },
  { path: '/api-docs',        icon: Shield,   label: 'Developer API',  gradient: 'linear-gradient(135deg, #ffaaa5, #dcedc1)' },
];

export default function HorizontalPetRail() {
  const location = useLocation();
  const railRef = useRef<HTMLDivElement>(null);

  return (
    <div
      style={{
        width: '100%',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        paddingBottom: '4px',
        /* Snap */
        scrollSnapType: 'x mandatory',
      }}
      className="horizontal-rail"
    >
      <div
        ref={railRef}
        style={{
          display: 'flex',
          gap: 'clamp(0.6rem, 2vw, 0.9rem)',
          padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(0.5rem, 3vw, 1rem)',
          width: 'max-content',
        }}
      >
        {RAIL_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                scrollSnapAlign: 'start',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: 'clamp(0.65rem, 2vw, 0.85rem) clamp(1rem, 3vw, 1.5rem)',
                borderRadius: '999px',
                background: isActive ? item.gradient : 'rgba(255,255,255,0.65)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: isActive
                  ? '1.5px solid rgba(255,255,255,0.9)'
                  : '1.5px solid rgba(255,255,255,0.5)',
                boxShadow: isActive
                  ? '0 6px 20px rgba(255, 170, 165, 0.3)'
                  : '0 2px 10px rgba(0,0,0,0.05)',
                color: isActive ? '#4a403a' : 'var(--color-text-muted)',
                fontWeight: isActive ? 600 : 500,
                fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                whiteSpace: 'nowrap',
                textDecoration: 'none',
                transition: 'all 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)',
                transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
                userSelect: 'none',
              }}
            >
              <item.icon
                size={16}
                style={{
                  color: isActive ? '#4a403a' : 'var(--color-text-muted)',
                  flexShrink: 0,
                }}
              />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
