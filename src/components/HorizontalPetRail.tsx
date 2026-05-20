import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Brain, Stethoscope, Waves } from 'lucide-react';

function getSetting(key: string, defaultValue = true): boolean {
  try {
    const stored = localStorage.getItem(key);
    return stored === null ? defaultValue : stored === 'true';
  } catch {
    return defaultValue;
  }
}

// ── DOG PAW SVG ──────────────────────────────────────────────────────────────
function DogPaw({ size = 17, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill={color} xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, display: 'block' }}>
      {/* Main palm pad */}
      <ellipse cx="16" cy="22" rx="6" ry="5" />
      {/* Toe pads - 4 clearly spaced */}
      <ellipse cx="7"  cy="15" rx="2.8" ry="3.4" />
      <ellipse cx="12" cy="12" rx="2.8" ry="3.4" />
      <ellipse cx="20" cy="12" rx="2.8" ry="3.4" />
      <ellipse cx="25" cy="15" rx="2.8" ry="3.4" />
    </svg>
  );
}

// ── CAT PAW SVG — 3 toes, rounder, more delicate ─────────────────────────────
function CatPaw({ size = 17, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill={color} xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, display: 'block' }}>
      {/* Main pad - rounder */}
      <ellipse cx="16" cy="22.5" rx="5.5" ry="5" />
      {/* 3 toe pads */}
      <circle cx="8"  cy="15" r="3.2" />
      <circle cx="16" cy="12" r="3.2" />
      <circle cx="24" cy="15" r="3.2" />
    </svg>
  );
}

// ── HORSE HOOF SVG — horseshoe silhouette ────────────────────────────────────
function HorseHoof({ size = 17, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill={color} xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, display: 'block' }}>
      {/* Horseshoe U — solid filled arc with open bottom */}
      <path d="
        M16 3
        C9 3 4 8 4 15
        L4 22
        Q4 26 8 26
        L11 26
        L11 20
        Q11 17 16 17
        Q21 17 21 20
        L21 26
        L24 26
        Q28 26 28 22
        L28 15
        C28 8 23 3 16 3 Z
      " />
      {/* Centre cleft groove */}
      <rect x="15" y="17" width="2" height="9" fill="rgba(255,255,255,0.28)" rx="1" />
    </svg>
  );
}

const BASE_RAIL_ITEMS = [
  {
    path: '/dog-whisperer',
    IconComponent: DogPaw,
    label: 'Sense My Dog',
    gradient: 'linear-gradient(135deg, #ff9e8a 0%, #ffbfaa 55%, #ffd4b8 100%)',
    activeGlow: 'rgba(255,140,120,0.45)',
    borderActive: 'rgba(255,180,155,0.85)',
    id: 'rail-dog',
    isDog: true,
  },
  {
    path: '/cat-whisperer',
    IconComponent: CatPaw,
    label: 'Sense My Cat',
    gradient: 'linear-gradient(135deg, #c9a8f0 0%, #dfc5f8 55%, #f0d8ff 100%)',
    activeGlow: 'rgba(200,168,240,0.45)',
    borderActive: 'rgba(210,180,250,0.85)',
    id: 'rail-cat',
    isCat: true,
  },
  {
    path: '/horse-whisperer',
    IconComponent: HorseHoof,
    label: 'Sense My Horse',
    gradient: 'linear-gradient(135deg, #7ecba8 0%, #a8dfc4 55%, #c8f0dc 100%)',
    activeGlow: 'rgba(126,203,168,0.45)',
    borderActive: 'rgba(155,220,190,0.85)',
    id: 'rail-horse',
    isHorse: true,
  },
  {
    path: '/anxiety-tracker',
    IconComponent: Brain,
    label: 'My Scans',
    gradient: 'linear-gradient(135deg, #f4c07a 0%, #f8d49c 55%, #fde8c0 100%)',
    activeGlow: 'rgba(244,192,122,0.40)',
    borderActive: 'rgba(248,210,155,0.85)',
    id: 'rail-scans',
    isScans: true,
  },
  {
    path: '/vet-plus',
    IconComponent: Stethoscope,
    label: 'Vet+',
    gradient: 'linear-gradient(135deg, #7ecba8 0%, #b8e8d0 55%, #d4f2e6 100%)',
    activeGlow: 'rgba(126,203,168,0.38)',
    borderActive: 'rgba(155,225,200,0.85)',
    id: 'rail-vet',
    isVet: true,
  },
  {
    path: '/vocal-calibration',
    IconComponent: Waves,
    label: 'Validation Suite',
    gradient: 'linear-gradient(135deg, #f4c07a 0%, #f8d49c 55%, #fde8c0 100%)',
    activeGlow: 'rgba(244,192,122,0.38)',
    borderActive: 'rgba(248,210,155,0.85)',
    id: 'rail-validation',
    isValidationSuite: true,
  },
];

