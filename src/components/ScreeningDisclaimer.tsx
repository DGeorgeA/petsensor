import React, { useState } from 'react';
import { ShieldCheck, Info, ChevronDown } from 'lucide-react';

/**
 * Mandatory pre-scan disclaimer + verified privacy statement — compact by
 * default so the scan window stays above the fold, expandable for full copy.
 *
 * The privacy sentence is only true because the app performs all inference
 * on-device and uploads no raw audio/video (verified by code + network audit).
 * Do not change the privacy copy without re-verifying that claim.
 */
export default function ScreeningDisclaimer() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ width: '100%', maxWidth: 560, margin: '0.5rem auto 0' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(126,203,168,0.35)',
          borderRadius: open ? '14px 14px 0 0' : '14px',
          padding: '0.55rem 0.85rem',
          cursor: 'pointer', fontFamily: 'var(--font-family)', textAlign: 'left',
        }}
      >
        <ShieldCheck size={14} color="#3a8c65" style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: '0.76rem', fontWeight: 600, color: '#4a403a', lineHeight: 1.35 }}>
          Screening, not a diagnosis · processed on your device — nothing uploaded
        </span>
        <ChevronDown
          size={14} color="#8b7d75"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s ease' }}
        />
      </button>

      {open && (
        <div style={{
          background: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(126,203,168,0.35)', borderTop: 'none',
          borderRadius: '0 0 14px 14px',
          padding: '0.75rem 0.9rem',
          display: 'flex', flexDirection: 'column', gap: '0.65rem',
        }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <Info size={14} color="#7ecba8" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: '0.77rem', lineHeight: 1.5, color: '#5c5148', margin: 0 }}>
              SenseMyPet provides AI-assisted behavioural <strong>screening</strong> based on observable sound
              and visual patterns. Results are informational only and are <strong>not a veterinary diagnosis</strong>.
              Behavioural signs may have many causes. If you are concerned about your pet's health or behaviour,
              consult a qualified veterinarian.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <ShieldCheck size={14} color="#3a8c65" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: '0.77rem', lineHeight: 1.5, color: '#5c5148', margin: 0 }}>
              Audio and camera input are processed on your device for the active scan.
              Raw audio and video are not stored on our servers.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
