import React, { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, PhoneCall, AlertTriangle, Activity, Eye, Download, Share2, Waves } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  type ScreeningClass,
  type ScreeningResult,
  RECOMMENDED_ACTION_COPY,
} from '../lib/screening';
import OwnerPetScene from './OwnerPetScene';
import { moodFromClass } from '../lib/sceneMood';
import { useIsMobile } from '../lib/useIsMobile';
import type { ConditionMatch } from '../lib/referenceMatch';
import { VET_FOLLOWUP_COPY, AI_REFERENCE_DISCLAIMER } from '../lib/conditionGroups';
import { downloadScanReport, shareScanReport, type ScanReportData } from '../lib/scanReport';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  screening: ScreeningResult;
  species: 'dog' | 'cat';
  /** ≥60% reference-library vocalisation match (null below the floor). */
  conditionMatch?: ConditionMatch | null;
  /** Spec §11 non-diagnostic condition groups from the visual channel. */
  visualConditionGroups?: string[];
  /** Audio label for the report's primary-observation line. */
  audioLabel?: string | null;
  scanMode?: string;
}

// ── CLASS CONFIG (cautious screening, never diagnostic) ─────────────────────────
interface ClassConfig {
  tag: string;
  emoji: string;
  showConfidence: boolean;
  showVet: boolean;
  emergency: boolean;
  barGradient: string;
  glowColor: string;
  accentColor: string;
  tagBg: string;
  tagColor: string;
}

function getClassConfig(cls: ScreeningClass): ClassConfig {
  switch (cls) {
    case 'RELAXED':
      return {
        tag: 'Relaxed indicators', emoji: '😌',
        showConfidence: true, showVet: false, emergency: false,
        barGradient: 'linear-gradient(90deg, #7ecba8, #a8e6cf)',
        glowColor: 'rgba(126,203,168,0.70)', accentColor: '#7ecba8',
        tagBg: 'rgba(126,203,168,0.15)', tagColor: '#3a8c65',
      };
    case 'POSSIBLE_STRESS':
      return {
        tag: 'Possible stress signals', emoji: '😐',
        showConfidence: true, showVet: true, emergency: false,
        barGradient: 'linear-gradient(90deg, #f4c07a, #ffd3b6)',
        glowColor: 'rgba(244,192,122,0.65)', accentColor: '#f4c07a',
        tagBg: 'rgba(244,192,122,0.15)', tagColor: '#9a6520',
      };
    case 'POSSIBLE_ANXIETY':
      return {
        tag: 'Possible anxiety signals', emoji: '😟',
        showConfidence: true, showVet: true, emergency: false,
        barGradient: 'linear-gradient(90deg, #ff9e8a, #ffbfaa)',
        glowColor: 'rgba(255,158,138,0.65)', accentColor: '#ff9e8a',
        tagBg: 'rgba(255,158,138,0.15)', tagColor: '#c05440',
      };
    case 'EMERGENCY':
      return {
        tag: 'Potential emergency signs', emoji: '🚨',
        showConfidence: false, showVet: true, emergency: true,
        barGradient: 'linear-gradient(90deg, #ff5b5b, #ff8a5b)',
        glowColor: 'rgba(255,91,91,0.7)', accentColor: '#ff5b5b',
        tagBg: 'rgba(255,91,91,0.16)', tagColor: '#c0281f',
      };
    case 'UNSUPPORTED_SUBJECT':
      return {
        tag: 'Unsupported subject', emoji: '🐾',
        showConfidence: false, showVet: false, emergency: false,
        barGradient: 'linear-gradient(90deg, #c9c2ba, #ddd6cd)',
        glowColor: 'rgba(160,150,140,0.5)', accentColor: '#a89e93',
        tagBg: 'rgba(160,150,140,0.14)', tagColor: '#6b6158',
      };
    case 'INSUFFICIENT_EVIDENCE':
    default:
      return {
        tag: 'Insufficient evidence', emoji: '🔍',
        showConfidence: false, showVet: false, emergency: false,
        barGradient: 'linear-gradient(90deg, #c9c2ba, #ddd6cd)',
        glowColor: 'rgba(160,150,140,0.5)', accentColor: '#a89e93',
        tagBg: 'rgba(160,150,140,0.14)', tagColor: '#6b6158',
      };
  }
}

// ── COUNT-UP HOOK ──────────────────────────────────────────────────────────────
function useCountUp(target: number, durationMs = 1200, startDelay = 400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const delay = setTimeout(() => {
      const steps = 44;
      const interval = durationMs / steps;
      let step = 0;
      const timer = setInterval(() => {
        step++;
        setValue(Math.round((target * step) / steps));
        if (step >= steps) clearInterval(timer);
      }, interval);
      return () => clearInterval(timer);
    }, startDelay);
    return () => clearTimeout(delay);
  }, [target, durationMs, startDelay]);
  return value;
}

