/**
 * src/lib/scanReport.ts
 *
 * Vet-shareable scan report. Builds a self-contained, print-friendly HTML
 * document from a scan summary so owners can download it (open → print → PDF)
 * or share it (Web Share API / clipboard) with their own vet or a Vet+ partner.
 *
 * Privacy: the report contains ONLY the non-media summary fields the app
 * already stores (class, indices, indicator labels, condition groups, reference
 * match name). No audio, no video, no features, no embeddings — nothing
 * reconstructable.
 *
 * Language: cautious and non-diagnostic throughout; the AI_REFERENCE_DISCLAIMER
 * is embedded verbatim in every report.
 */

import { AI_REFERENCE_DISCLAIMER, VET_FOLLOWUP_COPY } from './conditionGroups';
import type { LocalScanRecord } from './localHistory';

export interface ScanReportData {
  species: 'dog' | 'cat';
  createdAt: string;               // ISO
  /** Owner identity (signed-in email/name). Guest mode → omitted. */
  preparedBy?: string;
  /** Device-local pet name (optional personalisation, works in guest mode too). */
  petName?: string;
  screeningClass: string;
  headline: string;
  label?: string;
  severity?: number;               // 0-100
  observationConfidence?: number;  // 0-100
  modality?: string;
  scanMode?: string;
  indicators?: string[];
  explanations?: string[];
  recommendedAction?: string;
  conditionGroups?: string[];
  conditionMatchName?: string;
  conditionMatchPercent?: number;
}

