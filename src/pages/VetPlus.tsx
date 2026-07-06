import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Star, ChevronRight, Heart, Stethoscope, ArrowLeft, CheckCircle, AlertCircle, X, Camera, Mic, FileText } from 'lucide-react';

// ── PLACEHOLDER VET DATA ────────────────────────────────────────────────────
const MOCK_VETS = [
  {
    id: 'v1',
    name: 'Dr. Priya Nair',
    specialty: 'Small Animal & Behavioral Specialist',
    distance: '0.8 km',
    rating: 4.9,
    reviews: 312,
    availabilityLabel: 'Next: Today 3:30 PM',
    available: true,
    avatar: '👩‍⚕️',
    tags: ['Dog', 'Cat', 'Anxiety'],
    gradient: 'linear-gradient(135deg, #ffaaa5 0%, #ffd3b6 100%)',
  },
  {
    id: 'v2',
    name: 'Dr. Arjun Mehta',
    specialty: 'Canine Behavior & Anxiety',
    distance: '1.4 km',
    rating: 4.8,
    reviews: 198,
    availabilityLabel: 'Next: Tomorrow 10:00 AM',
    available: false,
    avatar: '👨‍⚕️',
    tags: ['Dog', 'Behavior', 'Anxiety'],
    gradient: 'linear-gradient(135deg, #a8e6cf 0%, #dcedc1 100%)',
  },
  {
    id: 'v3',
    name: 'Dr. Kavya Sharma',
    specialty: 'Feline Wellness & Nutrition',
    distance: '2.1 km',
    rating: 5.0,
    reviews: 441,
    availabilityLabel: 'Next: Today 5:00 PM',
    available: true,
    avatar: '👩‍⚕️',
    tags: ['Cat', 'Nutrition', 'Kitten Care'],
    gradient: 'linear-gradient(135deg, #dcedc1 0%, #a8e6cf 100%)',
  },
  {
    id: 'v4',
    name: 'Dr. Rohan Iyer',
    specialty: 'Emergency & Trauma Care',
    distance: '3.0 km',
    rating: 4.7,
    reviews: 259,
    availabilityLabel: 'Next: Tomorrow 9:00 AM',
    available: false,
    avatar: '👨‍⚕️',
    tags: ['Dog', 'Emergency', 'Surgery'],
    gradient: 'linear-gradient(135deg, #ffd3b6 0%, #f4d068 100%)',
  },
];

// Placeholder recent scans
const RECENT_SCANS = [
  { id: 's1', label: 'Luna – Calm & Resting', date: 'Today 10:14 AM', score: 12, type: 'Dog' },
  { id: 's2', label: 'Luna – Mild Distress', date: 'May 16 2:00 PM', score: 62, type: 'Dog' },
  { id: 's3', label: 'Milo – Possible Stress Signals', date: 'Yesterday 6:12 PM', score: 78, type: 'Cat' },
];

type FlowStep = 'browse' | 'choose-vet' | 'select-scans' | 'confirm';

interface SelectedVet {
  id: string;
  name: string;
  specialty: string;
  avatar: string;
}

