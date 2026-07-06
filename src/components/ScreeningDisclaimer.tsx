import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

/**
 * Mandatory pre-scan disclaimer + verified privacy statement.
 *
 * The privacy sentence is only true because the app performs all inference
 * on-device and uploads no raw audio/video (verified by code + network audit).
 * Do not change the privacy copy without re-verifying that claim.
 */
export default function ScreeningDisclaimer() {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 560,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        marginTop: '0.5rem',
      }}
    >
      <div style={{
        display: 'flex', gap: '0.55rem', alignItems: 'flex-start',
        background: 'rgba(126,203,168,0.10)',
        border: '1px solid rgba(126,203,168,0.28)',
        borderRadius: '14px', padding: '0.7rem 0.85rem',
      }}>
        <Info size={15} color="#7ecba8" style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: '0.78rem', lineHeight: 1.5, color: 'var(--color-text-muted)', margin: 0 }}>
          SenseMyPet provides AI-assisted behavioural <strong>screening</strong> based on observable sound
          and visual patterns. Results are informational only and are <strong>not a veterinary diagnosis</strong>.
          Behavioural signs may have many causes. If you are concerned about your pet's health or behaviour,
          consult a qualified veterinarian.
        </p>
      </div>
      <div style={{
        display: 'flex', gap: '0.55rem', alignItems: 'flex-start',
        background: 'rgba(160,150,140,0.08)',
        border: '1px solid rgba(160,150,140,0.20)',
        borderRadius: '14px', padding: '0.7rem 0.85rem',
      }}>
        <ShieldCheck size={15} color="var(--color-sage-green)" style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: '0.78rem', lineHeight: 1.5, color: 'var(--color-text-muted)', margin: 0 }}>
          Audio and camera input are processed on your device for the active scan.
          Raw audio and video are not stored on our servers.
        </p>
      </div>
    </div>
  );
}