/** Adapt a stored on-device history record to report data. */
export function scanReportDataFromLocal(r: LocalScanRecord): ScanReportData {
  return {
    species: r.animal_type,
    createdAt: r.created_at,
    screeningClass: r.screening_class,
    headline: r.headline,
    label: r.label,
    severity: r.severity,
    observationConfidence: r.observation_confidence,
    modality: r.modality,
    scanMode: r.scan_mode,
    indicators: r.indicators,
    explanations: r.explanations,
    recommendedAction: r.recommended_action,
    conditionGroups: r.condition_groups,
    conditionMatchName: r.condition_match_name,
    conditionMatchPercent: r.condition_match_percent,
  };
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium', timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

function row(label: string, value: string | undefined | null): string {
  if (!value) return '';
  return `<tr><th>${esc(label)}</th><td>${esc(value)}</td></tr>`;
}

/** Inner report section for one scan (shared by single + combined reports). */
function renderScanSection(d: ScanReportData): string {
  const speciesName = d.species === 'dog' ? 'Dog' : 'Cat';
  const sevRow = typeof d.severity === 'number'
    ? row('Stress Signal Index (severity)', `${d.severity} / 100`)
    : '';
  const confRow = typeof d.observationConfidence === 'number'
    ? row('Observation confidence (evidence quality — separate from severity)', `${d.observationConfidence} / 100`)
    : '';
  const matchBlock = d.conditionMatchName
    ? `<div class="match">
        <h2>Closest reference-library match</h2>
        <p><strong>${esc(d.conditionMatchName)}</strong> — ${d.conditionMatchPercent ?? '—'}% acoustic similarity
        to an on-device reference pattern.</p>
        <p class="note">${esc(VET_FOLLOWUP_COPY)}</p>
        <p class="note">Reference clips are engineering test data pending veterinary-validated recordings;
        similarity is acoustic pattern matching, not a clinical finding.</p>
      </div>`
    : '';
  const groupsBlock = d.conditionGroups?.length
    ? `<h2>Possible condition groups (non-diagnostic)</h2>
       <ul>${d.conditionGroups.map((g) => `<li>${esc(g)}</li>`).join('')}</ul>`
    : '';
  const indicatorsBlock = d.indicators?.length
    ? `<h2>Observed indicators</h2>
       <ul>${d.indicators.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`
    : '';
  const explanationsBlock = d.explanations?.length
    ? `<h2>Possible explanations (not a diagnosis)</h2>
       <p>${d.explanations.map(esc).join(' · ')}</p>`
    : '';

  return `
  <p class="headline">${esc(d.headline)}</p>
  <table>
    ${row('Pet name', d.petName)}
    ${row('Species', speciesName)}
    ${row('Prepared by (owner)', d.preparedBy)}
    ${row('Scan date', fmtDate(d.createdAt))}
    ${row('Screening class', d.screeningClass.replace(/_/g, ' '))}
    ${row('Primary observation', d.label)}
    ${sevRow}
    ${confRow}
    ${row('Evidence channels', d.modality)}
    ${row('Scan mode', d.scanMode)}
    ${row('Recommended next step', d.recommendedAction?.replace(/_/g, ' '))}
  </table>
  ${indicatorsBlock}
  ${groupsBlock}
  ${explanationsBlock}
  ${matchBlock}`;
}

/** Full printable HTML document around one or more scan sections. */
function wrapReportDocument(title: string, sectionsHtml: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; color: #2c2118; margin: 0;
         background: #fbf7f2; }
  .page { max-width: 720px; margin: 0 auto; padding: 40px 32px; background: #fff; }
  header { border-bottom: 3px solid #e8916f; padding-bottom: 16px; margin-bottom: 24px; }
  header h1 { font-size: 22px; margin: 0 0 4px; color: #a14e2f; }
  header p { margin: 0; font-size: 13px; color: #7a6a5c; }
  h2 { font-size: 15px; color: #a14e2f; margin: 24px 0 8px; text-transform: uppercase;
       letter-spacing: 0.05em; }
  table { border-collapse: collapse; width: 100%; font-size: 14px; }
  th, td { text-align: left; padding: 7px 10px; border-bottom: 1px solid #efe6dc; vertical-align: top; }
  th { width: 46%; font-weight: 600; color: #6b5646; }
  ul { margin: 6px 0; padding-left: 20px; font-size: 14px; }
  p { font-size: 14px; line-height: 1.55; }
  .headline { font-size: 17px; font-weight: 700; margin: 4px 0 14px; }
  .match { background: #fdf3ec; border: 1px solid #f0d5c2; border-radius: 8px;
           padding: 14px 16px; margin: 18px 0; }
  .match h2 { margin-top: 0; }
  .note { font-size: 12.5px; color: #7a6a5c; }
  .disclaimer { margin-top: 28px; padding: 14px 16px; background: #f3f7f3;
                border: 1px solid #d7e5d7; border-radius: 8px; font-size: 12.5px;
                color: #4c5b4c; line-height: 1.55; }
  footer { margin-top: 24px; font-size: 11.5px; color: #a09383; }
  hr.scan-sep { border: none; border-top: 2px dashed #e6d8ca; margin: 28px 0; }
  @media print { body { background: #fff; } .page { padding: 8px 0; } }
</style>
</head>
<body>
<div class="page">
  <header>
    <h1>SenseMyPet — Behavioural Screening Report</h1>
    <p>AI-assisted on-device screening summary, prepared for veterinary review.</p>
  </header>

  ${sectionsHtml}

  <div class="disclaimer">
    <strong>Important:</strong> ${esc(AI_REFERENCE_DISCLAIMER)}
    Severity and observation confidence are separate values: severity estimates concern
    from observed signs; confidence estimates whether the sensors had sufficient evidence.
    No audio or video was recorded or transmitted — analysis ran entirely on the owner's device.
  </div>

  <footer>Generated by SenseMyPet (sensemypet.com) · on-device analysis · no media retained</footer>
</div>
</body>
</html>`;
}

/** Build a standalone printable HTML report for one scan. */
export function buildScanReportHTML(d: ScanReportData): string {
  const speciesName = d.species === 'dog' ? 'Dog' : 'Cat';
  return wrapReportDocument(
    `SenseMyPet screening report — ${speciesName}, ${fmtDate(d.createdAt)}`,
    renderScanSection(d),
  );
}

/** Build one combined document for several scans (Vet+ pre-consultation bundle). */
export function buildCombinedReportHTML(items: ScanReportData[]): string {
  const sections = items.map(renderScanSection).join('<hr class="scan-sep">');
  return wrapReportDocument(
    `SenseMyPet screening reports — ${items.length} scan${items.length === 1 ? '' : 's'}`,
    sections,
  );
}

/** Short plain-text summary for Web Share / clipboard. */
export function buildScanReportText(d: ScanReportData): string {
  const subject = d.petName
    ? `${d.petName} (${d.species === 'dog' ? 'Dog' : 'Cat'})`
    : (d.species === 'dog' ? 'Dog' : 'Cat');
  const lines = [
    `SenseMyPet screening report — ${subject}, ${fmtDate(d.createdAt)}`,
    d.preparedBy ? `Prepared by: ${d.preparedBy}` : '',
    d.headline,
    typeof d.severity === 'number' ? `Stress Signal Index: ${d.severity}/100` : '',
    typeof d.observationConfidence === 'number' ? `Observation confidence: ${d.observationConfidence}/100` : '',
    d.indicators?.length ? `Observed: ${d.indicators.join(', ')}` : '',
    d.conditionGroups?.length ? `Possible condition groups (non-diagnostic): ${d.conditionGroups.join('; ')}` : '',
    d.conditionMatchName
      ? `Closest reference match: ${d.conditionMatchName} (${d.conditionMatchPercent}%). ${VET_FOLLOWUP_COPY}`
      : '',
    AI_REFERENCE_DISCLAIMER,
  ];
  return lines.filter(Boolean).join('\n');
}

function triggerDownload(html: string, filename: string): void {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Trigger a browser download of the HTML report (open → print → save as PDF). */
export function downloadScanReport(d: ScanReportData): void {
  triggerDownload(
    buildScanReportHTML(d),
    `sensemypet-report-${d.species}-${d.createdAt.slice(0, 10)}.html`,
  );
}

/** Download one combined document for several selected scans. */
export function downloadScanReports(items: ScanReportData[]): void {
  if (items.length === 0) return;
  if (items.length === 1) return downloadScanReport(items[0]);
  const stamp = items[0].createdAt.slice(0, 10);
  triggerDownload(
    buildCombinedReportHTML(items),
    `sensemypet-reports-${items.length}-scans-${stamp}.html`,
  );
}

/**
 * Share via the Web Share API when available; falls back to copying the text
 * summary to the clipboard. Returns how it was delivered so UI can confirm.
 */
export async function shareScanReport(d: ScanReportData): Promise<'shared' | 'copied' | 'unavailable'> {
  return shareText(buildScanReportText(d));
}

/** Share several scans as one text summary. */
export async function shareScanReports(items: ScanReportData[]): Promise<'shared' | 'copied' | 'unavailable'> {
  return shareText(items.map(buildScanReportText).join('\n\n———\n\n'));
}

async function shareText(text: string): Promise<'shared' | 'copied' | 'unavailable'> {
  const nav = navigator as Navigator & { share?: (data: { title: string; text: string }) => Promise<void> };
  if (typeof nav.share === 'function') {
    try {
      await nav.share({ title: 'SenseMyPet screening report', text });
      return 'shared';
    } catch {
      // User cancelled or share failed → try clipboard below.
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'unavailable';
  }
}