export default function HorizontalPetRail() {
  const location = useLocation();
  const [prefs, setPrefs] = useState({
    dogVisible:        getSetting('smp_dog_visible',        true),
    catVisible:        getSetting('smp_cat_visible',        true),
    horseVisible:      getSetting('smp_horse_visible',      true),
    scansVisible:      getSetting('smp_scans_visible',      true),
    vetVisible:        getSetting('smp_vet_visible',        true),
    validationVisible: getSetting('smp_validation_visible', true),
  });

  const updatePrefs = () => {
    setPrefs({
      dogVisible:        getSetting('smp_dog_visible',        true),
      catVisible:        getSetting('smp_cat_visible',        true),
      horseVisible:      getSetting('smp_horse_visible',      true),
      scansVisible:      getSetting('smp_scans_visible',      true),
      vetVisible:        getSetting('smp_vet_visible',        true),
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
    if (item.isDog        && !prefs.dogVisible)        return false;
    if (item.isCat        && !prefs.catVisible)        return false;
    if (item.isHorse      && !prefs.horseVisible)      return false;
    if (item.isScans      && !prefs.scansVisible)      return false;
    if (item.isVet        && !prefs.vetVisible)        return false;
    if (item.isValidationSuite && !prefs.validationVisible) return false;
    return true;
  });

  return (
    <div className="horizontal-rail-wrapper" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <div
        className="horizontal-rail"
        style={{
          width: '100%', overflowX: 'auto',
          WebkitOverflowScrolling: 'touch' as any,
          scrollbarWidth: 'none' as any,
          msOverflowStyle: 'none' as any,
          paddingBottom: '6px',
          scrollSnapType: 'x mandatory' as any,
        }}
      >
        <div style={{
          display: 'flex',
          gap: 'clamp(0.55rem, 1.8vw, 0.85rem)',
          padding: 'clamp(0.5rem, 2vw, 0.85rem) clamp(0.25rem, 2vw, 0.5rem)',
          justifyContent: 'center',
          flexWrap: 'wrap' as const,
          minWidth: 'max-content',
        }}>
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
                  padding: isActive
                    ? 'clamp(0.65rem, 2.2vw, 0.92rem) clamp(1.1rem, 3.2vw, 1.6rem)'
                    : 'clamp(0.6rem, 2vw, 0.85rem) clamp(1rem, 3vw, 1.45rem)',
                  borderRadius: '999px',
                  background: isActive
                    ? item.gradient
                    : 'rgba(255, 252, 248, 0.72)',
                  backdropFilter: 'blur(22px)',
                  WebkitBackdropFilter: 'blur(22px)',
                  border: isActive
                    ? `1.5px solid ${item.borderActive}`
                    : '1.5px solid rgba(255,230,210,0.65)',
                  boxShadow: isActive
                    ? `0 6px 22px ${item.activeGlow}, 0 2px 8px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.60)`
                    : '0 2px 12px rgba(180,120,80,0.12), inset 0 1px 0 rgba(255,255,255,0.55)',
                  color: isActive ? '#3d302a' : '#6b5a52',
                  fontWeight: isActive ? 650 : 500,
                  fontSize: 'clamp(0.82rem, 2vw, 0.94rem)',
                  letterSpacing: isActive ? '0.008em' : '0',
                  whiteSpace: 'nowrap',
                  textDecoration: 'none',
                  transition: 'all 0.34s cubic-bezier(0.2, 0.8, 0.2, 1)',
                  transform: isActive ? 'translateY(-3px) scale(1.04)' : 'translateY(0) scale(1)',
                  userSelect: 'none',
                  willChange: 'transform, box-shadow',
                }}
              >
                <Ico size={16} color={isActive ? '#3d302a' : '#9a8070'} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
