import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Sparkles } from 'lucide-react';
import { getLocalScans, type LocalScanRecord } from '../lib/localHistory';
import OwnerPetScene from './OwnerPetScene';
import { moodFromClass } from '../lib/sceneMood';

/**
 * WelcomeBack — a warm returning-visitor moment on the Home page. It reads the
 * on-device scan history (no network) and greets the owner with the pet + mood
 * from their LAST check, a gentle streak, and a reason to check in again. This is
 * the "reason to revisit": a fresh baseline keeps the screening meaningful, and
 * cats in particular hide stress. Renders nothing until history is known.
 */

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const mins = Math.max(0, Math.round((now - then) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.round(days / 7);
  return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

export default function WelcomeBack() {
  const navigate = useNavigate();
  const [scans, setScans] = useState<LocalScanRecord[] | null>(null);

  useEffect(() => {
    let alive = true;
    getLocalScans(50).then((rows) => { if (alive) setScans(rows); }).catch(() => setScans([]));
    return () => { alive = false; };
  }, []);

  if (scans === null || scans.length === 0) return null; // first-time users see the normal hero

  const last = scans[0];
  const species = last.animal_type;
  const mood = moodFromClass(last.screening_class, 50);
  const weekCount = scans.filter((s) => daysSince(s.created_at) < 7).length;
  const gap = daysSince(last.created_at);

  const petName = species === 'dog' ? 'your dog' : 'your cat';
  const nudge =
    gap >= 3
      ? `It's been ${gap} days — a quick re-check keeps ${petName}'s baseline fresh.`
      : species === 'cat'
        ? 'Cats hide stress well — regular check-ins reveal changes you might miss.'
        : 'Little check-ins add up to a clearer picture of how they really feel.';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      data-species={species}
      style={{
        width: '100%', maxWidth: 560, margin: '0 auto 1.5rem',
        display: 'flex', alignItems: 'center', gap: '1rem',
        padding: '1rem 1.15rem',
        background: 'rgba(255,255,255,0.30)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: '1.5px solid rgba(255,255,255,0.55)',
        borderRadius: 24,
        boxShadow: '0 12px 40px rgba(120,60,30,0.12)',
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <OwnerPetScene species={species} mood={mood} size={84} />
      </div>
      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
          fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
          color: 'var(--species-accent, #ff8c6b)' }}>
          <Sparkles size={12} /> Welcome back
        </div>
        <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fff8f0',
          textShadow: '0 1px 8px rgba(120,50,10,0.35)', margin: '0.15rem 0' }}>
          Last check {relativeTime(last.created_at)}
          {weekCount > 1 && <span style={{ fontWeight: 500, opacity: 0.9 }}> · {weekCount} this week</span>}
        </div>
        <p style={{ fontSize: '0.82rem', lineHeight: 1.45, margin: '0 0 0.6rem',
          color: 'rgba(255,236,218,0.94)', textShadow: '0 1px 6px rgba(100,40,0,0.25)' }}>
          {nudge}
        </p>
        <button
          onClick={() => navigate(species === 'dog' ? '/dog-whisperer' : '/cat-whisperer')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            background: `linear-gradient(135deg, var(--species-accent, #ff8c6b), var(--species-accent-2, #f4b45a))`,
            color: '#fff', border: 'none', borderRadius: 999,
            padding: '0.45rem 1rem', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer',
            fontFamily: 'var(--font-family)', boxShadow: '0 6px 18px var(--species-ring, rgba(255,140,107,0.45))',
          }}
        >
          Check in again <ChevronRight size={15} />
        </button>
      </div>
    </motion.div>
  );
}
