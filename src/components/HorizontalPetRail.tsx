import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, Waves, Activity, Brain, Stethoscope } from 'lucide-react';

// Read Validation Suite visibility from localStorage
function getValidationVisible(): boolean {
  try {
    const stored = localStorage.getItem('smp_validation_visible');
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
}

const BASE_RAIL_ITEMS = [
  {
    path: '/dog-whisperer',
    icon: Heart,
    label: 'Sense My Dog',
    gradient: 'linear-gradient(135deg, #ffaaa5, #ffd3b6)',
    id: 'rail-dog',
  },
  {
    path: '/horse-whisperer',
    icon: Activity,
    label: 'Sense My Horse',
    gradient: 'linear-gradient(135deg, #a8e6cf, #dcedc1)',
    id: 'rail-horse',
  },
  {
    path: '/anxiety-tracker',
    icon: Brain,
    label: 'My Scans',
    gradient: 'linear-gradient(135deg, #ffd3b6, #f4d068)',
    id: 'rail-scans',
  },
  {
    path: '/vet-plus',
    icon: Stethoscope,
    label: 'Vet+',
    gradient: 'linear-gradient(135deg, #dcedc1, #a8e6cf)',
    id: 'rail-vet',
  },
  {
    path: '/vocal-calibration',
    icon: Waves,
    label: 'Validation Suite',
    gradient: 'linear-gradient(135deg, #f4d068, #ffd3b6)',
    id: 'rail-validation',
    isValidationSuite: true,
  },
];

export default function HorizontalPetRail() {
  const location = useLocation();
  const [validationVisible, setValidationVisible] = useState(getValidationVisible);

  // Re-check localStorage whenever focus returns (settings page may have changed it)
  useEffect(() => {
    const handleFocus = () => setValidationVisible(getValidationVisible());
    window.addEventListener('focus', handleFocus);
    // Also listen for a custom event fired by Settings page
    const handlePref = () => setValidationVisible(getValidationVisible());
    window.addEventListener('smp_pref_changed', handlePref);
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('smp_pref_changed', handlePref);
    };
  }, []);

  const railItems = BASE_RAIL_ITEMS.filter(
    (item) => !item.isValidationSuite || validationVisible
  );

  return (
    <div
      className="horizontal-rail-wrapper"
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      {/* ── INNER SCROLL CONTAINER (mobile) / CENTERED WRAP (desktop) ── */}
      <div
        className="horizontal-rail"
        style={{
          width: '100%',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch' as any,
          scrollbarWidth: 'none' as any,
          msOverflowStyle: 'none' as any,
          paddingBottom: '6px',
          scrollSnapType: 'x mandatory' as any,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 'clamp(0.45rem, 1.5vw, 0.7rem)',
            padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(0.25rem, 2vw, 0.5rem)',
            /* Key: justify center on desktop — items wrap when needed */
            justifyContent: 'center',
            flexWrap: 'wrap' as const,
            /* But on mobile they stay in a row */
            minWidth: 'max-content',
          }}
        >
          {railItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                id={item.id}
                to={item.path}
                aria-label={item.label}
                style={{
                  scrollSnapAlign: 'start',
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: 'clamp(0.6rem, 2vw, 0.8rem) clamp(0.9rem, 3vw, 1.35rem)',
                  borderRadius: '999px',
                  background: isActive ? item.gradient : 'rgba(255,255,255,0.72)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: isActive
                    ? '1.5px solid rgba(255,255,255,0.95)'
                    : '1.5px solid rgba(255,255,255,0.55)',
                  boxShadow: isActive
                    ? '0 6px 24px rgba(255, 170, 165, 0.35), 0 2px 8px rgba(0,0,0,0.04)'
                    : '0 2px 12px rgba(0,0,0,0.04)',
                  color: isActive ? '#4a403a' : 'var(--color-text-muted)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: 'clamp(0.82rem, 2vw, 0.93rem)',
                  whiteSpace: 'nowrap',
                  textDecoration: 'none',
                  transition: 'all 0.32s cubic-bezier(0.2, 0.8, 0.2, 1)',
                  transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
                  userSelect: 'none',
                  willChange: 'transform',
                }}
              >
                <item.icon
                  size={15}
                  style={{
                    color: isActive ? '#4a403a' : 'var(--color-text-muted)',
                    flexShrink: 0,
                    opacity: isActive ? 1 : 0.75,
                  }}
                />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
