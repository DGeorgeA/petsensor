/**
 * src/pages/AnxietyTracker.tsx  (My Scans)
 *
 * Live anxiety timeline powered by:
 *   - Real Supabase data (pet_scan_results + pet_analysis_sessions)
 *   - Falls back to curated demo data when offline
 *   - Live trend chart of recent anxiety scores
 *   - Filter by animal type
 *   - Quick scan launcher (links to sensing pages)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Activity, AlertTriangle, CheckCircle, TrendingUp, TrendingDown,
  Heart, ArrowRight, Shield, RefreshCw, Wifi, WifiOff, Dog, Cat,
  Zap
} from 'lucide-react';
import { fetchRecentScans, isSupabaseConnected, type ScanRecord } from '../lib/supabase';

// ── Demo data (offline fallback) ──────────────────────────────────────────────
const DEMO_SCANS: ScanRecord[] = [
  {
    id: '1', created_at: new Date(Date.now() - 3600_000).toISOString(),
    result_type: 'audio', emotion_label: 'Calm & Resting', confidence: 0.96,
    anxiety_score: 8, message: 'Your dog is wonderfully calm and at ease.',
    session: { animal_type: 'dog', analysis_type: 'unified' },
  },
  {
    id: '2', created_at: new Date(Date.now() - 7200_000).toISOString(),
    result_type: 'audio', emotion_label: 'Anxious Barking', confidence: 0.94,
    anxiety_score: 82, message: 'Your dog is showing signs of anxiety. Try moving closer and speaking softly.',
    session: { animal_type: 'dog', analysis_type: 'unified' },
  },
  {
    id: '3', created_at: new Date(Date.now() - 86400_000).toISOString(),
    result_type: 'audio', emotion_label: 'Calm Purring', confidence: 0.97,
    anxiety_score: 5, message: 'Your cat is deeply content and comfortable.',
    session: { animal_type: 'cat', analysis_type: 'unified' },
  },
  {
    id: '4', created_at: new Date(Date.now() - 172800_000).toISOString(),
    result_type: 'audio', emotion_label: 'Separation Anxiety Whine', confidence: 0.92,
    anxiety_score: 75, message: 'Your dog is distressed and missing you. Gentle reassurance will help.',
    session: { animal_type: 'dog', analysis_type: 'unified' },
  },
  {
    id: '5', created_at: new Date(Date.now() - 259200_000).toISOString(),
    result_type: 'audio', emotion_label: 'Stress Whinny', confidence: 0.93,
    anxiety_score: 78, message: 'Your horse is vocalizing stress. Check the stable environment.',
    session: { animal_type: 'horse', analysis_type: 'unified' },
  },
  {
    id: '6', created_at: new Date(Date.now() - 432000_000).toISOString(),
    result_type: 'audio', emotion_label: 'Calm & Settled', confidence: 0.91,
    anxiety_score: 6, message: 'Your horse is calm, grounded, and comfortable.',
    session: { animal_type: 'horse', analysis_type: 'unified' },
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = diffMs / 3600_000;
  if (diffH < 1) return `${Math.round(diffMs / 60000)}m ago`;
  if (diffH < 24) return `${Math.round(diffH)}h ago`;
  if (diffH < 48) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function scoreColor(score: number): string {
  if (score >= 70) return 'var(--color-sunset-coral)';
  if (score >= 40) return 'var(--color-soft-gold)';
  return 'var(--color-sage-green)';
}

function scoreLabel(score: number): string {
  if (score >= 70) return 'High Stress';
  if (score >= 40) return 'Moderate';
  return 'Calm';
}

function animalEmoji(type?: string): string {
  if (type === 'cat') return '🐱';
  if (type === 'horse') return '🐴';
  return '🐶';
}

// ── Sparkline bar chart ────────────────────────────────────────────────────────
function AnxietySparkline({ scores }: { scores: number[] }) {
  if (scores.length < 2) return null;
  const max = 100;
  const W = 300, H = 60, pad = 8;
  const pts = scores.map((s, i) => {
    const x = pad + (i / (scores.length - 1)) * (W - pad * 2);
    const y = H - pad - (s / max) * (H - pad * 2);
    return `${x},${y}`;
  });
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const trend = scores[scores.length - 1] - scores[0];

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Anxiety Trend</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', fontWeight: 600 }}>
          {trend <= 0
            ? <TrendingDown size={14} color="var(--color-sage-green)" />
            : <TrendingUp size={14} color="var(--color-sunset-coral)" />}
          <span style={{ color: trend <= 0 ? 'var(--color-sage-green)' : 'var(--color-sunset-coral)' }}>
            {trend > 0 ? '+' : ''}{Math.round(trend)}
          </span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={avgScore >= 60 ? '#f4845f' : '#9cac94'} stopOpacity="0.3" />
            <stop offset="100%" stopColor={avgScore >= 60 ? '#f4845f' : '#9cac94'} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline
          points={pts.join(' ')}
          fill="none"
          stroke={avgScore >= 60 ? 'var(--color-sunset-coral)' : 'var(--color-sage-green)'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Fill area */}
        <polygon
          points={`${pad},${H - pad} ${pts.join(' ')} ${W - pad},${H - pad}`}
          fill="url(#sparkFill)"
        />
        {/* Latest dot */}
        {pts.length > 0 && (
          <circle
            cx={pts[pts.length - 1].split(',')[0]}
            cy={pts[pts.length - 1].split(',')[1]}
            r="4"
            fill={avgScore >= 60 ? 'var(--color-sunset-coral)' : 'var(--color-sage-green)'}
          />
        )}
      </svg>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
