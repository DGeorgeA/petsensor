/**
 * src/lib/__tests__/conditionMatchHarness.ts
 *
 * Condition naming + reference matching + report content invariants:
 *   - cosine geometry sanity
 *   - 60% floor: below → null (never force a condition)
 *   - species isolation (dog audio never named after a cat reference)
 *   - manifest condition names win; category fallback otherwise
 *   - every bundled signature key has a cautious condition name
 *   - visual cue → spec §11 group mapping (dedup, unknown-safe)
 *   - report HTML/text carry the disclaimer + vet-followup language and
 *     escape user-visible strings
 *
 * Run:  npx tsx src/lib/__tests__/conditionMatchHarness.ts
 */

import {
  cosineSimilarity,
  matchAgainstReferences,
  REFERENCE_MATCH_THRESHOLD,
} from '../referenceMatch';
import type { ReferenceFixture } from '../referenceLoader';
import {
  conditionGroupsForCues,
  fallbackConditionName,
  AUDIO_CONDITION_INFO,
  CONDITION_GROUP_LABELS,
  VET_FOLLOWUP_COPY,
  AI_REFERENCE_DISCLAIMER,
} from '../conditionGroups';
import { LIBRARY_BY_ANIMAL } from '../petEmotionLibrary';
import { buildScanReportHTML, buildScanReportText, buildCombinedReportHTML, type ScanReportData } from '../scanReport';

let pass = 0, fail = 0;
function check(name: string, cond: boolean, detail = '') {
  if (cond) { pass++; console.log(`  [PASS] ${name.padEnd(62)} ${detail}`); }
  else { fail++; console.log(`  [FAIL] ${name.padEnd(62)} ${detail}`); }
}

function unit(dim: number, at: number): Float32Array {
  const v = new Float32Array(dim);
  v[at] = 1;
  return v;
}

function fixture(
  species: 'dog' | 'cat', embedding: Float32Array,
  condition?: string, category: ReferenceFixture['category'] = 'possible_stress',
): ReferenceFixture {
  return { species, category, condition, embedding, path: `${species}s/test/${condition ?? 'x'}.wav` };
}

console.log('\n=== SenseMyPet — Condition Match + Report Harness ===\n');

// ── 1. Cosine geometry ─────────────────────────────────────────────────────────
const a = unit(8, 0), b = unit(8, 1);
check('cosine(identical) = 1', Math.abs(cosineSimilarity(a, a) - 1) < 1e-6);
check('cosine(orthogonal) = 0', Math.abs(cosineSimilarity(a, b)) < 1e-6);
check('cosine(zero vector) = 0 (no NaN)', cosineSimilarity(new Float32Array(8), a) === 0);

// ── 2. Threshold gating (60–100% rule) ─────────────────────────────────────────
check('threshold is exactly 60%', REFERENCE_MATCH_THRESHOLD === 0.6);

const refA = fixture('dog', unit(8, 0), 'Separation-distress-type whining pattern');
const self = matchAgainstReferences(unit(8, 0), 'dog', [refA]);
check('perfect self-match → 100%', self?.matchPercent === 100, String(self?.matchPercent));
check('self-match carries the manifest condition name',
  self?.conditionName === 'Separation-distress-type whining pattern', self?.conditionName ?? 'null');

// 59% similarity vector: cos = 0.59 → below floor → null.
const dim = 8;
const v59 = new Float32Array(dim);
v59[0] = 0.59; v59[1] = Math.sqrt(1 - 0.59 * 0.59);
check('similarity just below 60% → NO condition is named',
  matchAgainstReferences(v59, 'dog', [refA]) === null);

// 65% similarity → named with rounded percent.
const v65 = new Float32Array(dim);
v65[0] = 0.65; v65[1] = Math.sqrt(1 - 0.65 * 0.65);
const m65 = matchAgainstReferences(v65, 'dog', [refA]);
check('65% similarity → named at 65%', m65?.matchPercent === 65, String(m65?.matchPercent));

// ── 3. Species isolation ───────────────────────────────────────────────────────
const catRef = fixture('cat', unit(8, 0), 'Distress-type repeated meowing pattern');
check('dog embedding never matches cat references',
  matchAgainstReferences(unit(8, 0), 'dog', [catRef]) === null);

