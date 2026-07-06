import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Settings2, Code2, ChevronRight, ShieldCheck, Sparkles, Heart, Brain, Stethoscope } from 'lucide-react';

function getSetting(key: string, defaultValue = true): boolean {
  try {
    const stored = localStorage.getItem(key);
    return stored === null ? defaultValue : stored === 'true';
  } catch {
    return defaultValue;
  }
}

function setSetting(key: string, value: boolean) {
  try {
    localStorage.setItem(key, String(value));
    // Notify HorizontalPetRail to re-check
    window.dispatchEvent(new Event('smp_pref_changed'));
  } catch {
    /* localStorage unavailable — ignore */
  }
}

interface ToggleRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  id: string;
}

function ToggleRow({ icon, title, description, enabled, onToggle, id }: ToggleRowProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      id={id}
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(16px)',
        border: `1.5px solid ${enabled ? 'rgba(168,230,207,0.5)' : 'rgba(255,255,255,0.75)'}`,
        borderRadius: '18px', padding: '1.1rem 1.25rem',
        cursor: 'pointer', transition: 'all 0.28s ease',
        boxShadow: enabled ? '0 6px 20px rgba(168,230,207,0.15)' : '0 4px 16px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: '12px',
        background: enabled ? 'linear-gradient(135deg, #a8e6cf, #dcedc1)' : 'rgba(0,0,0,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, transition: 'all 0.28s',
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text-dark)' }}>{title}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.15rem', lineHeight: 1.45 }}>{description}</div>
      </div>
      {/* Toggle pill */}
      <div
        style={{
          width: 48, height: 26, borderRadius: '999px', flexShrink: 0,
          background: enabled
            ? 'linear-gradient(135deg, #a8e6cf, #dcedc1)'
            : 'rgba(0,0,0,0.12)',
          position: 'relative', transition: 'background 0.3s ease',
          boxShadow: enabled ? '0 2px 8px rgba(168,230,207,0.4)' : 'none',
        }}
        aria-checked={enabled}
        role="switch"
      >
        <div style={{
          width: 20, height: 20, borderRadius: '50%', background: 'white',
          position: 'absolute', top: 3, left: enabled ? 25 : 3,
          transition: 'left 0.3s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        }} />
      </div>
    </motion.div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [prefs, setPrefs] = useState({
    dogVisible:        getSetting('smp_dog_visible',        true),
    catVisible:        getSetting('smp_cat_visible',        true),
    scansVisible:      getSetting('smp_scans_visible',      true),
    vetVisible:        getSetting('smp_vet_visible',        true),
    validationVisible: getSetting('smp_validation_visible', true),
  });

  const handleToggle = useCallback(async (key: 'dogVisible' | 'catVisible' | 'scansVisible' | 'vetVisible' | 'validationVisible', storageKey: string) => {
    const newValue = !prefs[key];
    setPrefs(prev => ({ ...prev, [key]: newValue }));
    setSetting(storageKey, newValue);
    // Preferences are stored on-device only (localStorage) — nothing is uploaded.

    // Show brief save confirmation
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, [prefs]);

  return (
    <>
      {/* ── BACKGROUND ───────────────────────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0, zIndex: -2,
          background: 'linear-gradient(160deg, #fbf3ec 0%, #fdf7f0 60%, #ffecd9 100%)',
        }}
      >
        <div style={{
          position: 'absolute', top: '-10%', right: '-10%',
          width: '50vw', height: '50vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,170,165,0.12) 0%, transparent 70%)',
        }} />
      </div>

      <div
        style={{
          maxWidth: 560, margin: '0 auto',
          padding: 'clamp(1rem, 4vw, 2rem)',
          paddingBottom: '5rem',
        }}
      >
        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 'clamp(1.5rem, 4vh, 2.5rem)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '12px',
              background: 'linear-gradient(135deg, #ffaaa5, #ffd3b6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Settings2 size={20} color="#4a403a" />
            </div>
            <h1 style={{ fontSize: 'clamp(1.6rem, 5vw, 2rem)', fontWeight: 700, color: 'var(--color-text-dark)', letterSpacing: '-0.03em' }}>
              Settings
            </h1>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
            Personalise your Sense My Pet experience.
          </p>
        </motion.div>

        {/* ── SECTION: FEATURE VISIBILITY ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          style={{ marginBottom: '2rem' }}
        >
          <p style={{
            fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: 'var(--color-text-muted)',
            marginBottom: '0.75rem', paddingLeft: '0.25rem',
          }}>
            Home Page Buttons
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <ToggleRow
              id="settings-dog-whisperer"
              icon={<Heart size={18} color={prefs.dogVisible ? '#4a7a62' : 'var(--color-text-muted)'} />}
              title="Sense My Dog"
              description={prefs.dogVisible ? 'Visible on the home page rail. Tap to hide.' : 'Hidden from the home page rail. Tap to show.'}
              enabled={prefs.dogVisible}
              onToggle={() => handleToggle('dogVisible', 'smp_dog_visible')}
            />

            <ToggleRow
              id="settings-cat-whisperer"
              icon={<Heart size={18} color={prefs.catVisible ? '#4a7a62' : 'var(--color-text-muted)'} />}
              title="Sense My Cat"
              description={prefs.catVisible ? 'Visible on the home page rail. Tap to hide.' : 'Hidden from the home page rail. Tap to show.'}
              enabled={prefs.catVisible}
              onToggle={() => handleToggle('catVisible', 'smp_cat_visible')}
            />

            <ToggleRow
              id="settings-scans"
              icon={<Brain size={18} color={prefs.scansVisible ? '#4a7a62' : 'var(--color-text-muted)'} />}
              title="My Scans"
              description={
                prefs.scansVisible
                  ? 'Visible on the home page rail. Tap to hide.'
                  : 'Hidden from the home page rail. Tap to show.'
              }
              enabled={prefs.scansVisible}
              onToggle={() => handleToggle('scansVisible', 'smp_scans_visible')}
            />

            <ToggleRow
              id="settings-vet"
              icon={<Stethoscope size={18} color={prefs.vetVisible ? '#4a7a62' : 'var(--color-text-muted)'} />}
              title="Vet+"
              description={
                prefs.vetVisible
                  ? 'Visible on the home page rail. Tap to hide.'
                  : 'Hidden from the home page rail. Tap to show.'
              }
              enabled={prefs.vetVisible}
              onToggle={() => handleToggle('vetVisible', 'smp_vet_visible')}
            />

            <ToggleRow
              id="settings-validation-suite"
              icon={<Sparkles size={18} color={prefs.validationVisible ? '#4a7a62' : 'var(--color-text-muted)'} />}
              title="Validation Suite"
              description={
                prefs.validationVisible
                  ? 'Visible on the home page rail. Tap to hide.'
                  : 'Hidden from the home page rail. Tap to show.'
              }
              enabled={prefs.validationVisible}
              onToggle={() => handleToggle('validationVisible', 'smp_validation_visible')}
            />
          </div>
        </motion.div>

        {/* ── SECTION: DEVELOPER ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          style={{ marginBottom: '2rem' }}
        >
          <p style={{
            fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: 'var(--color-text-muted)',
            marginBottom: '0.75rem', paddingLeft: '0.25rem',
          }}>
            Developer
          </p>

          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate('/api-docs')}
            style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(16px)',
              border: '1.5px solid rgba(255,255,255,0.75)',
              borderRadius: '18px', padding: '1.1rem 1.25rem',
              cursor: 'pointer', transition: 'all 0.28s ease',
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{
              width: 42, height: 42, borderRadius: '12px',
              background: 'rgba(244, 208, 104, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Code2 size={18} color="var(--color-soft-gold)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text-dark)' }}>Developer APIs</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                Integration docs, audio/video pipeline references
              </div>
            </div>
            <ChevronRight size={18} color="var(--color-text-muted)" />
          </motion.div>
        </motion.div>

        {/* ── SECTION: PRIVACY ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p style={{
            fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: 'var(--color-text-muted)',
            marginBottom: '0.75rem', paddingLeft: '0.25rem',
          }}>
            Privacy
          </p>

          <div style={{
            background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)',
            border: '1.5px solid rgba(255,255,255,0.75)', borderRadius: '18px',
            padding: '1.1rem 1.25rem',
            display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
          }}>
            <ShieldCheck size={18} color="var(--color-sage-green)" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.55, margin: 0 }}>
              Audio and camera input are processed on your device for the active scan. Raw audio and video are
              not stored on our servers. Only short screening summaries (species, result, timestamp) are saved
              locally on this device, and your preferences stay in this browser.
            </p>
          </div>
        </motion.div>

        {/* ── SAVE CONFIRMATION TOAST ─────────────────────────────────── */}
        <AnimatePresence>
          {saved && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              style={{
                position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(60, 120, 90, 0.9)', backdropFilter: 'blur(16px)',
                color: 'white', borderRadius: '999px', padding: '0.6rem 1.4rem',
                fontSize: '0.88rem', fontWeight: 600, zIndex: 100,
                boxShadow: '0 8px 24px rgba(60,120,90,0.3)',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                whiteSpace: 'nowrap',
              }}
            >
              ✓ Preference saved
            </motion.div>
          )}
        </AnimatePresence>

        {/* Version footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 0.35 }}
          style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '3rem' }}
        >
          Sense My Pet v1.4 · Emotional AI Wellness
        </motion.p>
      </div>
    </>
  );
}