type AnimalFilter = 'all' | 'dog' | 'cat' | 'horse';

export default function AnxietyTracker() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<AnimalFilter>('all');
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  const loadScans = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    const online = await isSupabaseConnected();
    setIsOnline(online);

    if (online) {
      const live = await fetchRecentScans(30);
      setScans(live.length > 0 ? live : DEMO_SCANS);
    } else {
      setScans(DEMO_SCANS);
    }
    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  useEffect(() => { loadScans(); }, [loadScans]);

  // ── Filtered + stats ─────────────────────────────────────────────────────
  const filtered = scans.filter(s =>
    filter === 'all' || s.session?.animal_type === filter
  );

  const stats = React.useMemo(() => {
    const total = filtered.length;
    const avgScore = total > 0
      ? Math.round(filtered.reduce((s, r) => s + r.anxiety_score, 0) / total)
      : 0;
    const highAlerts = filtered.filter(r => r.anxiety_score >= 60).length;
    const calmSessions = filtered.filter(r => r.anxiety_score < 30).length;
    const recentScores = filtered.slice(0, 8).map(r => r.anxiety_score).reverse();
    return { total, avgScore, highAlerts, calmSessions, recentScores };
  }, [filtered]);

  return (
    <div
      className="flex flex-col items-center"
      style={{ maxWidth: '100%', padding: 'clamp(1rem,4vw,2.5rem) clamp(1rem,4vw,2rem)', marginBottom: '4rem' }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="text-center" style={{ marginBottom: '2.5rem', width: '100%', maxWidth: 800, margin: '0 auto 2.5rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 backdrop-blur-md bg-yellow-300/10 border border-yellow-500/20 rounded-full px-4 py-1.5"
          style={{ marginBottom: '1rem' }}
        >
          <Activity size={16} color="var(--color-sunset-coral)" />
          <span style={{ color: 'var(--color-text-dark)', fontSize: '0.9rem', fontWeight: 500 }}>
            Predictive Pet Wellness Engine
          </span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          className="section-title"
        >
          My Scans
        </motion.h1>
        <p className="section-subtitle">
          Historical anxiety scores, emotional detections, and behavioral patterns from your sensing sessions.
        </p>
      </div>

      <div style={{ width: '100%', maxWidth: 960, margin: '0 auto' }}>

        {/* ── Connectivity + filter strip ────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Filter pills */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {(['all', 'dog', 'cat', 'horse'] as AnimalFilter[]).map(a => (
              <motion.button
                key={a} whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(a)}
                style={{
                  padding: '0.45rem 1.1rem', borderRadius: '100px', fontSize: '0.88rem',
                  fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: filter === a ? 'var(--gradient-sage)' : 'rgba(255,255,255,0.6)',
                  color: filter === a ? 'white' : 'var(--color-text-dark)',
                  backdropFilter: 'blur(8px)',
                  boxShadow: filter === a ? '0 4px 12px rgba(156,172,148,0.3)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {a === 'all' ? 'All' : a === 'dog' ? '🐶 Dog' : a === 'cat' ? '🐱 Cat' : '🐴 Horse'}
              </motion.button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Online indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              {isOnline === null ? null : isOnline
                ? <><Wifi size={14} color="var(--color-sage-green)" /> Live</>
                : <><WifiOff size={14} /> Demo</>}
            </div>
            {/* Refresh button */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => loadScans(true)}
              style={{
                background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(156,172,148,0.2)', borderRadius: '100px',
                padding: '0.4rem 0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem',
                fontSize: '0.82rem', color: 'var(--color-text-muted)',
              }}
            >
              <RefreshCw size={13} style={{ animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none' }} />
              Refresh
            </motion.button>
          </div>
        </div>

        {/* ── Stats row ───────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <StatCard
            icon={<TrendingUp size={22} color="var(--color-muted-teal)" />}
            value={`${stats.avgScore}%`}
            label="Avg Anxiety Index"
            sub={stats.avgScore < 30 ? '✓ Healthy range' : stats.avgScore < 60 ? 'Monitor closely' : 'Attention needed'}
            subColor={scoreColor(stats.avgScore)}
          />
          <StatCard
            icon={<AlertTriangle size={22} color="var(--color-sunset-coral)" />}
            value={String(stats.highAlerts)}
            label="High-Stress Events"
            sub="Score ≥ 60"
            subColor="var(--color-sunset-coral)"
          />
          <StatCard
            icon={<CheckCircle size={22} color="var(--color-sage-green)" />}
            value={String(stats.calmSessions)}
            label="Calm Sessions"
            sub="Score < 30"
            subColor="var(--color-sage-green)"
          />
          <StatCard
            icon={<Heart size={22} color="var(--color-soft-gold)" />}
            value={String(stats.total)}
            label="Total Scans"
            sub={isOnline ? 'From Supabase' : 'Demo data'}
            subColor="var(--color-text-muted)"
          />
        </div>

        {/* ── Sparkline trend card ─────────────────────────────────────── */}
        {stats.recentScores.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="card glass"
            style={{ marginBottom: '2rem', padding: '1.5rem', flexDirection: 'column' }}
          >
            <AnxietySparkline scores={stats.recentScores} />
          </motion.div>
        )}

        {/* ── Main grid ───────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', width: '100%' }}>

          {/* Scan Timeline */}
          <div className="card glass" style={{ flexDirection: 'column', height: 540, overflow: 'hidden', padding: '1.5rem' }}>
            <h3 style={{ color: 'var(--color-text-dark)', marginBottom: '0.35rem' }}>Detection Timeline</h3>
            <p className="text-muted" style={{ fontSize: '0.88rem', marginBottom: '1.25rem' }}>
              {isOnline ? 'Live from Supabase · Last 30 sessions' : 'Demo data · Connect Supabase for live scans'}
            </p>

            {isLoading ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="breathing-orb" style={{ width: 48, height: 48, background: 'var(--gradient-teal)' }} />
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.25rem' }}>
                <AnimatePresence>
                  {filtered.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)' }}
                    >
                      <Shield size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                      <p>No scans for this filter yet.</p>
                    </motion.div>
                  ) : (
                    filtered.map((scan, i) => (
                      <motion.div
                        key={scan.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        style={{
                          background: 'rgba(255,255,255,0.55)',
                          borderRadius: 'var(--radius-md)',
                          padding: '1rem 1.1rem',
                          marginBottom: '0.75rem',
                          borderLeft: `4px solid ${scoreColor(scan.anxiety_score)}`,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                              {animalEmoji(scan.session?.animal_type)} {scan.session?.animal_type ?? 'Pet'}
                            </span>
                            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-dark)' }}>
                              {scan.emotion_label}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '0.75rem' }}>
                            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: scoreColor(scan.anxiety_score) }}>
                              {scan.anxiety_score}%
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                              {scoreLabel(scan.anxiety_score)}
                            </div>
                          </div>
                        </div>
                        <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', lineHeight: 1.4, marginBottom: '0.5rem' }}>
                          {scan.message}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', opacity: 0.55 }}>
                          <span>{formatTime(scan.created_at)}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Zap size={11} /> {(scan.confidence * 100).toFixed(0)}% confidence
                          </span>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Quick launch panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Quick scan CTA cards */}
            {[
              { animal: 'dog', label: 'Sense My Dog', route: '/dog-whisperer', emoji: '🐶', gradient: 'var(--gradient-sunset)' },
              { animal: 'cat', label: 'Sense My Cat', route: '/cat-whisperer', emoji: '🐱', gradient: 'var(--gradient-teal)' },
              { animal: 'horse', label: 'Sense My Horse', route: '/horse-whisperer', emoji: '🐴', gradient: 'var(--gradient-sage)' },
            ].map(item => (
              <motion.button
                key={item.animal}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(item.route)}
                style={{
                  background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.8)',
                  borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                  transition: 'all 0.25s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: item.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                  }}>
                    {item.emoji}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-text-dark)', fontSize: '1rem' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                      Start a new sensing session
                    </div>
                  </div>
                </div>
                <ArrowRight size={20} color="var(--color-text-muted)" />
              </motion.button>
            ))}

            {/* Privacy guarantee */}
            <div style={{
              background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(8px)',
              borderRadius: 'var(--radius-lg)', padding: '1.25rem',
              border: '1px solid rgba(156,172,148,0.2)',
            }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <Shield size={20} color="var(--color-sage-green)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
                  All audio processing runs locally in a Web Worker. Only emotion labels and scores are stored
                  — never raw audio. Your pet's privacy is fully protected.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* ── Vet consultation CTA ─────────────────────────────────── */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          style={{
            width: '100%', background: 'var(--gradient-teal)', color: 'white',
            borderRadius: 'var(--radius-lg)', padding: '2.5rem',
            marginTop: '3.5rem', textAlign: 'center', boxShadow: 'var(--shadow-lux)',
          }}
        >
          <Heart fill="white" size={32} style={{ marginBottom: '1rem', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.3))' }} />
          <h3 style={{ color: 'white', fontSize: '1.8rem', fontWeight: 600 }}>
            Concerned about your pet's patterns?
          </h3>
          <p style={{ maxWidth: 600, margin: '0.75rem auto 2rem', opacity: 0.9, fontSize: '1.05rem', lineHeight: 1.6 }}>
            Connect with elite pet behaviorists or book a calming grooming therapy block in our Wellness Studio.
          </p>
          <button
            className="btn btn-cta"
            style={{ background: 'white', color: 'var(--color-muted-teal)' }}
            onClick={() => navigate('/vet-plus')}
          >
            Browse Vet+ <ArrowRight size={18} />
          </button>
        </motion.div>
      </div>
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({ icon, value, label, sub, subColor }: {
  icon: React.ReactNode; value: string; label: string; sub: string; subColor: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="card glass"
      style={{ flexDirection: 'column', padding: '1.25rem', textAlign: 'center', gap: 0 }}
    >
      <div style={{ margin: '0 auto 0.5rem' }}>{icon}</div>
      <div style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--color-text-dark)', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '0.35rem 0 0.2rem' }}>
        {label}
      </div>
      <div style={{ fontSize: '0.72rem', color: subColor, fontWeight: 600 }}>{sub}</div>
    </motion.div>
  );
}
