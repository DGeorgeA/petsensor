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

// ─────────────────────────────────────────────────────────────────────────────
// PAW / HOOF SHAPED BUTTON BACKGROUNDS
// All paths use viewBox="0 0 100 100" + preserveAspectRatio="none"
// so they scale to any button size without distortion.
// ─────────────────────────────────────────────────────────────────────────────

/** Dog paw outline: rounded body + 4 toe bumps at the top */
const DOG_PAW_PATH =
  'M 10,100 L 90,100 Q 100,100 100,88 L 100,62' +
  ' C 100,44 93,30 84,22' +
  ' L 78,12 C 75,4 70,2 67,8 L 64,20 C 63,24 61,24 59,20 L 56,8' +
  ' C 53,2 49,2 46,8 L 43,20 C 41,24 39,24 37,20 L 34,8' +
  ' C 31,2 27,4 24,12' +
  ' L 18,22 C 9,30 0,44 0,62' +
  ' L 0,88 Q 0,100 10,100 Z';

/** Cat paw outline: rounded body + 3 toe bumps (wider, more circular) */
const CAT_PAW_PATH =
  'M 10,100 L 90,100 Q 100,100 100,86 L 100,60' +
  ' C 100,40 92,26 82,18' +
  ' L 76,8 C 72,0 66,0 62,8 L 58,20 C 56,25 54,25 52,20 L 48,6' +
  ' C 45,0 41,0 38,6 L 34,20 C 32,25 30,25 28,20 L 24,8' +
  ' C 20,0 14,0 10,8' +
  ' L 6,18 C -2,28 0,44 0,62' +
  ' L 0,86 Q 0,100 10,100 Z';

/** Horse hoof outline: arch / dome shape (horseshoe silhouette) */
const HORSE_HOOF_PATH =
  'M 6,100 L 94,100 L 94,72' +
  ' C 94,50 86,32 72,20' +
  ' C 60,10 50,5 50,5' +
  ' C 50,5 40,10 28,20' +
  ' C 14,32 6,50 6,72 Z';

// ─────────────────────────────────────────────────────────────────────────────
// SPECIES ICON COMPONENTS (used inside shaped buttons)
// ─────────────────────────────────────────────────────────────────────────────
function DogPawIcon({ size = 15, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill={color} style={{ flexShrink: 0, display: 'block' }}>
      <ellipse cx="16" cy="22" rx="6" ry="5" />
      <ellipse cx="7"  cy="14" rx="2.8" ry="3.4" />
      <ellipse cx="12" cy="11" rx="2.8" ry="3.4" />
      <ellipse cx="20" cy="11" rx="2.8" ry="3.4" />
      <ellipse cx="25" cy="14" rx="2.8" ry="3.4" />
    </svg>
  );
}

function CatPawIcon({ size = 15, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill={color} style={{ flexShrink: 0, display: 'block' }}>
      <ellipse cx="16" cy="22" rx="5.5" ry="5" />
      <circle cx="8"  cy="14" r="3.2" />
      <circle cx="16" cy="11" r="3.2" />
      <circle cx="24" cy="14" r="3.2" />
    </svg>
  );
}

