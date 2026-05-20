import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Brain, Stethoscope, Waves } from 'lucide-react';

// Read preferences from localStorage
function getSetting(key: string, defaultValue = true): boolean {
  try {
    const stored = localStorage.getItem(key);
    return stored === null ? defaultValue : stored === 'true';
  } catch {
    return defaultValue;
  }
}

// ── SPECIES ICON COMPONENTS ───────────────────────────────────────────────────
// Paw for Dog
function DogPaw({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      {/* Main pad */}
      <ellipse cx="12" cy="15.5" rx="4.2" ry="3.5" />
      {/* Four toes */}
      <ellipse cx="6.5"  cy="10.5" rx="1.8" ry="2.2" />
      <ellipse cx="10"   cy="8.5"  rx="1.8" ry="2.2" />
      <ellipse cx="14"   cy="8.5"  rx="1.8" ry="2.2" />
      <ellipse cx="17.5" cy="10.5" rx="1.8" ry="2.2" />
    </svg>
  );
}

// Cat paw (slightly smaller, more delicate toe spacing)
function CatPaw({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      {/* Main pad — rounder than dog */}
      <ellipse cx="12" cy="16" rx="3.8" ry="3.3" />
      {/* Three small toes (cats have 3 visible from front) */}
      <ellipse cx="7"   cy="11.5" rx="1.6" ry="2.0" />
      <ellipse cx="12"  cy="9.5"  rx="1.6" ry="2.0" />
      <ellipse cx="17"  cy="11.5" rx="1.6" ry="2.0" />
    </svg>
  );
}

// Horse hoof (simplified horseshoe-ish oval)
function HorseHoof({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      {/* Horseshoe shape */}
      <path
        d="M12 3 C7.5 3 4 6.5 4 11 L4 17 C4 18.1 4.9 19 6 19 L8 19 L8 15 C8 13.3 9.8 12 12 12 C14.2 12 16 13.3 16 15 L16 19 L18 19 C19.1 19 20 18.1 20 17 L20 11 C20 6.5 16.5 3 12 3 Z"
        fill={color}
      />
      {/* Central cleft line */}
      <path d="M12 12 L12 19" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const BASE_RAIL_ITEMS = [
  {
    path: '/dog-whisperer',
    IconComponent: DogPaw,
    label: 'Sense My Dog',
    gradient: 'linear-gradient(135deg, #ff9e8a 0%, #ffbfaa 60%, #ffd4b8 100%)',
    activeGlow: 'rgba(255,140,120,0.40)',
    borderActive: 'rgba(255,180,160,0.80)',
    id: 'rail-dog',
  },
  {
    path: '/cat-whisperer',
    IconComponent: CatPaw,
    label: 'Sense My Cat',
    gradient: 'linear-gradient(135deg, #c9a8f0 0%, #dfc5f8 55%, #f0d8ff 100%)',
    activeGlow: 'rgba(200,168,240,0.40)',
    borderActive: 'rgba(210,180,250,0.80)',
    id: 'rail-cat',
    isCat: true,
  },
  {
    path: '/horse-whisperer',
    IconComponent: HorseHoof,
    label: 'Sense My Horse',
    gradient: 'linear-gradient(135deg, #7ecba8 0%, #a8dfc4 55%, #c8f0dc 100%)',
    activeGlow: 'rgba(126,203,168,0.40)',
    borderActive: 'rgba(160,220,190,0.80)',
    id: 'rail-horse',
  },
  {
    path: '/anxiety-tracker',
    IconComponent: Brain,
    label: 'My Scans',
    gradient: 'linear-gradient(135deg, #f4c07a 0%, #f8d49c 55%, #fde8c0 100%)',
    activeGlow: 'rgba(244,192,122,0.40)',
    borderActive: 'rgba(248,210,160,0.80)',
    id: 'rail-scans',
    isScans: true,
  },
  {
    path: '/vet-plus',
    IconComponent: Stethoscope,
    label: 'Vet+',
    gradient: 'linear-gradient(135deg, #7ecba8 0%, #b8e8d0 55%, #d4f2e6 100%)',
    activeGlow: 'rgba(126,203,168,0.35)',
    borderActive: 'rgba(160,225,200,0.80)',
    id: 'rail-vet',
    isVet: true,
  },
  {
    path: '/vocal-calibration',
    IconComponent: Waves,
    label: 'Validation Suite',
    gradient: 'linear-gradient(135deg, #f4c07a 0%, #f8d49c 55%, #fde8c0 100%)',
    activeGlow: 'rgba(244,192,122,0.35)',
    borderActive: 'rgba(248,210,160,0.80)',
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
      style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
    >
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
            gap: 'clamp(0.55rem, 1.8vw, 0.85rem)',
            padding: 'clamp(0.5rem, 2vw, 0.85rem) clamp(0.25rem, 2vw, 0.5rem)',
            justifyContent: 'center',
            flexWrap: 'wrap' as const,
            minWidth: 'max-content',
          }}
        >
          {railItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Ico = item.IconComponent;
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
                  gap: '0.5rem',

                  /* ── PILL SHAPE: slightly taller, more rounded ── */
                  padding: isActive
                    ? 'clamp(0.65rem, 2.2vw, 0.92rem) clamp(1.1rem, 3.2vw, 1.6rem)'
                    : 'clamp(0.6rem, 2vw, 0.85rem) clamp(1rem, 3vw, 1.45rem)',
                  borderRadius: '999px',

                  /* Active: full species gradient + glow */
                  background: isActive
                    ? item.gradient
                    : 'rgba(255, 248, 243, 0.80)',
                  backdropFilter: 'blur(22px)',
                  WebkitBackdropFilter: 'blur(22px)',

                  /* Active: coloured border; idle: warm white border */
                  border: isActive
                    ? `1.5px solid ${item.borderActive}`
                    : '1.5px solid rgba(255, 220, 200, 0.55)',

                  /* Active: species glow; idle: very subtle warm shadow */
                  boxShadow: isActive
                    ? `0 6px 22px ${item.activeGlow}, 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.55)`
                    : '0 2px 10px rgba(200,150,120,0.10), inset 0 1px 0 rgba(255,255,255,0.45)',

                  color: isActive ? '#3d302a' : '#7a6a62',
                  fontWeight: isActive ? 650 : 500,
                  fontSize: 'clamp(0.82rem, 2vw, 0.94rem)',
                  letterSpacing: isActive ? '0.008em' : '0',
                  whiteSpace: 'nowrap',
                  textDecoration: 'none',
                  transition: 'all 0.34s cubic-bezier(0.2, 0.8, 0.2, 1)',
                  transform: isActive ? 'translateY(-3px) scale(1.03)' : 'translateY(0) scale(1)',
                  userSelect: 'none',
                  willChange: 'transform, box-shadow',
                }}
              >
                {/* Species icon — coloured when active, muted when idle */}
                <Ico
                  size={15}
                  color={isActive ? '#3d302a' : '#a09088'}
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
