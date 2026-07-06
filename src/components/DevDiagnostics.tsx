import React from 'react';
import type { EngineDiagnostics } from '../lib/unifiedEngine';
import { devDiagnosticsEnabled } from '../lib/devMode';

/**
 * DevDiagnostics — development-only stage instrumentation (P6/P8 RCA).
 *
 * Renders NOTHING unless the device has opted in via:
 *   localStorage.setItem('smp_dev', '1')
 * Normal users never see this. It exposes every pipeline stage so a field
 * failure ("dog visible but not detected" vs "detected but no stress evidence")
 * can be localised to the exact layer.
 */

const row: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 8 };
const num = (v: number, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : '—');

export default function DevDiagnostics({ diag }: { diag: EngineDiagnostics | null }) {
  if (!devDiagnosticsEnabled() || !diag) return null;
  const a = diag.audio;
  return (
    <div style={{
      position: 'fixed', bottom: 8, left: 8, zIndex: 400,
      width: 250, maxHeight: '46vh', overflowY: 'auto',
      background: 'rgba(12,12,14,0.88)', color: '#9fe8b0',
      fontFamily: 'Consolas, monospace', fontSize: 10.5, lineHeight: 1.5,
      borderRadius: 10, padding: '8px 10px',
      border: '1px solid rgba(159,232,176,0.3)',
      pointerEvents: 'none',
    }}>
      <div style={{ color: '#fff', fontWeight: 700, marginBottom: 4 }}>DEV DIAG · {diag.mode}</div>
      <div style={row}><span>camera_active</span><span>{String(diag.cameraActive)}</span></div>
      <div style={row}><span>frames sent/proc</span><span>{diag.framesSent}/{diag.framesProcessed}</span></div>
      <div style={row}><span>usable_ratio</span><span>{num(diag.usableFrameRatio)}</span></div>
      <div style={row}><span>model_available</span><span>{String(diag.modelAvailable)}</span></div>
      <div style={row}><span>species</span><span>{diag.species ?? '—'} ({num(diag.speciesConfidence)})</span></div>
      <div style={row}><span>visual_state</span><span>{diag.visualState ?? '—'}</span></div>
      <div style={row}><span>visual sev/conf</span><span>{num(diag.visualSeverity, 0)}/{num(diag.visualConfidence, 0)}</span></div>
      <div style={row}><span>persistent_cues</span><span>{diag.cueCount}</span></div>
      {a && (
        <>
          <div style={{ color: '#fff', fontWeight: 700, margin: '6px 0 2px' }}>AUDIO</div>
          <div style={row}><span>rms</span><span>{num(a.rms, 3)}</span></div>
          <div style={row}><span>stage</span><span>{a.stage}</span></div>
          {a.reason && <div style={row}><span>reason</span><span>{a.reason}</span></div>}
          <div style={row}><span>top1</span><span>{a.top1Key || '—'} {num(a.top1Score)}</span></div>
          <div style={row}><span>top2</span><span>{a.top2Key || '—'} {num(a.top2Score)}</span></div>
          <div style={row}><span>margin</span><span>{num(a.margin)}</span></div>
        </>
      )}
    </div>
  );
}