function HorseHoofIcon({ size = 15, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill={color} style={{ flexShrink: 0, display: 'block' }}>
      <path d="M16 3 C9 3 4 8 4 15 L4 22 Q4 26 8 26 L11 26 L11 20 Q11 17 16 17 Q21 17 21 20 L21 26 L24 26 Q28 26 28 22 L28 15 C28 8 23 3 16 3 Z" />
      <rect x="15" y="17" width="2" height="9" fill="rgba(255,255,255,0.30)" rx="1" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHAPED BUTTON COMPONENT
// Renders the species-specific SVG shape as the background, text on top
// ─────────────────────────────────────────────────────────────────────────────
interface ShapedButtonProps {
  path: string;             // SVG path for button shape
  id: string;
  to: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  activeColor1: string;
  activeColor2: string;
  glowColor: string;
  gradId: string;
}

function ShapedButton({
  path, id, to, label, icon, isActive,
  activeColor1, activeColor2, glowColor, gradId,
}: ShapedButtonProps) {
  const idleC1 = 'rgba(255, 252, 248, 0.88)';
  const idleC2 = 'rgba(255, 240, 228, 0.78)';
  const c1 = isActive ? activeColor1 : idleC1;
  const c2 = isActive ? activeColor2 : idleC2;
  const strokeColor = isActive ? activeColor2 : 'rgba(255, 225, 205, 0.70)';

  return (
    <Link
      id={id}
      to={to}
      aria-label={label}
      style={{
        scrollSnapAlign: 'start',
        flexShrink: 0,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        /* Extra top padding so the toe bumps have space */
        padding: 'clamp(1.2rem, 3vw, 1.5rem) clamp(1.1rem, 3.2vw, 1.65rem) clamp(0.65rem, 2vw, 0.85rem)',
        textDecoration: 'none',
        transition: 'filter 0.34s ease, transform 0.34s cubic-bezier(0.2, 0.8, 0.2, 1)',
        transform: isActive ? 'translateY(-4px) scale(1.05)' : 'translateY(0) scale(1)',
        filter: isActive
          ? `drop-shadow(0 6px 18px ${glowColor}) drop-shadow(0 2px 6px rgba(0,0,0,0.08))`
          : 'drop-shadow(0 2px 8px rgba(180,120,80,0.14))',
        userSelect: 'none',
        willChange: 'transform, filter',
        whiteSpace: 'nowrap',
      }}
    >
      {/* SVG shape background — stretches to fill with preserveAspectRatio="none" */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
        aria-hidden
      >
        <defs>
          <linearGradient id={`${gradId}-fill`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
          {/* Subtle inset gloss overlay */}
          <linearGradient id={`${gradId}-gloss`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
            <stop offset="55%" stopColor="rgba(255,255,255,0.00)" />
          </linearGradient>
        </defs>
        {/* Fill */}
        <path d={path} fill={`url(#${gradId}-fill)`} />
        {/* Gloss overlay */}
        <path d={path} fill={`url(#${gradId}-gloss)`} />
        {/* Border stroke */}
        <path d={path} fill="none" stroke={strokeColor} strokeWidth="2" />
      </svg>

      {/* Text + icon — above SVG */}
      <span style={{
        position: 'relative', zIndex: 1,
        display: 'inline-flex', alignItems: 'center', gap: '0.48rem',
        color: isActive ? '#3d302a' : '#6b5a52',
        fontWeight: isActive ? 660 : 510,
        fontSize: 'clamp(0.80rem, 1.9vw, 0.92rem)',
        letterSpacing: isActive ? '0.01em' : '0',
      }}>
        {icon}
        {label}
      </span>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RAIL ITEM DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────
const BASE_RAIL_ITEMS = [
  {
    path: '/dog-whisperer',
    shape: DOG_PAW_PATH,
    icon: <DogPawIcon />,
    activeIcon: <DogPawIcon color="#3d302a" />,
    label: 'Sense My Dog',
    activeColor1: '#ff9e8a',
    activeColor2: '#ffd4b8',
    glowColor: 'rgba(255,140,120,0.50)',
    id: 'rail-dog', isDog: true,
  },
  {
    path: '/cat-whisperer',
    shape: CAT_PAW_PATH,
    icon: <CatPawIcon />,
    activeIcon: <CatPawIcon color="#3d302a" />,
    label: 'Sense My Cat',
    activeColor1: '#c9a8f0',
    activeColor2: '#f0d8ff',
    glowColor: 'rgba(200,168,240,0.50)',
    id: 'rail-cat', isCat: true,
  },
  {
    path: '/horse-whisperer',
    shape: HORSE_HOOF_PATH,
    icon: <HorseHoofIcon />,
    activeIcon: <HorseHoofIcon color="#3d302a" />,
    label: 'Sense My Horse',
    activeColor1: '#7ecba8',
    activeColor2: '#c8f0dc',
    glowColor: 'rgba(126,203,168,0.50)',
    id: 'rail-horse', isHorse: true,
  },
];

// Standard pill items (unchanged shape)
const EXTRA_RAIL_ITEMS = [
  {
    path: '/anxiety-tracker', IconComponent: Brain,
    label: 'My Scans',
    gradient: 'linear-gradient(135deg, #f4c07a 0%, #fde8c0 100%)',
    activeGlow: 'rgba(244,192,122,0.42)',
    borderActive: 'rgba(248,210,155,0.85)',
    id: 'rail-scans', isScans: true,
  },
  {
    path: '/vet-plus', IconComponent: Stethoscope,
    label: 'Vet+',
    gradient: 'linear-gradient(135deg, #7ecba8 0%, #d4f2e6 100%)',
    activeGlow: 'rgba(126,203,168,0.40)',
    borderActive: 'rgba(155,225,200,0.85)',
    id: 'rail-vet', isVet: true,
  },
  {
    path: '/vocal-calibration', IconComponent: Waves,
    label: 'Validation Suite',
    gradient: 'linear-gradient(135deg, #f4c07a 0%, #fde8c0 100%)',
    activeGlow: 'rgba(244,192,122,0.40)',
    borderActive: 'rgba(248,210,155,0.85)',
    id: 'rail-validation', isValidationSuite: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
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

  const updatePrefs = () => setPrefs({
    dogVisible:        getSetting('smp_dog_visible',        true),
    catVisible:        getSetting('smp_cat_visible',        true),
    horseVisible:      getSetting('smp_horse_visible',      true),
    scansVisible:      getSetting('smp_scans_visible',      true),
    vetVisible:        getSetting('smp_vet_visible',        true),
    validationVisible: getSetting('smp_validation_visible', true),
  });

  useEffect(() => {
    window.addEventListener('focus', updatePrefs);
    window.addEventListener('smp_pref_changed', updatePrefs);
    return () => {
      window.removeEventListener('focus', updatePrefs);
      window.removeEventListener('smp_pref_changed', updatePrefs);
    };
  }, []);

  const visibleSpecies = BASE_RAIL_ITEMS.filter(item => {
    if (item.isDog   && !prefs.dogVisible)   return false;
    if (item.isCat   && !prefs.catVisible)   return false;
    if (item.isHorse && !prefs.horseVisible) return false;
    return true;
  });

  const visibleExtras = EXTRA_RAIL_ITEMS.filter(item => {
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
          flexWrap: 'wrap' as const,
          justifyContent: 'center',
          gap: 'clamp(0.55rem, 1.8vw, 0.9rem)',
          padding: 'clamp(0.5rem, 2vw, 0.85rem) clamp(0.25rem, 2vw, 0.5rem)',
          minWidth: 'max-content',
        }}>
          {/* ── SHAPED SPECIES BUTTONS ─── */}
          {visibleSpecies.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ShapedButton
                key={item.path}
                id={item.id}
                to={item.path}
                path={item.shape}
                label={item.label}
                icon={isActive ? item.activeIcon : item.icon}
                isActive={isActive}
                activeColor1={item.activeColor1}
                activeColor2={item.activeColor2}
                glowColor={item.glowColor}
                gradId={item.id}
              />
            );
          })}

          {/* ── REGULAR PILL BUTTONS (Scans, Vet+, Validation) ─── */}
          {visibleExtras.map((item) => {
            const isActive = location.pathname === item.path;
            const Ico = item.IconComponent;
            return (
              <Link
                key={item.path}
                id={item.id}
                to={item.path}
                aria-label={item.label}
                style={{
                  scrollSnapAlign: 'start', flexShrink: 0,
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  padding: isActive
                    ? 'clamp(0.65rem, 2.2vw, 0.92rem) clamp(1.1rem, 3.2vw, 1.6rem)'
                    : 'clamp(0.6rem, 2vw, 0.85rem) clamp(1rem, 3vw, 1.45rem)',
                  borderRadius: '999px',
                  background: isActive ? item.gradient : 'rgba(255,252,248,0.80)',
                  backdropFilter: 'blur(22px)',
                  WebkitBackdropFilter: 'blur(22px)',
                  border: isActive
                    ? `1.5px solid ${item.borderActive}`
                    : '1.5px solid rgba(255,225,200,0.60)',
                  boxShadow: isActive
                    ? `0 6px 22px ${item.activeGlow}, inset 0 1px 0 rgba(255,255,255,0.60)`
                    : '0 2px 10px rgba(180,120,80,0.10), inset 0 1px 0 rgba(255,255,255,0.50)',
                  color: isActive ? '#3d302a' : '#6b5a52',
                  fontWeight: isActive ? 650 : 510,
                  fontSize: 'clamp(0.82rem, 2vw, 0.94rem)',
                  whiteSpace: 'nowrap',
                  textDecoration: 'none',
                  transition: 'all 0.34s cubic-bezier(0.2, 0.8, 0.2, 1)',
                  transform: isActive ? 'translateY(-3px) scale(1.04)' : 'translateY(0) scale(1)',
                  userSelect: 'none',
                }}
              >
                <Ico size={15} color={isActive ? '#3d302a' : '#9a8070'} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
