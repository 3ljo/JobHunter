// Live pipeline inspector — runs the full analyze pipeline against a local
// CV + JD pair and dumps the JSON result.
//
// Usage:
//   node backend/scripts/inspect-cv-pipeline.js <cv.pdf|cv.txt> <jd.txt> [output.json]
//
// Requires the same .env the backend uses (AI_PROVIDER + the matching API
// key). Useful for verifying the new audit fields land populated and that
// the evidence-binding / summary-sanitization / fluff-flag post-process
// is firing on real model output.

const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { parsePDF } = require('../src/services/cvParserService');
const { analyzeCVWithJD } = require('../src/services/cvAnalyzerService');

const loadCV = async (cvPath) => {
  if (cvPath.toLowerCase().endsWith('.pdf')) return parsePDF(cvPath);
  return fs.readFileSync(cvPath, 'utf-8');
};

const summarize = (result) => {
  const r = result || {};
  const skills = r?.final?.final_cv?.skills || [];
  const dropped = r?.rewrite?.skills_dropped_no_evidence || [];
  const evidence = r?.rewrite?.evidence_bindings || [];
  const gaps = r?.audit?.gap_declarations || [];
  const verifyFlags = r?.audit?.verify_flags || [];
  const decisions = r?.audit?.keyword_mapping_decisions || [];
  const summary = r?.final?.final_cv?.summary || '';
  const sanitization = r?.rewrite?.summary_sanitization;

  console.error('\n─── PIPELINE SUMMARY ───');
  console.error(`scores: ${JSON.stringify(r.scores)}`);
  console.error(`final summary (${summary.length} chars):`);
  console.error(`  ${summary}`);
  if (sanitization) {
    console.error(`summary sanitization fired:`);
    console.error(`  removed: "${sanitization.removed_sentence}"`);
    console.error(`  reason:  ${sanitization.reason}`);
  }
  console.error(`final skills (${skills.length}): ${JSON.stringify(skills)}`);
  console.error(`evidence bindings:`);
  for (const e of evidence) console.error(`  - ${e.skill}  ←  ${e.evidence}`);
  console.error(`dropped (no evidence):`);
  for (const d of dropped) console.error(`  - ${d.skill}  (${d.reason})`);
  console.error(`gap_declarations (${gaps.length}):`);
  for (const g of gaps) console.error(`  - ${g.required_skill}: ${g.why_critical} → ${g.mitigation}`);
  console.error(`verify_flags (${verifyFlags.length}):`);
  for (const v of verifyFlags) console.error(`  - [${v.location}] ${v.flag}: ${v.content}`);
  console.error(`keyword_mapping_decisions (${decisions.length}):`);
  for (const d of decisions) console.error(`  - ${d.jd_keyword} → ${d.decision} (${d.evidence})`);
  console.error('─────────────────────────\n');
};

(async () => {
  const cvPath = process.argv[2];
  const jdPath = process.argv[3];
  const outPath = process.argv[4] || null;
  if (!cvPath || !jdPath) {
    console.error('Usage: node inspect-cv-pipeline.js <cv.pdf|cv.txt> <jd.txt> [output.json]');
    process.exit(1);
  }

  console.error(`loading CV from ${cvPath}`);
  const cvText = await loadCV(cvPath);
  console.error(`loading JD from ${jdPath}`);
  const jdText = fs.readFileSync(jdPath, 'utf-8');

  console.error('running pipeline...');
  const t0 = Date.now();
  const result = await analyzeCVWithJD(
    cvText,
    jdText,
    { userId: 'inspect', userEmail: 'inspect@local' }
  );
  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  console.error(`done in ${dt}s`);

  summarize(result);

  const json = JSON.stringify(result, null, 2);
  if (outPath) {
    fs.writeFileSync(outPath, json);
    console.error(`wrote full JSON to ${outPath}`);
  } else {
    process.stdout.write(json);
  }
})().catch((e) => {
  console.error('FAILED:', e?.message || e);
  if (e?.stack) console.error(e.stack);
  process.exit(1);
});
