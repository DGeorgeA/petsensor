/**
 * src/lib/devMode.ts
 *
 * Development/admin mode gate. Diagnostics overlays and admin panels render
 * ONLY when the device has opted in via: localStorage.setItem('smp_dev', '1').
 * Normal consumers never see developer tooling (P6/P14).
 */
export function devDiagnosticsEnabled(): boolean {
  try { return localStorage.getItem('smp_dev') === '1'; } catch { return false; }
}
