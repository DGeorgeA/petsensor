import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, Waves, Activity, Brain, Stethoscope, PawPrint } from 'lucide-react';

// Read preferences from localStorage
function getSetting(key: string, defaultValue = true): boolean {
  try {
    const stored = localStorage.getItem(key);
    return stored === null ? defaultValue : stored === 'true';
  } catch {
    return defaultValue;
  }
}

const BASE_RAIL_ITEMS = [
  {
    path: '/dog-whisperer',
    icon: PawPrint,
    label: 'Sense My Dog',
    gradient: 'linear-gradient(135deg, #ff8c7a, #ffaaa5)',
    id: 'rail-dog',
  },
  {
    path: '/cat-whisperer',
    icon: Heart,
    label: 'Sense My Cat',
    gradient: 'linear-gradient(135deg, #c8a2e8, #dcc8f5)',
    id: 'rail-cat',
    isCat: true,
  },
  {
    path: '/horse-whisperer',
    icon: Activity,
    label: 'Sense My Horse',
    gradient: 'linear-gradient(135deg, #8ed4b4, #a8e6cf)',
    id: 'rail-horse',
  },
  {
    path: '/anxiety-tracker',
    icon: Brain,
    label: 'My Scans',
    gradient: 'linear-gradient(135deg, #ffd3b6, #f4d068)',
    id: 'rail-scans',
    isScans: true,
  },
  {
    path: '/vet-plus',
    icon: Stethoscope,
    label: 'Vet+',
    gradient: 'linear-gradient(135deg, #dcedc1, #a8e6cf)',
    id: 'rail-vet',
    isVet: true,
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
  const [prefs, setPrefs] = useState({
    catVisible: getSetting('smp_cat_visible', true),
    scansVisible: getSetting('smp_scans_visible', true),
    vetVisible: getSetting('smp_vet_visible', true),
    validationVisible: getSetting('smp_validation_visible', true),
  });

  const updatePrefs = () => {
    setPrefs({
      catVisible: getSetting('smp_cat_visible', true),
      scansVisible: getSetting('smp_scans_visible', true),
      vetVisible: getSetting('smp_vet_visible', true),
      validationVisible: getSetting('smp_validation_visible', true),
    });
  };

  useEffect(() => {
    window.addEventListener('focus', updatePrefs);
    window.addEventListener('smp_pref_changed', updatePrefs);
    return () => {
      window.removeEventListener('focus', updatePrefs);
      window.removeEventListener('smp_pref_changed', updatePrefs);
    };
  }, []);

  const railItems = BASE_RAIL_ITEMS.filter((item) => {
    if (item.isCat && !prefs.catVisible) return false;
    if (item.isScans && !prefs.scansVisible) return false;
    if (item.isVet && !prefs.vetVisible) return false;
    if (item.isValidationSuite && !prefs.validationVisible) return false;
    return true;
  });

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
