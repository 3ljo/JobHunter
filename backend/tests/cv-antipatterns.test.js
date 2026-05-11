// Anti-pattern regression test for the CV analyzer pipeline.
//
// This is a pure-logic test — no AI calls. It exercises the evidence-binding
// enforcement (LAW 2) and the structural guards that protect the pipeline
// from regressing to fabrication / forced-bridge / JD-paste outputs.
//
// Run with: `node backend/tests/cv-antipatterns.test.js`
// Exit code 0 = pass; non-zero = fail (suitable for CI).

const assert = require('node:assert/strict');

// We need access to enforceEvidenceBinding. It isn't exported in production
// because nothing outside the analyzer calls it — but for this test we
// re-require the module and rely on its existence. If you refactor, expose
// `enforceEvidenceBinding` via `module.exports` and update this require.
const path = require('node:path');
const analyzerPath = path.join(__dirname, '..', 'src', 'services', 'cvAnalyzerService.js');

// Re-require the source so we can inspect the prompt strings as text and
// run the binding logic. enforceEvidenceBinding is internal — we test it
// by behaviour through the source text + a minimal eval harness.
const fs = require('node:fs');
const src = fs.readFileSync(analyzerPath, 'utf-8');

// Build a sandboxed copy of just the helper for unit-testing. We extract
// the function definition by name. If the function is renamed or restructured
// this test will fail with a clear message — which is the desired behaviour.
const fnMatch = src.match(/const enforceEvidenceBinding = \(([^)]*)\) => \{[\s\S]*?^\};/m);
assert.ok(fnMatch, 'enforceEvidenceBinding helper not found in cvAnalyzerService.js');
// eslint-disable-next-line no-new-func
const enforceEvidenceBinding = new Function(
  'MIN_SKILLS', 'MAX_SKILLS',
  `${fnMatch[0]}\nreturn enforceEvidenceBinding;`
)(10, 22);

let passed = 0;
let failed = 0;
const test = (name, fn) => {
  try {
    fn();
    console.log(`  PASS  ${name}`);
    passed++;
  } catch (err) {
    console.error(`  FAIL  ${name}`);
    console.error(`        ${err.message}`);
    failed++;
  }
};

console.log('\nROCKSTAR-CV regression — evidence binding (LAW 2)\n');

test('drops a skill that has no anchor in the rewritten CV body', () => {
  const result = enforceEvidenceBinding(
    [{ skill: 'SAP HCM', evidence_anchor: 'I learned SAP HCM in a workshop' }],
    [], // source skills — empty, so no auto-trust
    [{ title: 'Frontend Developer', company: 'Acme', bullets: ['Built React dashboards with TypeScript'] }],
    'Frontend Developer with 1 year experience',
    [],
    []
  );
  assert.equal(result.boundSkills.length, 0, 'SAP HCM should be dropped — nothing in the CV evidences it');
  assert.equal(result.droppedSkills.length, 1);
  assert.match(result.droppedSkills[0].reason, /Evidence Binding/i);
});

test('keeps a skill that the rewritten CV literally mentions', () => {
  const result = enforceEvidenceBinding(
    [{ skill: 'TypeScript', evidence_anchor: 'Built React dashboards with TypeScript' }],
    [],
    [{ title: 'Frontend Developer', company: 'Acme', bullets: ['Built React dashboards with TypeScript'] }],
    'Frontend Developer with 1 year experience',
    [],
    []
  );
  assert.ok(result.boundSkills.includes('TypeScript'));
  assert.equal(result.droppedSkills.length, 0);
});

test('auto-trusts skills carried over from the source CV', () => {
  const result = enforceEvidenceBinding(
    [{ skill: 'JavaScript', evidence_anchor: 'source_cv' }],
    ['JavaScript'], // source CV already lists it
    [{ title: 'Dev', company: 'X', bullets: ['Did some work'] }], // not mentioned in body
    '',
    [],
    []
  );
  assert.ok(result.boundSkills.includes('JavaScript'), 'source-CV skills must pass without body evidence');
  assert.equal(result.evidenceBindings[0].evidence, 'source_cv');
});

test('drops the exact v2 Mad-Libs pattern (NgRx with no evidence)', () => {
  const result = enforceEvidenceBinding(
    [
      { skill: 'NgRx', evidence_anchor: 'Adept at supporting enterprise IT applications with Angular state management via NgRx' },
      { skill: 'SAP HCM', evidence_anchor: 'application support' },
      { skill: 'ITSM', evidence_anchor: 'ticket handling' },
    ],
    [],
    [{ title: 'Frontend Developer', company: 'Acme', bullets: ['Built dashboards in React'] }],
    'Frontend Developer transitioning into IT support',
    [],
    []
  );
  // None of these are mentioned in the rewritten body — all must be dropped.
  assert.equal(result.boundSkills.length, 0, 'orphan keywords from forced bridges must all drop');
  assert.equal(result.droppedSkills.length, 3);
});

test('caps output at MAX_SKILLS', () => {
  const many = Array.from({ length: 40 }, (_, i) => `Skill${i}`);
  const result = enforceEvidenceBinding(
    many.map((s) => ({ skill: s, evidence_anchor: 'source_cv' })),
    many, // all auto-trusted
    [],
    '',
    [],
    []
  );
  assert.ok(result.boundSkills.length <= 22, `expected ≤ 22, got ${result.boundSkills.length}`);
});

test('deduplicates skills case-insensitively', () => {
  const result = enforceEvidenceBinding(
    [
      { skill: 'TypeScript', evidence_anchor: 'source_cv' },
      { skill: 'typescript', evidence_anchor: 'source_cv' },
      { skill: 'TYPESCRIPT', evidence_anchor: 'source_cv' },
    ],
    ['TypeScript'],
    [],
    '',
    [],
    []
  );
  assert.equal(result.boundSkills.length, 1);
});

console.log('\nROCKSTAR-CV regression — prompt invariants\n');

test('analyzer no longer contains the date-manipulation stage', () => {
  assert.doesNotMatch(src, /strategic CV date optimizer/i, 'date-optimizer system prompt must be deleted');
  assert.doesNotMatch(src, /runDateAdjustmentStage/, 'runDateAdjustmentStage function must be deleted');
  assert.doesNotMatch(src, /push the start date.*backward/i, 'backward-date instructions must be gone');
  assert.doesNotMatch(src, /avoid suspiciously round numbers/i, 'detection-evasion language must be gone');
});

test('rewrite prompt enforces the seven absolute laws', () => {
  assert.match(src, /LAW 1 — NO FABRICATION/);
  assert.match(src, /LAW 2 — EVIDENCE BINDING/);
  assert.match(src, /LAW 3 — NO JD COPY-PASTE/);
  assert.match(src, /LAW 4 — COHERENCE/);
  assert.match(src, /LAW 5 — DATE INTEGRITY/);
  assert.match(src, /LAW 6 — HONEST GAP DECLARATION/);
  assert.match(src, /LAW 7 — NUMBER HONESTY/);
});

test('rewrite prompt includes the v2 Mad-Libs anti-pattern example', () => {
  assert.match(
    src,
    /Adept at supporting enterprise IT applications with Angular state management via NgRx/,
    'the explicit anti-pattern specimen keeps the bad pattern from regressing silently'
  );
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
