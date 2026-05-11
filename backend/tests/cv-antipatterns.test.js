// Anti-pattern regression test for the CV analyzer pipeline.
//
// Pure-logic test — no AI calls. Exercises evidence-binding enforcement
// (LAW 2), summary coherence (LAW 4), and banned-fluff detection.
//
// Run: `node backend/tests/cv-antipatterns.test.js`
// Exit code 0 = pass; non-zero = fail (suitable for CI).

const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const analyzerPath = path.join(__dirname, '..', 'src', 'services', 'cvAnalyzerService.js');
const src = fs.readFileSync(analyzerPath, 'utf-8');

// Extract internal helpers for unit testing. Each helper is declared as
// `const name = (...) => { ... };` — we pull the source text and eval it
// in an isolated scope. If a helper is renamed/restructured the test
// will fail loudly with "helper not found" — which is the desired
// regression behaviour.
const extractFn = (re) => {
  const m = src.match(re);
  if (!m) throw new Error(`helper not found in cvAnalyzerService.js (pattern: ${re})`);
  return m[0];
};
const candidateAliasesSrc        = extractFn(/const candidateAliases = \([^)]*\) => \{[\s\S]*?\n\};/);
const enforceEvidenceBindingSrc  = extractFn(/const enforceEvidenceBinding = \([^)]*\) => \{[\s\S]*?^\};/m);
const detectIncoherentSrc        = extractFn(/const detectIncoherentSummarySentence = \([^)]*\) => \{[\s\S]*?\n\};/);
const sanitizeSummarySrc         = extractFn(/const sanitizeSummary = \([^)]*\) => \{[\s\S]*?\n\};/);
const findBannedFluffSrc         = extractFn(/const findBannedFluff = \([^)]*\) => \{[\s\S]*?\n\};/);
const collectFluffFlagsSrc       = extractFn(/const collectFluffFlags = \([^)]*\) => \{[\s\S]*?\n\};/);

// Constants the helpers close over.
const harness = `
const MIN_SKILLS = 10;
const MAX_SKILLS = 22;
const ENTERPRISE_DOMAIN_TERMS = /\\b(enterprise\\s+IT|IT\\s+support|application\\s+support|service\\s*now|servicenow|SAP(?:\\s+HCM)?|ITSM|ticketing|incident\\s+management|workday|HRIS|HRMS|personnel\\s+administration|payroll|helpdesk|help\\s+desk)\\b/i;
const FRONTEND_DEV_TERMS = /\\b(NgRx|Redux|RxJS|Vuex|Pinia|MobX|angular\\s+state\\s+management|angular\\s+routing|react\\s+hooks|vue\\s+composables|webpack|vite|sass|tailwind|jQuery)\\b/i;
const BANNED_FLUFF_PATTERNS = [
  { rx: /quickly adapted to (new|various|emerging|different)\\s+technolog/i, label: 'quickly adapted to new technologies' },
  { rx: /demonstrating (flexibility|adaptability|versatility|problem.?solving)/i, label: 'demonstrating [soft-skill]' },
  { rx: /strong (communication|analytical|interpersonal|problem.?solving|leadership)\\s+skills/i, label: 'strong [soft-skill] skills' },
  { rx: /passionate\\s+(about|professional)/i, label: 'passionate about/professional' },
  { rx: /\\bresults.?driven\\b/i, label: 'results-driven' },
  { rx: /\\bteam\\s+player\\b/i, label: 'team player' },
  { rx: /\\bproven\\s+track\\s+record\\b/i, label: 'proven track record' },
  { rx: /\\bdetail.?oriented\\b/i, label: 'detail-oriented' },
  { rx: /\\bhighly\\s+motivated\\b/i, label: 'highly motivated' },
  { rx: /\\bself.?starter\\b/i, label: 'self-starter' },
  { rx: /\\bgo.?getter\\b/i, label: 'go-getter' },
  { rx: /\\bthinking\\s+outside\\s+the\\s+box\\b/i, label: 'thinking outside the box' },
  { rx: /\\bsynergiz(e|ing)\\b/i, label: 'synergize' },
];
${candidateAliasesSrc}
${enforceEvidenceBindingSrc}
${detectIncoherentSrc}
${sanitizeSummarySrc}
${findBannedFluffSrc}
${collectFluffFlagsSrc}
return {
  candidateAliases, enforceEvidenceBinding,
  detectIncoherentSummarySentence, sanitizeSummary,
  findBannedFluff, collectFluffFlags,
};
`;
// eslint-disable-next-line no-new-func
const helpers = new Function(harness)();
const {
  candidateAliases, enforceEvidenceBinding,
  detectIncoherentSummarySentence, sanitizeSummary,
  findBannedFluff, collectFluffFlags,
} = helpers;

