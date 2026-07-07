import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope, AlertCircle, CheckCircle, FileText, Download, Share2,
  ChevronRight, PawPrint, Phone,
} from 'lucide-react';
import { getLocalScans, type LocalScanRecord } from '../lib/localHistory';
import {
  scanReportDataFromLocal, downloadScanReports, shareScanReports,
} from '../lib/scanReport';
import { AI_REFERENCE_DISCLAIMER } from '../lib/conditionGroups';

/**
 * Vet+ — honest, real-data version.
 *
 * NO fabricated content: no mock veterinarians, no invented ratings or
 * availability, no fake booking confirmations. What it really offers today:
 *   1. The user's REAL on-device scan history (IndexedDB) — select scans and
 *      download/share a vet-ready report (open the HTML → print → PDF).
 *   2. Honest partner status: verified onboarding is in progress; the CTA is
 *      real (vet onboarding form writes to Supabase vet_partners).
 */

function fmtWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export default function VetPlus() {
  const navigate = useNavigate();
  const [scans, setScans] = useState<LocalScanRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void getLocalScans(20).then((rows) => {
      if (!alive) return;
      setScans(rows);
      setLoaded(true);
    });
    return () => { alive = false; };
  }, []);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
    setFeedback(null);
  }, []);

  const selectedRecords = scans.filter((s) => selected.includes(s.id));

  const handleDownload = useCallback(() => {
    if (selectedRecords.length === 0) return;
    downloadScanReports(selectedRecords.map(scanReportDataFromLocal));
    setFeedback(`Downloaded ${selectedRecords.length} report${selectedRecords.length === 1 ? '' : 's'} — open the file and print to PDF for your vet.`);
  }, [selectedRecords]);

  const handleShare = useCallback(async () => {
    if (selectedRecords.length === 0) return;
    const how = await shareScanReports(selectedRecords.map(scanReportDataFromLocal));
    setFeedback(
      how === 'shared' ? 'Report summary shared.'
      : how === 'copied' ? 'Report summary copied to clipboard — paste it to your vet.'
      : 'Sharing unavailable on this device — use Download instead.',
    );
  }, [selectedRecords]);

  return (
    <>
      {/* ── BACKGROUND ─────────────────────────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0, zIndex: -2, overflow: 'hidden',
          background: 'linear-gradient(160deg, #f0faf5 0%, #fbf7f3 60%, #ffecd9 100%)',
        }}
      >
        <div style={{
          position: 'absolute', top: '-15%', right: '-10%',
          width: '55vw', height: '55vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168,230,207,0.2) 0%, rgba(255,211,182,0.08) 55%, transparent 75%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', left: '-10%',
          width: '40vw', height: '40vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,170,165,0.12) 0%, transparent 70%)',
        }} />
      </div>

      <div
        className="flex flex-col items-center"
        style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(1rem, 4vw, 2rem)', paddingBottom: '5rem' }}
      >
        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <div className="text-center" style={{ width: '100%', marginBottom: 'clamp(1.5rem, 4vh, 2.5rem)' }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(168,230,207,0.18)', border: '1px solid rgba(168,230,207,0.4)',
              borderRadius: '999px', padding: '0.4rem 1rem', marginBottom: '1rem',
            }}
          >
            <Stethoscope size={14} color="var(--color-sage-green)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-dark)' }}>
              Share screening results with a professional
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="section-title"
            style={{ marginBottom: '0.75rem' }}
          >
            Vet<span style={{ color: 'var(--color-sage-green)' }}>+</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="section-subtitle"
            style={{ maxWidth: 520, margin: '0 auto' }}
          >
            Turn your pet's screening scans into a vet-ready report — download it, share it,
            or bring it to your consultation.
          </motion.p>
        </div>

        {/* ── HONEST STATUS BANNER ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{
            width: '100%', maxWidth: 680,
            background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(168,230,207,0.35)', borderRadius: '18px',
            padding: '1rem 1.25rem', marginBottom: '2rem',
            display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
          }}
        >
          <AlertCircle size={18} color="var(--color-sage-green)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: 1.55, margin: 0 }}>
              <strong style={{ color: 'var(--color-text-dark)' }}>
                We are verifying and onboarding veterinary partners now.
              </strong>{' '}
              Until verified partners appear here, download your report below and share it with your
              local veterinarian. For urgent concerns, contact a veterinarian or emergency clinic directly.
            </p>
            <button
              onClick={() => navigate('/vet-onboarding')}
              style={{
                marginTop: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                background: 'var(--gradient-sage, linear-gradient(135deg,#a8e6cf,#dcedc1))',
                color: '#2f5f47', border: 'none', borderRadius: 999,
                padding: '0.45rem 1rem', fontSize: '0.83rem', fontWeight: 700, cursor: 'pointer',
                fontFamily: 'var(--font-family)',
              }}
            >
              <Stethoscope size={14} /> Are you a vet? Join Vet+
            </button>
          </div>
        </motion.div>

        {/* ── YOUR SCAN REPORTS (REAL on-device history) ─────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ width: '100%', maxWidth: 680 }}
        >
          <h3 style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--color-text-dark)', marginBottom: '0.4rem' }}>
            Your scan reports
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
            These are your real scans, stored only on this device. Select the ones to include —
            the report contains the screening summary only, never audio or video.
          </p>

          {!loaded && (
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Loading your scans…</p>
          )}

          {loaded && scans.length === 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(16px)',
              border: '1.5px solid rgba(255,255,255,0.85)', borderRadius: '20px',
              padding: '2rem 1.5rem', textAlign: 'center',
            }}>
              <PawPrint size={28} color="var(--color-sage-green)" style={{ marginBottom: '0.6rem' }} />
              <p style={{ fontWeight: 600, color: 'var(--color-text-dark)', margin: '0 0 0.4rem' }}>
                No scans on this device yet
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0 0 1.2rem', lineHeight: 1.5 }}>
                Run a Listen, Scan or Both check first — completed scans appear here,
                ready to share with a vet.
              </p>
              <button
                onClick={() => navigate('/')}
                className="btn btn-cta"
                style={{ borderRadius: 14, fontSize: '0.92rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                Start a check <ChevronRight size={16} />
              </button>
            </div>
          )}

          <AnimatePresence>
            {scans.map((scan) => {
              const checked = selected.includes(scan.id);
              return (
                <motion.div
                  key={scan.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => toggle(scan.id)}
                  style={{
                    background: checked ? 'rgba(168,230,207,0.15)' : 'rgba(255,255,255,0.7)',
                    border: checked ? '1.5px solid rgba(168,230,207,0.5)' : '1.5px solid rgba(255,255,255,0.7)',
                    borderRadius: '16px', padding: '1rem 1.25rem',
                    marginBottom: '0.75rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.9rem',
                    transition: 'all 0.25s ease',
                  }}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: '6px',
                    border: `2px solid ${checked ? 'var(--color-sage-green)' : 'rgba(0,0,0,0.15)'}`,
                    background: checked ? 'var(--color-sage-green)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'all 0.2s',
                  }}>
                    {checked && <CheckCircle size={14} color="white" fill="white" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--color-text-dark)' }}>
                      {scan.label || scan.headline}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                      {fmtWhen(scan.created_at)}
                      {typeof scan.severity === 'number' ? ` · Signal ${scan.severity}/100` : ''}
                      {scan.condition_match_name ? ` · Match: ${scan.condition_match_name}` : ''}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 600,
                    background: scan.animal_type === 'cat' ? 'rgba(200,170,220,0.22)' : 'rgba(255,170,165,0.2)',
                    color: scan.animal_type === 'cat' ? '#7a5a96' : '#c0665e',
                    borderRadius: '999px', padding: '0.2rem 0.55rem', flexShrink: 0,
                  }}>
                    {scan.animal_type === 'cat' ? 'Cat' : 'Dog'}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {scans.length > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(255,255,255,0.9)', borderRadius: '20px',
              padding: '1.25rem 1.5rem', marginTop: '0.75rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.9rem' }}>
                <FileText size={16} color="var(--color-sage-green)" />
                <span style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
                  <strong style={{ color: 'var(--color-text-dark)' }}>{selected.length}</strong>{' '}
                  scan{selected.length === 1 ? '' : 's'} selected for the report
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <button
                  onClick={handleDownload}
                  disabled={selected.length === 0}
                  className="btn btn-cta"
                  style={{
                    flex: 1, minWidth: 180, borderRadius: 14, fontSize: '0.92rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
                    opacity: selected.length === 0 ? 0.5 : 1,
                    cursor: selected.length === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Download size={16} /> Download report
                </button>
                <button
                  onClick={handleShare}
                  disabled={selected.length === 0}
                  style={{
                    flex: 1, minWidth: 180, borderRadius: 14, fontSize: '0.92rem', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
                    padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.9)',
                    border: '1.5px solid rgba(168,230,207,0.6)', color: '#2f5f47',
                    opacity: selected.length === 0 ? 0.5 : 1,
                    cursor: selected.length === 0 ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-family)',
                  }}
                >
                  <Share2 size={16} /> Share with your vet
                </button>
              </div>
              {feedback && (
                <p style={{ fontSize: '0.8rem', color: 'var(--color-sage-green)', margin: '0.7rem 0 0', fontWeight: 600 }}>
                  {feedback}
                </p>
              )}
              <p style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', margin: '0.7rem 0 0', lineHeight: 1.5 }}>
                {AI_REFERENCE_DISCLAIMER}
              </p>
            </div>
          )}

          {/* ── URGENT CARE NOTE ──────────────────────────────────────────── */}
          <div style={{
            marginTop: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
            background: 'rgba(255,211,182,0.18)', border: '1px solid rgba(255,211,182,0.4)',
            borderRadius: '14px', padding: '0.9rem 1.1rem',
          }}>
            <Phone size={15} color="#b0764a" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
              If your pet shows emergency signs — collapse, seizure-like activity, laboured or
              open-mouth breathing, severe bleeding — contact a veterinarian or emergency clinic
              immediately. Do not wait for a scan or report.
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
}
