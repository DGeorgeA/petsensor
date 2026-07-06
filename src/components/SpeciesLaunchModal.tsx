import React, { useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { ScanMode } from '../lib/unifiedEngine';
import ScanModeChooser from './ScanModeChooser';
import { PET_PHOTOS } from '../lib/petPhotos';

interface Props {
  species: 'dog' | 'cat' | null;
  onSelect: (species: 'dog' | 'cat', mode: ScanMode) => void;
  onClose: () => void;
}

/**
 * SpeciesLaunchModal — tapping a Home species circle opens this popup so the
 * user sees Listen / Scan / Both in a SINGLE view. Selecting one starts that
 * scan (the tap flows through to the species page as the trusted media gesture).
 */
export default function SpeciesLaunchModal({ species, onSelect, onClose }: Props) {
  const open = species !== null;

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleSelect = useCallback((mode: ScanMode) => {
    if (species) onSelect(species, mode);
  }, [species, onSelect]);

  const photo = species ? PET_PHOTOS[species] : null;
  const accent = species === 'cat' ? 'var(--cat-accent)' : 'var(--dog-accent)';
  const title = species === 'cat' ? 'Sense My Cat' : 'Sense My Dog';

  return (
    <AnimatePresence>
      {open && photo && (
        <>
          <motion.div
            key="launch-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 210,
              background: 'rgba(48, 28, 14, 0.5)',
              backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
              cursor: 'pointer',
            }}
          />
          <motion.div
            key="launch-card"
            role="dialog" aria-modal="true" aria-label={`Start a ${species} check`}
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300, mass: 0.85 }}
            data-species={species}
            style={{
              position: 'fixed', zIndex: 211,
              ...(window.innerWidth >= 640
                ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
                : { bottom: '0.85rem', left: '0.7rem', right: '0.7rem' }),
              width: window.innerWidth >= 640 ? 'min(500px, 92vw)' : undefined,
              background: 'linear-gradient(160deg, rgba(255,252,248,0.98), rgba(255,243,235,0.96))',
              backdropFilter: 'blur(26px)', WebkitBackdropFilter: 'blur(26px)',
              borderRadius: 28,
              border: '1.5px solid rgba(255,255,255,0.9)',
              boxShadow: '0 30px 80px rgba(60,30,10,0.24)',
              padding: 'clamp(1.4rem, 4vw, 1.9rem)',
              overflow: 'hidden',
            }}
          >
            <button
              onClick={onClose} aria-label="Close"
              style={{
                position: 'absolute', top: '0.9rem', right: '0.9rem', width: 30, height: 30,
                borderRadius: '50%', background: 'rgba(255,255,255,0.9)',
                border: `1.5px solid ${accent}44`, display: 'flex',
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#7a6058', zIndex: 2,
              }}
            >
              <X size={15} />
            </button>

            {/* Pet avatar + title */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '1.1rem' }}>
              <div
                role="img" aria-label={photo.alt}
                style={{
                  width: 92, height: 92, borderRadius: '50%',
                  backgroundImage: `url(${photo.src})`,
                  backgroundSize: photo.size, backgroundPosition: photo.position,
                  border: '3px solid #fff',
                  boxShadow: `0 8px 24px ${species === 'cat' ? 'var(--cat-ring)' : 'var(--dog-ring)'}`,
                }}
              />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-dark)', margin: 0, letterSpacing: '-0.01em' }}>
                {title}
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 0 }}>
                How would you like to check in?
              </p>
            </div>

            <ScanModeChooser species={species} onSelect={handleSelect} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