let passed = 0, failed = 0;
const test = (name, fn) => {
  try { fn(); console.log(`  PASS  ${name}`); passed++; }
  catch (err) { console.error(`  FAIL  ${name}\n        ${err.message}`); failed++; }
};

console.log('\n── Evidence binding (LAW 2) — per-entry phrase match ──\n');

test('drops a skill with no anchor anywhere in the CV body', () => {
  const r = enforceEvidenceBinding(
    [{ skill: 'SAP HCM', evidence_anchor: 'I learned SAP HCM in a workshop' }],
    [],
    [{ title: 'Frontend Developer', company: 'Acme', bullets: ['Built React dashboards with TypeScript'] }],
    'Frontend Developer with 1 year experience',
    [], []
  );
  assert.equal(r.boundSkills.length, 0);
  assert.equal(r.droppedSkills.length, 1);
});

test('keeps a skill the rewritten CV literally mentions in a bullet', () => {
  const r = enforceEvidenceBinding(
    [{ skill: 'TypeScript', evidence_anchor: 'Built React dashboards with TypeScript' }],
    [],
    [{ title: 'Frontend Developer', company: 'Acme', bullets: ['Built React dashboards with TypeScript'] }],
    '',
    [], []
  );
  assert.ok(r.boundSkills.includes('TypeScript'));
});

test('auto-trusts skills carried over from the source CV', () => {
  const r = enforceEvidenceBinding(
    [{ skill: 'JavaScript', evidence_anchor: 'source_cv' }],
    ['JavaScript'],
    [{ title: 'Dev', company: 'X', bullets: ['Did some work'] }],
    '', [], []
  );
  assert.ok(r.boundSkills.includes('JavaScript'));
});

test('drops "Application support" when no bullet describes that work (was a v2 false-positive)', () => {
  // v1 bug: "Application support" passed because some bullet contained "support".
  // The fix: per-ENTRY phrase match, not token-scattered across the haystack.
  const r = enforceEvidenceBinding(
    [
      { skill: 'Application support', evidence_anchor: 'supporting enterprise IT applications' },
      { skill: 'System administration', evidence_anchor: 'system administration' },
      { skill: 'Ticket handling', evidence_anchor: 'ticket handling' },
    ],
    [],
    [
      { title: 'Frontend Developer', company: 'Acme', bullets: [
        'Built dashboards in React',
        'Supported the product team during launch sprints',
      ] },
    ],
    '', [], []
  );
  assert.equal(r.boundSkills.length, 0, 'no bullet evidences any of these — all must drop');
});

test('handles parenthesized aliases: "Cloud Platforms (Azure)" is bound by an Azure bullet (was a v2 false-positive)', () => {
  const r = enforceEvidenceBinding(
    [{ skill: 'Cloud Platforms (Azure)', evidence_anchor: 'Implemented Azure cloud solutions' }],
    [],
    [{ title: 'Engineer', company: 'WhiteDesk', bullets: [
      'Implemented Azure cloud solutions for deploying and scaling web applications, increasing uptime by 15%.',
    ] }],
    '', [], []
  );
  assert.ok(r.boundSkills.includes('Cloud Platforms (Azure)'),
    `expected Cloud Platforms (Azure) bound, got dropped: ${JSON.stringify(r.droppedSkills)}`);
});

