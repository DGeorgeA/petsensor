import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, ArrowLeft, CheckCircle, ShieldCheck } from 'lucide-react';
import {
  submitVetApplication,
  validateApplication,
  type VetApplication,
  type SpeciesHandled,
  type SubmitMode,
} from '../lib/vetPartners';

const field: React.CSSProperties = {
  width: '100%', padding: '0.75rem 0.9rem', borderRadius: 12,
  border: '1.5px solid rgba(0,0,0,0.10)', background: 'rgba(255,255,255,0.8)',
  fontSize: '0.92rem', color: 'var(--color-text-dark)', fontFamily: 'var(--font-family)',
  outline: 'none',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.8rem', fontWeight: 600,
  color: 'var(--color-text-dark)', marginBottom: '0.35rem',
};

export default function VetOnboarding() {
  const navigate = useNavigate();
  const [form, setForm] = useState<VetApplication>({
    clinic_name: '', vet_name: '', license_no: '', email: '',
    phone: '', city: '', species: [], services: '', message: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<SubmitMode | null>(null);

  const set = <K extends keyof VetApplication>(k: K, v: VetApplication[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleSpecies = useCallback((s: SpeciesHandled) => {
    setForm((f) => ({
      ...f,
      species: f.species.includes(s) ? f.species.filter((x) => x !== s) : [...f.species, s],
    }));
  }, []);

  const onSubmit = useCallback(async () => {
    const v = validateApplication(form);
    if (v) { setError(v); return; }
    setError(null);
    setSubmitting(true);
    const res = await submitVetApplication(form);
    setSubmitting(false);
    if (res.ok) setDone(res.mode);
    else setError(res.error ?? 'Something went wrong. Please try again.');
  }, [form]);

  return (
    <>
      <div aria-hidden style={{
        position: 'fixed', inset: 0, zIndex: -2, overflow: 'hidden',
        background: 'linear-gradient(160deg, #f0faf5 0%, #fbf7f3 60%, #ffecd9 100%)',
      }} />
      <div className="flex flex-col items-center"
        style={{ maxWidth: 620, margin: '0 auto', padding: 'clamp(1rem, 4vw, 2rem)', paddingBottom: '5rem' }}>

        <button onClick={() => navigate('/vet-plus')} style={{
          alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.4rem',
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 500,
          marginBottom: '1.25rem', fontFamily: 'var(--font-family)',
        }}>
          <ArrowLeft size={16} /> Back to Vet+
        </button>

        {done ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
            style={{
              width: '100%', textAlign: 'center', background: 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(24px)', border: '1.5px solid rgba(168,230,207,0.4)',
              borderRadius: 28, padding: '2.5rem 2rem',
            }}>
            <div style={{
              width: 68, height: 68, borderRadius: '50%',
              background: 'linear-gradient(135deg, #a8e6cf, #dcedc1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem', boxShadow: '0 12px 30px rgba(168,230,207,0.35)',
            }}>
              <CheckCircle size={34} color="white" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-dark)', marginBottom: '0.6rem' }}>
              Application received
            </h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--color-text-muted)', lineHeight: 1.6, maxWidth: 400, margin: '0 auto 1.5rem' }}>
              Thank you, {form.vet_name || 'Doctor'}. Our team reviews every application and verifies
              registration details before a practice goes live on Vet+. We'll be in touch at{' '}
              <strong style={{ color: 'var(--color-text-dark)' }}>{form.email}</strong>.
              {done === 'queued-local' && ' (Saved on this device — it will be sent once the directory service is connected.)'}
            </p>
            <button onClick={() => navigate('/vet-plus')} className="btn btn-primary"
              style={{ borderRadius: 14, fontSize: '0.95rem', padding: '0.8rem 2rem' }}>
              Done
            </button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                background: 'rgba(168,230,207,0.18)', border: '1px solid rgba(168,230,207,0.4)',
                borderRadius: 999, padding: '0.4rem 1rem', marginBottom: '0.9rem',
              }}>
                <Stethoscope size={14} color="var(--color-sage-green)" />
                <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--color-text-dark)' }}>
                  For veterinary professionals
                </span>
              </div>
              <h1 className="section-title" style={{ marginBottom: '0.5rem', fontSize: 'clamp(1.6rem, 5vw, 2.3rem)' }}>
                Join Vet<span style={{ color: 'var(--color-sage-green)' }}>+</span>
              </h1>
              <p className="section-subtitle" style={{ maxWidth: 460, margin: '0 auto' }}>
                List your practice, receive owner-shared behavioural screening summaries, and connect with
                pet parents who are already paying attention to their pet's wellbeing.
              </p>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(255,255,255,0.9)', borderRadius: 24, padding: 'clamp(1.25rem, 4vw, 2rem)',
            }}>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Clinic / practice name *</label>
                  <input style={field} value={form.clinic_name} onChange={(e) => set('clinic_name', e.target.value)} placeholder="Paws & Claws Veterinary Clinic" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Veterinarian name *</label>
                    <input style={field} value={form.vet_name} onChange={(e) => set('vet_name', e.target.value)} placeholder="Dr. Jane Doe" />
                  </div>
                  <div>
                    <label style={labelStyle}>Registration / licence no. *</label>
                    <input style={field} value={form.license_no} onChange={(e) => set('license_no', e.target.value)} placeholder="e.g. VCI/12345" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Email *</label>
                    <input style={field} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@clinic.com" />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone</label>
                    <input style={field} value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="Optional" />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>City</label>
                  <input style={field} value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Bengaluru, KA" />
                </div>
                <div>
                  <label style={labelStyle}>Species you treat *</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {(['dog', 'cat'] as SpeciesHandled[]).map((s) => {
                      const active = form.species.includes(s);
                      return (
                        <button key={s} type="button" onClick={() => toggleSpecies(s)} style={{
                          flex: 1, padding: '0.6rem', borderRadius: 12, cursor: 'pointer', fontWeight: 600,
                          fontSize: '0.9rem', fontFamily: 'var(--font-family)',
                          border: active ? '1.5px solid var(--color-sage-green)' : '1.5px solid rgba(0,0,0,0.1)',
                          background: active ? 'rgba(168,230,207,0.18)' : 'rgba(255,255,255,0.7)',
                          color: active ? '#3a8c65' : 'var(--color-text-muted)',
                        }}>
                          {s === 'dog' ? '🐶 Dogs' : '🐱 Cats'}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Services offered</label>
                  <input style={field} value={form.services} onChange={(e) => set('services', e.target.value)} placeholder="Behaviour, general practice, emergency…" />
                </div>
                <div>
                  <label style={labelStyle}>Anything else?</label>
                  <textarea style={{ ...field, minHeight: 84, resize: 'vertical' }} value={form.message} onChange={(e) => set('message', e.target.value)} placeholder="Tell us about your practice (optional)" />
                </div>
              </div>

              {error && (
                <p style={{ color: '#c0281f', fontSize: '0.85rem', margin: '1rem 0 0', fontWeight: 500 }}>{error}</p>
              )}

              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                background: 'rgba(168,230,207,0.10)', borderRadius: 12, padding: '0.7rem 0.85rem', margin: '1.1rem 0',
              }}>
                <ShieldCheck size={15} color="var(--color-sage-green)" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
                  We verify registration details before listing a practice. We only store the professional
                  details you enter here — never a pet owner's audio or video.
                </p>
              </div>

              <button onClick={onSubmit} disabled={submitting} className="btn btn-cta"
                style={{ width: '100%', borderRadius: 14, fontSize: '1rem', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Submitting…' : 'Submit application'}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
}