export default function VetPlus() {
  const navigate = useNavigate();
  const [step, setStep] = useState<FlowStep>('browse');
  const [selectedVet, setSelectedVet] = useState<SelectedVet | null>(null);
  const [selectedScans, setSelectedScans] = useState<string[]>([]);
  const [shareAnalysis, setShareAnalysis] = useState(true);
  const [bookingDone, setBookingDone] = useState(false);

  const handleSelectVet = useCallback((vet: typeof MOCK_VETS[0]) => {
    setSelectedVet({ id: vet.id, name: vet.name, specialty: vet.specialty, avatar: vet.avatar });
    setStep('choose-vet');
  }, []);

  const handleToggleScan = useCallback((id: string) => {
    setSelectedScans((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }, []);

  const handleConfirmBooking = useCallback(() => {
    setBookingDone(true);
  }, []);

  const handleReset = useCallback(() => {
    setStep('browse');
    setSelectedVet(null);
    setSelectedScans([]);
    setShareAnalysis(true);
    setBookingDone(false);
  }, []);

  return (
    <>
      {/* ── CINEMATIC BACKGROUND ─────────────────────────────────────── */}
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
        {/* ── HEADER ──────────────────────────────────────────────────── */}
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
              Smart Veterinary Marketplace
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
            Find verified vets nearby, share your pet's emotional scans, and prepare for a more informed consultation.
          </motion.p>
        </div>

        {/* ── PLACEHOLDER NOTICE BANNER ────────────────────────────────── */}
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
              <strong style={{ color: 'var(--color-text-dark)' }}>Vet+ is a request &amp; waitlist service.</strong>{' '}
              Practices below are illustrative while we verify and onboard partners. For urgent concerns,
              contact your veterinarian directly.
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

        {/* ════════════════════════════════════════════════════════════════
            STEP: BROWSE VETS
        ════════════════════════════════════════════════════════════════ */}
        <AnimatePresence mode="wait">
          {step === 'browse' && (
            <motion.div
              key="browse"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4 }}
              style={{ width: '100%' }}
            >
              {/* Location chip */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', justifyContent: 'center' }}>
                <MapPin size={16} color="var(--color-sunset-coral)" />
                <span style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                  Showing vets near <strong style={{ color: 'var(--color-text-dark)' }}>Bengaluru, KA</strong>
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.25rem' }}>
                {MOCK_VETS.map((vet, idx) => (
                  <motion.div
                    key={vet.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.07 }}
                    whileHover={{ y: -5, boxShadow: '0 20px 48px rgba(168,230,207,0.2)' }}
                    style={{
                      background: 'rgba(255,255,255,0.8)',
                      backdropFilter: 'blur(20px)',
                      border: '1.5px solid rgba(255,255,255,0.85)',
                      borderRadius: '24px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'box-shadow 0.35s ease, transform 0.35s ease',
                    }}
                    onClick={() => handleSelectVet(vet)}
                  >
                    {/* Gradient header */}
                    <div style={{ height: 80, background: vet.gradient, display: 'flex', alignItems: 'center', padding: '0 1.5rem', gap: '1rem' }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.6rem', border: '2px solid rgba(255,255,255,0.6)',
                      }}>
                        {vet.avatar}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
                          {vet.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)', marginTop: '0.15rem' }}>
                          {vet.specialty}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                          <MapPin size={13} />
                          {vet.distance}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--color-soft-gold)', fontWeight: 600 }}>
                          <Star size={13} fill="currentColor" />
                          {vet.rating} <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>({vet.reviews})</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '1rem' }}>
                        <Clock size={13} color={vet.available ? 'var(--color-sage-green)' : 'var(--color-text-muted)'} />
                        <span style={{ fontSize: '0.82rem', color: vet.available ? 'var(--color-sage-green)' : 'var(--color-text-muted)', fontWeight: vet.available ? 600 : 400 }}>
                          {vet.availabilityLabel}
                        </span>
                      </div>

                      {/* Specialty tags */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
                        {vet.tags.map((tag) => (
                          <span key={tag} style={{
                            fontSize: '0.72rem', fontWeight: 600,
                            background: 'rgba(168,230,207,0.2)', color: '#5a8a74',
                            borderRadius: '999px', padding: '0.2rem 0.6rem',
                            border: '1px solid rgba(168,230,207,0.4)',
                          }}>
                            {tag}
                          </span>
                        ))}
                      </div>

                      <button
                        style={{
                          width: '100%', padding: '0.7rem',
                          borderRadius: '12px', border: 'none',
                          background: vet.gradient, color: '#4a403a',
                          fontWeight: 600, fontSize: '0.9rem',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                          boxShadow: '0 4px 16px rgba(168,230,207,0.25)',
                          fontFamily: 'var(--font-family)',
                          transition: 'opacity 0.2s',
                        }}
                        onClick={(e) => { e.stopPropagation(); handleSelectVet(vet); }}
                      >
                        Book Consultation <ChevronRight size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              STEP: CHOOSE VET — confirm selection & choose scans
          ══════════════════════════════════════════════════════════════ */}
          {(step === 'choose-vet' || step === 'select-scans') && !bookingDone && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.38 }}
              style={{ width: '100%', maxWidth: 560, margin: '0 auto' }}
            >
              {/* Back button */}
              <button
                onClick={() => step === 'choose-vet' ? setStep('browse') : setStep('choose-vet')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 500,
                  marginBottom: '1.5rem', fontFamily: 'var(--font-family)',
                  padding: '0.4rem 0',
                }}
              >
                <ArrowLeft size={16} /> Back
              </button>

              {/* Vet confirm card */}
              {selectedVet && (
                <div style={{
                  background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
                  border: '1.5px solid rgba(255,255,255,0.9)', borderRadius: '24px',
                  padding: '1.5rem', marginBottom: '1.5rem',
                  display: 'flex', alignItems: 'center', gap: '1rem',
                }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ffaaa5, #ffd3b6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.8rem', flexShrink: 0,
                  }}>
                    {selectedVet.avatar}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-text-dark)' }}>{selectedVet.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>{selectedVet.specialty}</div>
                  </div>
                  <CheckCircle size={22} color="var(--color-sage-green)" style={{ marginLeft: 'auto', flexShrink: 0 }} />
                </div>
              )}

              {step === 'choose-vet' && (
                <>
                  <h3 style={{ fontWeight: 600, fontSize: '1.15rem', color: 'var(--color-text-dark)', marginBottom: '1rem' }}>
                    Select Scans to Share
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                    Attach recent emotional analysis sessions to help your vet prepare a more informed consultation.
                  </p>

                  {RECENT_SCANS.map((scan) => {
                    const checked = selectedScans.includes(scan.id);
                    return (
                      <motion.div
                        key={scan.id}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => handleToggleScan(scan.id)}
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
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--color-text-dark)' }}>{scan.label}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                            {scan.date} · Signal: {scan.score}/100
                          </div>
                        </div>
                        <span style={{
                          fontSize: '0.72rem', fontWeight: 600,
                          background: scan.score > 50 ? 'rgba(255,170,165,0.2)' : 'rgba(168,230,207,0.2)',
                          color: scan.score > 50 ? '#c0665e' : '#5a8a74',
                          borderRadius: '999px', padding: '0.2rem 0.55rem',
                        }}>
                          {scan.type}
                        </span>
                      </motion.div>
                    );
                  })}

                  {/* Share emotional analysis toggle */}
                  <div style={{
                    background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)',
                    border: '1.5px solid rgba(255,255,255,0.8)', borderRadius: '16px',
                    padding: '1rem 1.25rem', marginTop: '0.5rem', marginBottom: '1.5rem',
                    display: 'flex', alignItems: 'center', gap: '0.9rem', cursor: 'pointer',
                  }}
                    onClick={() => setShareAnalysis(v => !v)}
                  >
                    <Heart size={18} color={shareAnalysis ? 'var(--color-sunset-coral)' : 'var(--color-text-muted)'} fill={shareAnalysis ? 'var(--color-sunset-coral)' : 'transparent'} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-dark)' }}>Share Emotional Analysis</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>Send your pet's behavioral summary to the vet</div>
                    </div>
                    <div style={{
                      width: 42, height: 24, borderRadius: '999px',
                      background: shareAnalysis ? 'var(--gradient-sage)' : 'rgba(0,0,0,0.12)',
                      position: 'relative', transition: 'background 0.3s',
                      flexShrink: 0,
                    }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', background: 'white',
                        position: 'absolute', top: 3, left: shareAnalysis ? 21 : 3,
                        transition: 'left 0.3s', boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
                      }} />
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setStep('select-scans')}
                    className="btn btn-cta"
                    style={{ width: '100%', borderRadius: '16px', fontSize: '1rem' }}
                  >
                    Continue to Booking <ChevronRight size={18} />
                  </motion.button>
                </>
              )}

              {step === 'select-scans' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
                    border: '1.5px solid rgba(255,255,255,0.9)', borderRadius: '24px',
                    padding: '2rem',
                  }}
                >
                  <h3 style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--color-text-dark)', marginBottom: '0.5rem' }}>
                    Pre-Consultation Summary
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                    Review what will be shared with the vet before confirming.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
                      <Camera size={16} color="var(--color-sage-green)" />
                      <span style={{ color: 'var(--color-text-muted)' }}>
                        <strong style={{ color: 'var(--color-text-dark)' }}>{selectedScans.length}</strong> scan{selectedScans.length !== 1 ? 's' : ''} selected
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
                      <Heart size={16} color={shareAnalysis ? 'var(--color-sunset-coral)' : 'var(--color-text-muted)'} />
                      <span style={{ color: 'var(--color-text-muted)' }}>
                        Emotional analysis: <strong style={{ color: 'var(--color-text-dark)' }}>{shareAnalysis ? 'Included' : 'Not shared'}</strong>
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
                      <FileText size={16} color="var(--color-sage-green)" />
                      <span style={{ color: 'var(--color-text-muted)' }}>Behavioral summary report prepared</span>
                    </div>
                  </div>

                  {/* Placeholder message */}
                  <div style={{
                    background: 'rgba(255,211,182,0.2)', border: '1px solid rgba(255,211,182,0.4)',
                    borderRadius: '14px', padding: '0.9rem 1.1rem', marginBottom: '1.5rem',
                    fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.5,
                  }}>
                    🌿 Verified veterinary onboarding is coming soon. Please contact your veterinarian directly for urgent concerns.
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleConfirmBooking}
                    className="btn btn-cta"
                    style={{ width: '100%', borderRadius: '16px', fontSize: '1rem' }}
                  >
                    ✨ Confirm Pre-Consultation Request
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              STEP: CONFIRMED
          ══════════════════════════════════════════════════════════════ */}
          {bookingDone && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ width: '100%', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}
            >
              <div style={{
                background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(24px)',
                border: '1.5px solid rgba(168,230,207,0.4)', borderRadius: '28px',
                padding: '3rem 2rem',
              }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #a8e6cf, #dcedc1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  boxShadow: '0 12px 30px rgba(168,230,207,0.35)',
                }}>
                  <CheckCircle size={36} color="white" />
                </div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-text-dark)', marginBottom: '0.75rem' }}>
                  Request Sent!
                </h2>
                <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', lineHeight: 1.6, maxWidth: 360, margin: '0 auto 2rem' }}>
                  Your pre-consultation request has been prepared and is ready to share with{' '}
                  <strong style={{ color: 'var(--color-text-dark)' }}>{selectedVet?.name}</strong>.
                  They will be in touch once onboarding is complete.
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', opacity: 0.75, marginBottom: '2rem', lineHeight: 1.5 }}>
                  🌿 Verified veterinary onboarding is coming soon. Please contact your veterinarian directly for urgent concerns.
                </p>
                <button
                  onClick={handleReset}
                  className="btn btn-primary"
                  style={{ borderRadius: '14px', fontSize: '0.95rem', padding: '0.85rem 2rem' }}
                >
                  Browse More Vets
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
