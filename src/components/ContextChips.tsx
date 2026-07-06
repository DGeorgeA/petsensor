import React from 'react';
import { CONTEXT_QUESTIONS, type ScanContext } from '../lib/context';

interface Props {
  value: ScanContext;
  onChange: (next: ScanContext) => void;
}

/**
 * Lightweight owner-context toggles shown before a scan. Context gently modulates
 * interpretation (e.g. "just exercised" tempers panting/movement) but can never
 * manufacture certainty. Nothing here is uploaded.
 */
export default function ContextChips({ value, onChange }: Props) {
  return (
    <div style={{ width: '100%', textAlign: 'center' }}>
      <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: '0 0 0.5rem', fontWeight: 500 }}>
        Anything we should factor in? <span style={{ opacity: 0.7 }}>(optional)</span>
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', justifyContent: 'center' }}>
        {CONTEXT_QUESTIONS.map((q) => {
          const active = !!value[q.key];
          return (
            <button
              key={q.key}
              type="button"
              aria-pressed={active}
              onClick={() => onChange({ ...value, [q.key]: !active })}
              style={{
                fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                padding: '0.35rem 0.75rem', borderRadius: 999,
                border: active ? '1.5px solid #ff9e8a' : '1.5px solid rgba(0,0,0,0.10)',
                background: active ? 'rgba(255,158,138,0.16)' : 'rgba(255,255,255,0.65)',
                color: active ? '#c05440' : 'var(--color-text-muted)',
                transition: 'all 0.15s ease',
              }}
            >
              {q.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