// ── STAT PILL ──────────────────────────────────────────────────────────────────
function Stat({ icon, label, value, suffix, color }: {
  icon: React.ReactNode; label: string; value: number; suffix: string; color: string;
}) {
  return (
    <div style={{
      flex: 1, background: 'rgba(255,255,255,0.55)', borderRadius: 14,
      padding: '0.7rem 0.8rem', border: '1px solid rgba(255,255,255,0.85)',
      display: 'flex', flexDirection: 'column', gap: '0.15rem',
    }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem',
        fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.04em',
        textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
        {icon}{label}
      </span>
      <span style={{ fontSize: '1.35rem', fontWeight: 800, color, letterSpacing: '-0.02em' }}>
        {value}<span style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.7 }}>{suffix}</span>
      </span>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default React.memo(function EmotionalInsightModal({
  isOpen, onClose, screening, species,
  conditionMatch = null, visualConditionGroups = [], audioLabel = null, scanMode,
}: Props) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const cls = screening.screeningClass;
  const cfg = getClassConfig(cls);
  const mood = moodFromClass(cls, screening.severity);
  const severity = useCountUp(screening.severity, 1100, 500);
  const confidence = useCountUp(screening.observationConfidence, 1100, 650);
  const showIndex = cls === 'POSSIBLE_STRESS' || cls === 'POSSIBLE_ANXIETY' || cls === 'EMERGENCY' || cls === 'RELAXED';
  const showReportActions = cls !== 'INSUFFICIENT_EVIDENCE' && cls !== 'UNSUPPORTED_SUBJECT';
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const reportData = useCallback((): ScanReportData => ({
    species,
    createdAt: new Date().toISOString(),
    screeningClass: screening.screeningClass,
    headline: screening.headline,
    label: audioLabel ?? undefined,
    severity: screening.severity,
    observationConfidence: screening.observationConfidence,
    modality: screening.modality,
    scanMode,
    indicators: screening.observedIndicators,
    explanations: screening.possibleExplanations,
    recommendedAction: screening.recommendedAction,
    conditionGroups: visualConditionGroups,
    conditionMatchName: conditionMatch?.conditionName,
    conditionMatchPercent: conditionMatch?.matchPercent,
  }), [species, screening, audioLabel, scanMode, visualConditionGroups, conditionMatch]);

  const handleDownload = useCallback(() => {
    downloadScanReport(reportData());
  }, [reportData]);

  const handleShare = useCallback(async () => {
    const how = await shareScanReport(reportData());
    setShareFeedback(
      how === 'shared' ? 'Report shared'
      : how === 'copied' ? 'Report copied to clipboard'
      : 'Sharing unavailable — use Download instead',
    );
  }, [reportData]);

  // Auto-dismiss ONLY for low-stakes results; keep concerning results on screen.
  const persistent = cfg.showVet || cfg.emergency;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startDismissTimer = useCallback((delay: number) => {
    if (persistent) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(onClose, delay);
  }, [onClose, persistent]);
  const pauseTimer = useCallback(() => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
  const resumeTimer = useCallback(() => startDismissTimer(2800), [startDismissTimer]);
  useEffect(() => {
    if (isOpen) startDismissTimer(5000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isOpen, startDismissTimer]);

  const handleVetPlus = useCallback(() => { onClose(); navigate('/vet-plus'); }, [navigate, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="insight-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: cfg.emergency ? 'rgba(60,10,10,0.5)' : 'rgba(60, 40, 30, 0.4)',
              backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', cursor: 'pointer',
            }}
          />

          {/* Flex wrapper owns centering — framer-motion's animated transform on
              the card would overwrite a translate(-50%,-50%) and push it off-screen. */}
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 201,
              display: 'flex', justifyContent: 'center',
              alignItems: isMobile ? 'flex-end' : 'center',
              padding: isMobile ? '0 0.7rem 0.85rem' : '1.5rem',
              pointerEvents: 'none',
            }}
          >
          <motion.div
            key="insight-card"
            role="dialog" aria-modal="true" aria-label="Behavioural screening result"
            onMouseEnter={pauseTimer} onMouseLeave={resumeTimer}
            onTouchStart={pauseTimer} onTouchEnd={resumeTimer}
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 14 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300, mass: 0.85 }}
            style={{
              pointerEvents: 'auto',
              position: 'relative',
              width: isMobile ? '100%' : 'min(500px, 92vw)',
              maxHeight: 'min(90dvh, 760px)', overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              background: 'linear-gradient(160deg, rgba(255,252,248,0.98) 0%, rgba(255,241,232,0.96) 100%)',
              backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
              borderRadius: 26,
              border: cfg.emergency ? '2px solid rgba(255,91,91,0.55)' : '1.5px solid rgba(255,255,255,0.92)',
              boxShadow: `0 30px 80px rgba(60,30,10,0.20), 0 0 0 1px ${cfg.accentColor}22`,
            }}
          >
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
              background: `radial-gradient(ellipse at 50% 0%, ${cfg.glowColor} 0%, transparent 72%)`,
              opacity: 0.4, pointerEvents: 'none',
            }} />

            <div style={{ position: 'relative', zIndex: 1, padding: 'clamp(1.3rem, 4vw, 1.9rem)' }}>
              {/* Close */}
              <button onClick={onClose} aria-label="Close" style={{
                position: 'absolute', top: '0.9rem', right: '0.9rem', width: 30, height: 30,
                borderRadius: '50%', background: 'rgba(255,255,255,0.85)',
                border: `1.5px solid ${cfg.accentColor}44`, display: 'flex',
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#7a6058', zIndex: 2,
              }}>
                <X size={15} />
              </button>

              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '1.1rem', paddingRight: '1.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                  <OwnerPetScene species={species} mood={mood} size={124} />
                </div>
                <h2 style={{
                  fontSize: 'clamp(1.1rem, 3vw, 1.35rem)', fontWeight: 700,
                  color: cfg.emergency ? '#c0281f' : 'var(--color-text-dark)',
                  letterSpacing: '-0.02em', margin: 0,
                }}>
                  {screening.headline}
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '0.3rem 0 0' }}>
                  On-device behavioural screening · not a diagnosis
                </p>
              </div>

              {/* Class tag */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.9rem' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                  background: cfg.tagBg, color: cfg.tagColor, borderRadius: 999,
                  padding: '0.3rem 0.9rem', fontSize: '0.8rem', fontWeight: 700,
                  border: `1px solid ${cfg.accentColor}44`,
                }}>
                  {cfg.emergency && <AlertTriangle size={13} />}
                  {cfg.tag}
                </span>
              </div>

              {/* Severity + Observation confidence — two SEPARATE numbers */}
              {showIndex && !cfg.emergency && (
                <>
                  <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '0.9rem' }}>
                    <Stat icon={<Activity size={12} />} label="Stress signal" value={severity} suffix="/100" color={cfg.tagColor} />
                    <Stat icon={<Eye size={12} />} label="Observation conf." value={confidence} suffix="/100" color="#5f7a63" />
                  </div>
                  <div style={{
                    position: 'relative', height: 12, borderRadius: 6,
                    background: 'rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: '1rem',
                  }}>
                    <motion.div
                      initial={{ width: '0%' }} animate={{ width: `${screening.severity}%` }}
                      transition={{ delay: 0.3, duration: 1.2, ease: [0.34, 1.4, 0.64, 1] }}
                      style={{ position: 'absolute', inset: 0, height: '100%',
                        background: cfg.barGradient, borderRadius: 6, boxShadow: `0 0 12px ${cfg.glowColor}` }}
                    />
                  </div>
                </>
              )}

              {/* Detail */}
              <div style={{
                background: `linear-gradient(135deg, ${cfg.tagBg}, rgba(255,252,248,0.6))`,
                border: `1px solid ${cfg.accentColor}33`, borderRadius: 14,
                padding: '0.9rem 1rem', marginBottom: '0.9rem',
              }}>
                <p style={{ fontSize: 'clamp(0.9rem, 2.2vw, 1rem)', color: 'var(--color-text-dark)',
                  lineHeight: 1.6, fontWeight: 500, margin: 0, textAlign: 'center' }}>
                  {screening.detail}
                </p>
              </div>

              {/* Observed indicators */}
              {screening.observedIndicators.length > 0 && !cfg.emergency && (
                <Section title="Visible indicators observed">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {screening.observedIndicators.map((i) => (
                      <span key={i} style={{
                        fontSize: '0.78rem', background: 'rgba(255,255,255,0.7)',
                        border: '1px solid rgba(0,0,0,0.06)', borderRadius: 8,
                        padding: '0.2rem 0.6rem', color: 'var(--color-text-dark)',
                      }}>{i}</span>
                    ))}
                  </div>
                </Section>
              )}

              {/* Possible (non-diagnostic) explanations */}
              {screening.possibleExplanations.length > 0 && !cfg.emergency && (
                <Section title="Possible explanations (not a diagnosis)">
                  <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
                    {screening.possibleExplanations.join(' · ')}
                  </p>
                </Section>
              )}

              {/* ≥60% reference-library vocalisation match */}
              {conditionMatch && !cfg.emergency && (
                <div style={{
                  background: 'rgba(255,255,255,0.72)',
                  border: `1.5px solid ${cfg.accentColor}55`, borderRadius: 14,
                  padding: '0.85rem 1rem', marginBottom: '0.9rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
                    <Waves size={14} color={cfg.accentColor} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em',
                      textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                      Closest reference match
                    </span>
                    <span style={{
                      marginLeft: 'auto', fontSize: '0.78rem', fontWeight: 800, color: cfg.tagColor,
                      background: cfg.tagBg, borderRadius: 999, padding: '0.12rem 0.55rem',
                    }}>
                      {conditionMatch.matchPercent}% match
                    </span>
                  </div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-dark)', margin: '0 0 0.3rem' }}>
                    {conditionMatch.conditionName}
                  </p>
                  <p style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
                    {VET_FOLLOWUP_COPY}
                  </p>
                </div>
              )}

              {/* Spec §11 non-diagnostic condition groups (visual channel) */}
              {visualConditionGroups.length > 0 && !cfg.emergency && (
                <Section title="Signs consistent with (non-diagnostic)">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {visualConditionGroups.map((g) => (
                      <span key={g} style={{
                        fontSize: '0.78rem', background: 'rgba(255,255,255,0.7)',
                        border: `1px solid ${cfg.accentColor}33`, borderRadius: 8,
                        padding: '0.2rem 0.6rem', color: 'var(--color-text-dark)',
                      }}>{g}</span>
                    ))}
                  </div>
                </Section>
              )}

              {/* Recommended next step */}
              <Section title="Recommended next step">
                <p style={{ fontSize: '0.86rem', color: 'var(--color-text-dark)', margin: 0, lineHeight: 1.55, fontWeight: 500 }}>
                  {RECOMMENDED_ACTION_COPY[screening.recommendedAction]}
                </p>
              </Section>

              {/* Disclaimer */}
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.55rem',
                background: 'rgba(126,203,168,0.08)', borderRadius: 12,
                padding: '0.7rem 0.8rem', margin: '0.9rem 0 1rem',
              }}>
                <Info size={14} color="#7ecba8" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
                  {AI_REFERENCE_DISCLAIMER}
                </p>
              </div>

              {/* Vet-shareable report */}
              {showReportActions && (
                <div style={{ marginBottom: '0.9rem' }}>
                  <div style={{ display: 'flex', gap: '0.55rem' }}>
                    <button onClick={handleDownload} style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                      padding: '0.65rem 0.8rem', background: 'rgba(255,255,255,0.85)',
                      border: `1.5px solid ${cfg.accentColor}55`, borderRadius: 12,
                      fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-dark)',
                      cursor: 'pointer', fontFamily: 'var(--font-family)',
                    }}>
                      <Download size={14} /> Download report
                    </button>
                    <button onClick={handleShare} style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                      padding: '0.65rem 0.8rem', background: 'rgba(255,255,255,0.85)',
                      border: `1.5px solid ${cfg.accentColor}55`, borderRadius: 12,
                      fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-dark)',
                      cursor: 'pointer', fontFamily: 'var(--font-family)',
                    }}>
                      <Share2 size={14} /> Share with a vet
                    </button>
                  </div>
                  <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--color-text-muted)',
                    margin: '0.4rem 0 0', minHeight: '0.9em' }}>
                    {shareFeedback ?? 'Prepared for veterinary review — summary only, no audio or video.'}
                  </p>
                </div>
              )}

              {/* CTA */}
              {cfg.showVet && (
                <button onClick={handleVetPlus} style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  padding: '0.9rem 1.4rem',
                  background: cfg.emergency
                    ? 'linear-gradient(135deg, #ff6b6b 0%, #e83b3b 100%)'
                    : 'linear-gradient(135deg, #ff9e8a 0%, #ff7e6a 50%, #e8685a 100%)',
                  color: 'white', border: 'none', borderRadius: 14,
                  fontSize: 'clamp(0.92rem, 2.2vw, 1rem)', fontWeight: 700, cursor: 'pointer',
                  boxShadow: `0 6px 22px ${cfg.glowColor}`,
                }}>
                  <PhoneCall size={17} />
                  {cfg.emergency ? 'Find urgent veterinary care — Vet+' : 'Talk to a vet — Vet+'}
                </button>
              )}

              {!persistent && (
                <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--color-text-muted)',
                  marginTop: '0.7rem', marginBottom: 0, opacity: 0.5 }}>
                  Tap outside to dismiss
                </p>
              )}
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '0.8rem' }}>
      <h4 style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em',
        textTransform: 'uppercase', color: 'var(--color-text-muted)', margin: '0 0 0.4rem' }}>
        {title}
      </h4>
      {children}
    </div>
  );
}