// ── 4. Fallback naming ─────────────────────────────────────────────────────────
const noName = fixture('dog', unit(8, 0), undefined, 'possible_anxiety');
const fb = matchAgainstReferences(unit(8, 0), 'dog', [noName]);
check('fixture without condition falls back to category name',
  fb?.conditionName === fallbackConditionName('dog', 'possible_anxiety'), fb?.conditionName ?? 'null');
check('fallback names are cautious ("pattern", never "diagnosis")',
  fallbackConditionName('cat', 'possible_stress').includes('pattern'));

// ── 5. Bundled signature coverage ──────────────────────────────────────────────
const allKeys = [...LIBRARY_BY_ANIMAL.dog, ...LIBRARY_BY_ANIMAL.cat].map((s) => s.key);
const missing = allKeys.filter((k) => !AUDIO_CONDITION_INFO[k]);
check('every bundled signature key has a condition name', missing.length === 0, missing.join(','));

// ── 6. Visual cue → condition group mapping ────────────────────────────────────
check('pacing maps to stress/anxiety group',
  conditionGroupsForCues(['pacing_restless']).includes(CONDITION_GROUP_LABELS.stress_anxiety));
const crouch = conditionGroupsForCues(['sustained_crouch']);
check('sustained crouch maps to BOTH stress and pain groups (spec §3)',
  crouch.includes(CONDITION_GROUP_LABELS.stress_anxiety) && crouch.includes(CONDITION_GROUP_LABELS.pain_discomfort));
const dedup = conditionGroupsForCues(['pacing_restless', 'agitated_movement', 'sustained_crouch']);
check('groups are deduped', new Set(dedup).size === dedup.length && dedup.length === 2);
check('unknown cues are ignored safely', conditionGroupsForCues(['no_such_cue']).length === 0);
check('calm scan yields no condition groups', conditionGroupsForCues([]).length === 0);

// ── 7. Report content invariants ───────────────────────────────────────────────
const report: ScanReportData = {
  species: 'dog',
  createdAt: '2026-07-07T10:00:00Z',
  screeningClass: 'POSSIBLE_ANXIETY',
  headline: 'Possible anxiety-related signals observed',
  label: '<script>alert(1)</script>',
  severity: 68,
  observationConfidence: 74,
  modality: 'multimodal',
  scanMode: 'both',
  indicators: ['repeated pacing'],
  explanations: ['environmental stress'],
  recommendedAction: 'routine_vet',
  conditionGroups: [CONDITION_GROUP_LABELS.stress_anxiety],
  conditionMatchName: 'Anxiety-type repetitive barking pattern',
  conditionMatchPercent: 78,
};
const html = buildScanReportHTML(report);
check('report embeds the AI-reference disclaimer', html.includes('AI-based screening reference only'));
check('report embeds the vet-followup guidance', html.includes('consult your local veterinarian'));
check('report keeps severity and confidence as separate rows',
  html.includes('68 / 100') && html.includes('74 / 100'));
check('report names the matched condition with percent',
  html.includes('Anxiety-type repetitive barking pattern') && html.includes('78%'));
check('report escapes HTML in user-visible strings',
  !html.includes('<script>alert(1)</script>') && html.includes('&lt;script&gt;'));

const text = buildScanReportText(report);
check('text summary includes vet-followup + disclaimer',
  text.includes(VET_FOLLOWUP_COPY) && text.includes(AI_REFERENCE_DISCLAIMER));

const combined = buildCombinedReportHTML([report, { ...report, createdAt: '2026-07-06T10:00:00Z' }]);
check('combined report contains both scans', (combined.match(/Possible anxiety-related signals observed/g) ?? []).length === 2);

// ── 8. Personalisation (sign-in vs guest mode) ─────────────────────────────────
const personal = { ...report, petName: 'Luna', preparedBy: 'owner@example.com' };
const pHtml = buildScanReportHTML(personal);
check('personalised report shows pet name', pHtml.includes('Pet name') && pHtml.includes('Luna'));
check('personalised report shows prepared-by owner',
  pHtml.includes('Prepared by (owner)') && pHtml.includes('owner@example.com'));
const pText = buildScanReportText(personal);
check('personalised text summary leads with the pet name', pText.includes('Luna (Dog)'));

const guestHtml = buildScanReportHTML(report); // no petName/preparedBy
check('guest-mode report stays anonymous',
  !guestHtml.includes('Prepared by (owner)') && !guestHtml.includes('Pet name'));

console.log(`\n=== ${pass} passed, ${fail} failed ===`);
if (fail > 0) process.exitCode = 1;