test('handles slash-separated aliases: "GitHub/Git" matches a Git bullet', () => {
  const r = enforceEvidenceBinding(
    [{ skill: 'GitHub/Git', evidence_anchor: 'used Git for version control' }],
    [],
    [{ title: 'Dev', company: 'X', bullets: ['Used Git for version control across 4 repos'] }],
    '', [], []
  );
  assert.ok(r.boundSkills.includes('GitHub/Git'));
});

test('does NOT validate skills using only the summary as evidence (stuffing self-validation)', () => {
  // The summary is downstream of skills selection — trusting it would let a
  // stuffed summary self-validate stuffed skills. Only bullets/certs/edu count.
  const r = enforceEvidenceBinding(
    [{ skill: 'SAP HCM', evidence_anchor: 'Skilled in SAP HCM' }],
    [],
    [{ title: 'Dev', company: 'X', bullets: ['Wrote unit tests'] }],
    'Skilled in SAP HCM and Personnel Administration', // SUMMARY contains it
    [], []
  );
  assert.equal(r.boundSkills.length, 0, 'summary-only evidence must NOT validate a skill');
});

test('caps output at MAX_SKILLS', () => {
  const many = Array.from({ length: 40 }, (_, i) => ({ skill: `Skill${i}`, evidence_anchor: 'source_cv' }));
  const r = enforceEvidenceBinding(many, many.map((s) => s.skill), [], '', [], []);
  assert.ok(r.boundSkills.length <= 22);
});

test('deduplicates skills case-insensitively', () => {
  const r = enforceEvidenceBinding(
    [
      { skill: 'TypeScript', evidence_anchor: 'source_cv' },
      { skill: 'typescript', evidence_anchor: 'source_cv' },
      { skill: 'TYPESCRIPT', evidence_anchor: 'source_cv' },
    ],
    ['TypeScript'],
    [], '', [], []
  );
  assert.equal(r.boundSkills.length, 1);
});

console.log('\n── Summary coherence (LAW 4) — Mad-Libs detection ──\n');

test('detects the v2 NgRx + IT-support Mad-Libs (was a v2 SHIPPED regression)', () => {
  const summary = 'Frontend Developer with 1+ year of experience. Skilled in supporting enterprise IT applications with Angular state management via NgRx.';
  const r = sanitizeSummary(summary, { target_job_title: 'SAP HCM Analyst', required_hard_skills: ['SAP HCM'] });
  assert.ok(r.flagged, 'must flag the Mad-Libs sentence');
  assert.match(r.flagged.removed_sentence, /enterprise IT applications.*NgRx/);
  assert.doesNotMatch(r.summary, /NgRx/i, 'sanitized summary must not contain NgRx');
});

test('still detects the original v1 phrasing ("Adept at...")', () => {
  const summary = 'Adept at supporting enterprise IT applications with Angular state management via NgRx.';
  const r = sanitizeSummary(summary, { target_job_title: 'IT Support Specialist' });
  assert.ok(r.flagged);
});

test('detects ANY enterprise+frontend combo regardless of verb', () => {
  // Variants the model might invent to dodge the literal pattern.
  const variants = [
    'Experienced in SAP HCM support using NgRx state management.',
    'Proficient at ITSM ticketing with React hooks.',
    'Comfortable supporting ServiceNow workflows via Redux.',
  ];
  for (const v of variants) {
    const r = sanitizeSummary(v, { target_job_title: 'Enterprise IT' });
    assert.ok(r.flagged, `should flag: "${v}"`);
  }
});

test('does NOT flag a coherent summary', () => {
  const summary = 'Frontend Developer with 2 years of experience building React applications and design systems. Transitioning into enterprise IT support with foundational coursework in SAP HCM and ITSM workflows.';
  const r = sanitizeSummary(summary, { target_job_title: 'SAP Analyst' });
  assert.equal(r.flagged, null, 'a coherent transition statement should not be flagged');
});

test('does NOT flag frontend tech in a frontend role summary', () => {
  const summary = 'Frontend Engineer skilled in React, Redux, and NgRx for building large-scale SPAs.';
  const r = sanitizeSummary(summary, { target_job_title: 'Senior Frontend Engineer' });
  assert.equal(r.flagged, null, 'frontend tech in a frontend role is coherent');
});

console.log('\n── Banned fluff detection ──\n');

test('catches "Quickly adapted to new technologies, demonstrating flexibility..." (v2 SHIPPED regression)', () => {
  const hits = findBannedFluff('Quickly adapted to new technologies, demonstrating flexibility and problem-solving skills throughout the internship.');
  assert.ok(hits.length >= 1, 'must hit both "quickly adapted" and "demonstrating flexibility"');
  const labels = hits.map((h) => h.label);
  assert.ok(labels.some((l) => /quickly adapted/i.test(l)));
});

test('catches the most common fluff offenders', () => {
  for (const t of [
    'Results-driven professional with a proven track record.',
    'Highly motivated team player and self-starter.',
    'Strong analytical skills.',
    'Passionate about thinking outside the box.',
  ]) {
    const hits = findBannedFluff(t);
    assert.ok(hits.length > 0, `should catch fluff in: "${t}"`);
  }
});

test('does NOT flag legitimate accomplishment phrasing', () => {
  const ok = [
    'Reduced p95 latency from 1.2s to 340ms across 3M daily requests.',
    'Onboarded 14 new engineers in 6 months.',
  ];
  for (const t of ok) assert.equal(findBannedFluff(t).length, 0, `false positive on: "${t}"`);
});

test('collectFluffFlags walks summary + every bullet and reports location', () => {
  const finalCV = {
    summary: 'Results-driven developer.',
    experience: [
      { title: 'Dev', company: 'X', bullets: [
        'Built feature A.',
        'Quickly adapted to new technologies, demonstrating flexibility.',
      ] },
    ],
  };
  const flags = collectFluffFlags(finalCV);
  assert.ok(flags.some((f) => f.location === 'summary'));
  assert.ok(flags.some((f) => /Dev @ X/.test(f.location)));
});

console.log('\n── Prompt invariants ──\n');

test('analyzer no longer contains the date-manipulation stage', () => {
  assert.doesNotMatch(src, /strategic CV date optimizer/i);
  assert.doesNotMatch(src, /runDateAdjustmentStage/);
  assert.doesNotMatch(src, /push the start date.*backward/i);
  assert.doesNotMatch(src, /avoid suspiciously round numbers/i);
});

test('rewrite prompt enforces the seven absolute laws', () => {
  for (const l of [
    /LAW 1 — NO FABRICATION/, /LAW 2 — EVIDENCE BINDING/, /LAW 3 — NO JD COPY-PASTE/,
    /LAW 4 — COHERENCE/, /LAW 5 — DATE INTEGRITY/, /LAW 6 — HONEST GAP DECLARATION/,
    /LAW 7 — NUMBER HONESTY/,
  ]) assert.match(src, l);
});

test('rewrite prompt includes the v2 Mad-Libs anti-pattern specimen', () => {
  assert.match(src, /Adept at supporting enterprise IT applications with Angular state management via NgRx/);
});

test('rewrite prompt includes a concrete bullet-reframing example', () => {
  assert.match(src, /REFRAME EXAMPLE/);
  assert.match(src, /Monitored data quality across 100\+ integrated/);
});

test('rewrite prompt makes bullet rewriting mandatory (not optional)', () => {
  assert.match(src, /BULLET REFRAMING IS MANDATORY/);
  assert.match(src, /Returning bullets unchanged is a failure/);
});

test('rewrite prompt lists explicit banned-fluff phrases', () => {
  for (const ban of [
    /Quickly adapted to new\/various\/emerging technologies, demonstrating flexibility/i,
    /Strong communication \/ analytical \/ problem-solving skills/i,
    /results-driven/i,
    /team player/i,
  ]) assert.match(src, ban);
});

test('audit prompt emits gap_declarations / verify_flags / keyword_mapping_decisions', () => {
  assert.match(src, /"gap_declarations":\s*\[/);
  assert.match(src, /"verify_flags":\s*\[/);
  assert.match(src, /"keyword_mapping_decisions":\s*\[/);
});

test('rewrite prompt emits skills_with_evidence (not bare skills array)', () => {
  assert.match(src, /"skills_with_evidence":\s*\[/);
});

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
