// CV Analyzer Service
// Multi-stage AI pipeline for CV analysis, ATS audit, rewrite, and humanization
// Supports Claude, ChatGPT, and Gemini — switch via AI_PROVIDER in .env

const { callAI, getCurrentProvider } = require('./aiClient');

// Helper to call AI and parse JSON response
const callProvider = async (systemPrompt, userMessage, stageName, meta = {}) => {
  const text = await callAI(systemPrompt, userMessage, null, { ...meta, stage: stageName });

  try {
    return JSON.parse(text);
  } catch (err) {
    // Try to extract JSON from the response if wrapped in markdown
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch (innerErr) {
        throw new Error(`Stage "${stageName}" returned invalid JSON (provider: ${getCurrentProvider()})`);
      }
    }
    throw new Error(`Stage "${stageName}" returned invalid JSON (provider: ${getCurrentProvider()})`);
  }
};

// Skills bounds — kept as tunable constants instead of a magic 10–18 hard rule
// so we can A/B test cap sizes without changing prompt text. The rewrite
// prompt enforces these; the post-validation pass also clamps to MAX_SKILLS.
const MIN_SKILLS = 10;
const MAX_SKILLS = 22;

// Evidence-binding enforcement (LAW 2 — structural, not prompt-trust).
//
// Skills sourced from the parsed CV are auto-trusted (they're facts the user
// put on their own resume). Any skill the rewrite ADDED must carry an
// `evidence_anchor` that is a real substring of the rewritten CV body — a
// bullet, cert name, education degree/institution, or the summary. If the
// anchor isn't real, the skill is dropped. Prompt rules drift; this doesn't.
//
// Returns:
//   boundSkills:       string[] — flat skill names, safe for renderers
//   droppedSkills:     [{ skill, reason }] — surfaced in audit panel
//   evidenceBindings:  [{ skill, evidence }] — full mapping for UI
const enforceEvidenceBinding = (skillsRaw, sourceSkills, experience, summary, certifications, education) => {
  // Build the haystack — everything that counts as evidence in the rewritten CV.
  // Lowercased for case-insensitive substring checks.
  const haystackParts = [];
  if (typeof summary === 'string') haystackParts.push(summary);
  for (const exp of experience || []) {
    if (exp?.title) haystackParts.push(String(exp.title));
    if (exp?.company) haystackParts.push(String(exp.company));
    for (const b of Array.isArray(exp?.bullets) ? exp.bullets : []) {
      if (b) haystackParts.push(String(b));
    }
  }
  for (const c of certifications || []) {
    if (typeof c === 'string') haystackParts.push(c);
    else if (c?.name) haystackParts.push(String(c.name));
  }
  for (const e of education || []) {
    if (typeof e === 'string') haystackParts.push(e);
    else {
      if (e?.degree) haystackParts.push(String(e.degree));
      if (e?.institution) haystackParts.push(String(e.institution));
    }
  }
  const haystack = haystackParts.join(' \n ').toLowerCase();

  // Case- and whitespace-insensitive set of source-CV skills.
  const sourceSet = new Set(
    (sourceSkills || []).map((s) => String(s).trim().toLowerCase()).filter(Boolean)
  );

  const boundSkills = [];
  const droppedSkills = [];
  const evidenceBindings = [];
  const seen = new Set();

  for (const entry of skillsRaw || []) {
    if (boundSkills.length >= MAX_SKILLS) break;

    const skill = typeof entry === 'string' ? entry : (entry?.skill || '');
    const anchor = typeof entry === 'string' ? 'source_cv' : (entry?.evidence_anchor || '');
    const name = String(skill || '').trim();
    if (!name) continue;

    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    // Source-CV skills are auto-trusted (the user put them there themselves).
    if (sourceSet.has(key)) {
      boundSkills.push(name);
      evidenceBindings.push({ skill: name, evidence: 'source_cv' });
      continue;
    }

    // Newly added skills need a real anchor. Accept either:
    //   - the model's quoted anchor string appears in the CV body, OR
    //   - the skill name itself appears in the CV body (semantic safety net
    //     for cases where the model's anchor was paraphrased).
    const anchorLc = String(anchor || '').trim().toLowerCase();
    const nameAppears = haystack.includes(key);
    const anchorAppears = anchorLc && anchorLc !== 'source_cv' && haystack.includes(anchorLc);

    if (nameAppears || anchorAppears) {
      boundSkills.push(name);
      evidenceBindings.push({
        skill: name,
        evidence: anchorAppears ? anchor : `mentioned in rewritten CV: "${name}"`,
      });
    } else {
      droppedSkills.push({
        skill: name,
        reason: 'No evidence anchor in rewritten CV (LAW 2 — Evidence Binding)',
      });
    }
  }

  return { boundSkills, droppedSkills, evidenceBindings };
};

// Stage 1a — Parse the CV + extract JD fingerprint. Small, fast call.
// Pulled out of the old "Parse + Audit" merged stage so the audit and the
// rewrite can run in parallel (rewrite needs only the parsed data).
const runParseStage = (cvText, jobDescription, m) => callProvider(
  `You operate with FOUR expert lenses simultaneously:
  1. ATS Engineer — 10+ years building parsers for Workday, Greenhouse, Lever, Taleo, iCIMS, SmartRecruiters, Jobvite, BambooHR, Bullhorn, ADP.
  2. Senior Technical Recruiter — 15+ years screening 50,000+ resumes across FAANG, scale-ups, Fortune 500.
  3. Hiring Manager — has personally hired across engineering, product, design, marketing, sales, ops, exec.
  4. Career Strategist — coaches career-switchers through C-suite candidates.

Your job in this stage: extract clean, structured data from a CV and decode the job description like a senior recruiter who already knows what the hiring manager actually wants — not what HR wrote.

Key truths you apply:
- Recruiters scan resumes in ~7 seconds; ATS filters ~75% before a human sees them.
- Job descriptions are written by HR and contain marketing language. The REAL day-to-day is usually narrower and more specific. Decode it.
- ATS scoring: hard-skill keyword match accounts for ~35% of ranking weight. Soft skills add near-zero ATS value.
- Optimal keyword match rate is 65–75%. Over 75% is keyword stuffing and gets penalized by modern semantic ATS (Workday/Greenhouse/Lever added AI semantic matching in 2024–2025).
- Recruiters search ATS databases with Boolean strings using EXACT phrasing from the JD. Identify those exact phrases.

Output strict JSON only — no markdown, no prose. Truth first: never invent skills, dates, employers, or credentials.`,
  `Parse the CV and decode the job description.

CV TEXT:
${cvText}

JOB DESCRIPTION:
${jobDescription}

Rules for parsing the CV:
- Preserve ALL certifications and education entries — never drop a factual credential.
- If an entry has a URL (certificate link, institution website, course page), capture it in the "url" field.
- Capture city and country if present next to the institution. Dropping URLs or locations is a critical failure.
- Languages: every entry MUST have BOTH a "name" (e.g., "English", "Italian") AND a "level" (e.g., "B2", "Native", "Fluent"). NEVER output just a level with no name. If the CV lists "English B2" and "Italian B1", output [{"name":"English","level":"B2"},{"name":"Italian","level":"B1"}] — not ["B2","B1"].

Rules for the JD fingerprint:
- "required_hard_skills" / "preferred_hard_skills": use the EMPLOYER'S EXACT PHRASING. If the JD says "TypeScript", do not write "JS/TS". If the JD says "stakeholder management", do not write "managed stakeholders". Acronyms — include both forms when the JD does (e.g., "Search Engine Optimization (SEO)").
- "top_20_keywords_ranked": the 20 terms a recruiter would Boolean-search for, ranked by likely ATS weight (frequency in JD + position + emphasis like "must have", "required").
- "real_job_summary": 2 sentences describing the actual day-to-day reality, stripped of marketing language.
- "unstated_requirements": things implied by team structure, company stage, tone — e.g., "early-stage startup signals scrappiness and ownership", "uses 'fast-paced' 3x signals heavy load".
- "likely_deal_breakers": specific skills/credentials that, if absent, will almost certainly cause auto-rejection.
- "hiring_manager_top_concerns": the 3 concerns a hiring manager would have about an average candidate for this role (e.g., "can they scale beyond prototypes?", "do they have B2B SaaS context, not just consumer?").

Return ONLY this JSON:
{
  "cv_parsed": {
    "full_name": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "summary": "",
    "experience": [
      { "title": "", "company": "", "duration": "", "bullets": [] }
    ],
    "education": [
      { "degree": "", "institution": "", "year": "", "city": "", "country": "", "url": "" }
    ],
    "skills": [],
    "certifications": [
      { "name": "", "issuer": "", "year": "", "url": "" }
    ],
    "languages": [
      { "name": "", "level": "" }
    ]
  },
  "jd_fingerprint": {
    "target_job_title": "",
    "real_job_summary": "",
    "required_hard_skills": [],
    "preferred_hard_skills": [],
    "required_soft_skills": [],
    "required_experience_years": "",
    "required_education": "",
    "required_certifications": [],
    "company_culture_signals": [],
    "top_20_keywords_ranked": [],
    "unstated_requirements": [],
    "likely_deal_breakers": [],
    "hiring_manager_top_concerns": [],
    "keyword_frequency": {}
  }
}`,
  'Parse + JD',
  m
);

// Stage 1b — ATS audit. Uses parsed CV + JD fingerprint, runs in parallel
// with the rewrite. The rewrite no longer depends on this stage.
const runAuditStage = (cvText, parsedData, m) => callProvider(
  `You audit CVs with FOUR expert lenses simultaneously:
  1. ATS Engineer — Workday, Taleo, iCIMS, Greenhouse, Lever, SmartRecruiters, Jobvite, BambooHR, Bullhorn, ADP.
  2. Senior Technical Recruiter — decides in 7 seconds who advances.
  3. Hiring Manager — knows what converts "interesting" into "offer".
  4. Career Strategist — sees the narrative under the bullets.

Be DIRECT and ruthless. The user needs the truth to win interviews — do not soften feedback to be nice. Output strict JSON only — no markdown, no prose.

DEEP ATS PARSING REALITIES:
- ~75% of resumes are filtered before any human reads them.
- Section headers must be STANDARD: "Experience" or "Work Experience" (not "Where I've Made An Impact"), "Education", "Skills", "Professional Summary", "Certifications".
- Tables, text boxes, multi-column layouts, graphics, icons, charts, skill-rating dots break parsing.
- Contact info in headers/footers is frequently missed — must be in the document body.
- Date format must be consistent (MM/YYYY or "Mon YYYY"). Mixing formats confuses parsers.
- Non-standard fonts render as garbled text. Safe: Calibri, Arial, Helvetica, Georgia, Garamond, Times New Roman.
- Taleo is strictest: single-column DOCX only.
- Workday, Greenhouse, Lever added AI semantic matching in 2024–2025 — they detect keyword stuffing.

KEYWORD STRATEGY:
- ATS scores exact-phrase match > synonym > semantic match. Exact wins.
- Top keywords should appear in THREE locations: Summary, Skills section, AND in context within bullets.
- Optimal natural integration: 3–5 times for top-priority keywords. More than that is stuffing.
- Acronyms: both forms at least once, e.g. "Search Engine Optimization (SEO)".
- Title mismatch: parenthetically note the equivalent — e.g., "Software Engineer III (Senior Software Engineer)".

BULLET QUALITY STANDARD — XYZ+ formula:
[Strong action verb] [what + scope] by [specific mechanism] resulting in [quantified outcome].
- BAD: "Responsible for payment infrastructure and improved reliability."
- GOOD: "Architected event-driven payment pipeline using Kafka and Go, processing 2.4M daily transactions and reducing failure rate from 0.8% → 0.04%."

BANNED WEAK VERBS (flag as weak_verb=true): handled, helped, worked on, was responsible for, assisted with, participated in, supported, contributed to, managed (without scope).

A bullet is WEAK if any of these are true: vague language ("various", "multiple", "several"), passive voice, no number, no mechanism (just outcome), buzzword soup ("synergize", "leverage", "ideate"), or a buried/missing JD keyword.

A 7-second test: would a recruiter understand the impact and relevance after 7 seconds? If not, the CV fails.`,
  `Audit this CV against the job description. Be specific and ruthless.

ORIGINAL CV TEXT:
${cvText}

PARSED CV:
${JSON.stringify(parsedData.cv_parsed)}

JD FINGERPRINT:
${JSON.stringify(parsedData.jd_fingerprint)}

For each section of the output:
- "ats_scores": 0–100 per dimension. Be honest — average CVs score 40–60.
- "formatting_audit": at minimum check standard section headers, date format consistency, contact info location, presence of tables/columns/graphics, font-safety.
- "keyword_analysis.present_wrong_phrasing": where the CV uses a synonym instead of the JD's exact phrase (e.g., CV says "JS" but JD says "JavaScript") — these silently fail ATS.
- "bullet_analysis": list the 5 WEAKEST bullets verbatim with specific issues per bullet.
- "strongest_bullets": list the 3 BEST bullets verbatim with why they work — used to anchor voice in rewrite.
- "top_5_quick_wins": ranked highest impact first; each must be specific enough to action immediately.
- "hiring_manager_red_flags": from the hiring-manager lens, what would make them pass on this candidate even with a perfect ATS score?
- "seven_second_verdict": one sentence — what a recruiter takes away in 7 seconds. The harder truth, not the polite one.
- "keyword_mapping_decisions": for each top JD keyword/skill, classify it as MATCH / ADJACENT / GAP based on the source CV evidence. MATCH = clearly demonstrated. ADJACENT = closely related skill that honestly transfers (cite the bullet). GAP = no evidence and nothing bridges. NEVER mark something MATCH or ADJACENT without naming the specific bullet/cert/education entry that backs it.
- "gap_declarations": for every must-have skill in the JD that the CV does not evidence, declare it openly with a concrete mitigation path (course, cert, side project, cover-letter framing). These surface as a loud panel in the UI — they are NOT silent failures. The user needs to see them.
- "verify_flags": anything suspicious in the source CV that the user should personally confirm — future-dated certs, metrics that look implausible, dates that overlap, credentials whose source you can't verify. Use \`[VERIFY: ...]\` style language in the \`flag\` field.

Return ONLY this JSON:
{
  "ats_scores": {
    "overall": 0,
    "formatting": 0,
    "keyword_match": 0,
    "bullet_quality": 0,
    "section_structure": 0,
    "job_title_alignment": 0
  },
  "formatting_audit": [
    { "item": "", "status": "PASS|FAIL|WARNING", "fix": "" }
  ],
  "keyword_analysis": {
    "critical_missing": [],
    "present_exact_match": [],
    "present_wrong_phrasing": [
      { "cv_phrase": "", "jd_phrase": "", "fix": "" }
    ],
    "keyword_match_percentage": 0
  },
  "bullet_analysis": [
    { "original": "", "issues": [], "weak_verb": true, "missing_metric": true, "buried_keyword": true }
  ],
  "strongest_bullets": [
    { "original": "", "why_it_works": "" }
  ],
  "hiring_manager_red_flags": [],
  "seven_second_verdict": "",
  "keyword_mapping_decisions": [
    { "jd_keyword": "", "decision": "MATCH|ADJACENT|GAP", "evidence": "" }
  ],
  "gap_declarations": [
    { "required_skill": "", "jd_phrase": "", "why_critical": "", "mitigation": "" }
  ],
  "verify_flags": [
    { "location": "", "content": "", "flag": "" }
  ],
  "top_5_quick_wins": [
    { "priority": 1, "action": "", "impact": "high|medium|low", "reason": "" }
  ],
  "projected_score_after_fixes": 0
}`,
  'Audit',
  m
);

// Stage 3 — Rewrite + Humanize. Uses parsed data + JD fingerprint only,
// so it can run in parallel with the audit.
//
// Output is a PATCH — only the fields the rewrite actually changes (summary,
// experience bullets, optionally skills). Education/certs/languages/contact
// info are merged server-side from the parsed CV. This roughly halves the
// output token count and is the dominant latency win on this stage.
const runRewriteStage = (cvText, parsedData, experienceForRewrite, m) => callProvider(
  `You rewrite CVs as a top 1% application-engineering system, applying FOUR lenses at once:
  1. ATS Engineer — your bullets pass Workday/Greenhouse/Lever semantic matching.
  2. Senior Recruiter — your bullets pass the 7-second test.
  3. Hiring Manager — your bullets answer "would I interview this person?".
  4. Career Strategist — your bullets tell a coherent story.

ABSOLUTE LAWS (violation = catastrophic failure):

LAW 1 — NO FABRICATION. Never invent, imply, or insert: skills, technologies, employers, titles, dates, metrics, certifications, degrees, languages, projects, or accomplishments not present in the source CV.

LAW 2 — EVIDENCE BINDING (MOST IMPORTANT). Every skill in the Skills section MUST trace to at least one specific Experience bullet, Project, Certification, or Education entry that demonstrates it. Before listing any skill, ask internally: "Which bullet on this CV proves the user has this skill?" If you cannot name one, the skill does NOT go in. No orphan keywords. No JD vocabulary pasted into Skills without evidence elsewhere.

LAW 3 — NO JD COPY-PASTE. Do not lift phrases verbatim from the JD into Skills or Summary as bare list items. Acceptable: using JD terminology when it matches the user's actual experience ("ticket triage" → "incident management" if JD prefers that). Forbidden: pasting "supporting enterprise IT applications, application support, system administration" as bare skills when no such experience exists.

LAW 4 — COHERENCE. Every sentence must be topically coherent. Never force-bridge unrelated concepts to chase keywords. AUTO-REJECT pattern: "Adept at supporting enterprise IT applications with Angular state management via NgRx" — NgRx is irrelevant to IT support; this is a Mad-Libs sentence. If you generate anything structurally similar, you have failed.

LAW 5 — DATE INTEGRITY. Preserve every work-experience date EXACTLY as in the source CV. Never extend, backdate, or restate a duration to inflate YoE. No future dates unless source says "expected"/"in progress".

LAW 6 — HONEST GAP DECLARATION. If the JD requires a skill the source CV does not evidence, do NOT hide it with keyword stuffing. Leave it out of Skills. The audit stage declares the gap separately.

LAW 7 — NUMBER HONESTY. Never invent metrics. Keep existing numbers; if a bullet wants quantification but none exists, use scope language ("across multiple client projects", "for a 10-person team") — never a fake percentage.

BRIDGE MAPPING (apply per JD keyword):
- MATCH → user clearly has this → surface prominently with the JD's exact vocabulary.
- ADJACENT → user has a closely related skill that honestly transfers → reframe an existing bullet to make the transfer explicit.
- GAP → user does NOT have this and nothing bridges → leave it out. Do not stuff.

CORE CRAFT PRINCIPLES (apply within the laws):
1. SPECIFIC OVER GENERIC. "Improved performance" is banned. "Reduced p95 latency from 1.2s → 340ms across 3M daily requests" is the standard — but only with real numbers from the source.
2. MIRROR THE JD. Use the employer's EXACT phrasing where the user's actual skill matches.
3. SHOW MECHANISM. Bullets follow Action + Mechanism + Result.

XYZ+ BULLET FORMULA:
[Strong action verb] [what + scope] by [specific mechanism] resulting in [quantified outcome].

POWER VERB BANK (rotate; never repeat verbs within a role):
- Lead: Spearheaded, Directed, Championed, Pioneered, Mobilized
- Build: Architected, Engineered, Developed, Designed, Constructed, Launched, Shipped
- Improve: Streamlined, Optimized, Accelerated, Reduced, Eliminated, Consolidated
- Influence: Negotiated, Persuaded, Advised, Aligned, Secured
- Analyze: Diagnosed, Identified, Modeled, Quantified, Forecasted, Audited
- Grow: Scaled, Expanded, Doubled, Tripled, Drove, Captured

BANNED WEAK VERBS — never use as the leading verb: handled, helped, worked on, was responsible for, assisted with, participated in, supported, contributed to.

BANNED AI-TELL PHRASES — never write: "leveraged", "utilized", "in order to", "as well as", "additionally", "furthermore", "robust", "seamless", "synergize", "ideate", "thinking outside the box", "results-driven".

BANNED FLUFF: "various", "multiple", "several", "passionate", "hard-working", "team player", "dedicated", "strong communication skills", adjectives without proof.

KEYWORD PLACEMENT — for the top 5 JD keywords, ensure each appears in THREE places: Summary, Skills, AND inside at least one bullet's context. Use EXACT-PHRASE match (ATS scores exact > synonym > semantic). 3–5 natural integrations per top keyword. Over 5 is stuffing.

HUMANIZATION (applied in the same pass):
- Vary sentence length drastically — mix short punchy bullets with longer descriptive ones.
- Never start two consecutive bullets in the same role with the same verb.
- Break up overly parallel structures; insert natural thought progression.
- Use contractions sparingly where the person's voice allows; add domain jargon they'd naturally know.
- Vary bullet openings: numbers, context-first, result-first, problem-first.
- The output must pass GPTZero / Originality.ai / Turnitin.

VOICE PRESERVATION:
- Study the original CV text. Detect vocabulary complexity, average sentence length, first vs third person, formality level, quantification style.
- Rewrite in that exact voice — only stronger, sharper, more specific.

STRICT STRUCTURAL CONSTRAINTS:
- Preserve ALL work experience dates EXACTLY as provided. Never extend, backdate, or rephrase a duration to inflate YoE (LAW 5).
- Keep the experience array in the SAME ORDER as input, with the same title + company + duration. Only bullets change.
- If summary references years of experience, it must match the dates AS WRITTEN — no padding.
- Skills: return as \`skills_with_evidence\` — array of { skill, evidence_anchor } objects.
    - For each carried-over source-CV skill: evidence_anchor = "source_cv".
    - For each newly added skill (MATCH or ADJACENT): evidence_anchor MUST be a short quoted excerpt from one of the rewritten bullets, certs, education entries, or the summary — proving the skill exists somewhere in this CV.
    - GAP skills do NOT go in. They're left for the audit stage to declare.
    - Aim for ${MIN_SKILLS}–${MAX_SKILLS} skills, curated and grouped logically.
- Summary: 2–3 lines, anchored on the user's ACTUAL professional identity first, then bridged honestly to the target role. Include 3–5 top JD keywords ONLY if they're evidenced in the rewritten CV body. Never claim domain knowledge the user does not have.
- Return strict valid JSON only. No markdown. No explanation.`,
  `Original CV text (source of voice and FACTS — never deviate from facts):
${cvText}

Parsed CV experience (rewrite the bullets, keep title/company/duration verbatim):
${JSON.stringify(experienceForRewrite)}

Existing skills (keep all + add missing JD hard skills using JD's EXACT phrasing):
${JSON.stringify(parsedData.cv_parsed.skills || [])}

Existing summary (rewrite in the same voice; keep YoE consistent with dates):
${JSON.stringify(parsedData.cv_parsed.summary || '')}

JD fingerprint — these are the keywords to embed using EXACT-PHRASE match.
Top-priority keywords (from "top_20_keywords_ranked" if present, else "required_hard_skills") MUST appear in 3 places: summary, skills, and inside ≥1 bullet's natural context:
${JSON.stringify(parsedData.jd_fingerprint)}

Quantification rule: every bullet that can carry a number SHOULD carry one. Pull numbers ONLY from facts already present in the original CV — team size, transactions, users, %, $, time. Never invent. If no number exists, lean on scope language ("across 3 product lines", "for the EU region team") that is true to the source.

Dates: preserve every work-experience date EXACTLY as in the original CV. Never extend, backdate, or restate a duration to inflate years of experience. The summary's YoE claim must match the dates as written.

Produce ONLY this JSON (no education, no certifications, no languages, no contact info — those are merged server-side):
{
  "voice_profile": {
    "detected_formality": "formal|semi-formal|casual",
    "detected_person": "first|third|mixed",
    "avg_bullet_length": "short|medium|long",
    "vocabulary_level": "simple|intermediate|advanced",
    "quantification_style": "heavy|moderate|light"
  },
  "summary": "",
  "experience": [
    { "title": "", "company": "", "duration": "", "bullets": [] }
  ],
  "skills_with_evidence": [
    { "skill": "", "evidence_anchor": "source_cv | <short quoted excerpt from a rewritten bullet/cert/education/summary>" }
  ],
  "keywords_injected": [],
  "keywords_still_missing": [],
  "ai_detection_risk": "low|medium|high",
  "confidence_note": ""
}`,
  'Rewrite & Humanize',
  m
);

const buildScores = (auditData) => ({
  current_ats: auditData?.ats_scores?.overall ?? 0,
  projected_ats: auditData?.projected_score_after_fixes ?? 0,
  formatting: auditData?.ats_scores?.formatting ?? 0,
  keyword_match: auditData?.ats_scores?.keyword_match ?? 0,
  bullet_quality: auditData?.ats_scores?.bullet_quality ?? 0,
  section_structure: auditData?.ats_scores?.section_structure ?? 0,
});

// Pipeline:
//   1a) Parse + JD fingerprint   (sequential — everything else needs this)
//   1b) Audit                    ┐ run in parallel after 1a
//   2 ) Rewrite + Humanize       ┘
//
// Dates from the parsed CV are passed through unchanged. There is no
// date-manipulation stage by design — silently extending YoE on a paid
// product is fraud-by-proxy on the user. Gaps surface in the audit as
// `gap_declarations[]` instead.
//
// `onProgress` is fired as each stage completes so the controller can stream
// partial results to the client. It must never throw — wrap calls in try/catch.
const analyzeCVWithJD = async (cvText, jobDescription, meta = {}, onProgress = () => {}) => {
  const m = { ...meta, feature: 'cv_analysis' };
  const safeProgress = (event) => {
    try { onProgress(event); } catch (_) { /* progress sink errors must not break analysis */ }
  };

  // ──────────────────────────────────────────────
  // STAGE 1a — PARSE + JD FINGERPRINT
  // ──────────────────────────────────────────────
  const stage1a = await runParseStage(cvText, jobDescription, m);
  const parsedData = { cv_parsed: stage1a.cv_parsed, jd_fingerprint: stage1a.jd_fingerprint };
  safeProgress({ type: 'parsed', parsed: parsedData });

  // ──────────────────────────────────────────────
  // STAGE 1b (audit) and STAGE 2 (rewrite) in parallel
  // ──────────────────────────────────────────────
  const auditPromise = runAuditStage(cvText, parsedData, m).then((audit) => {
    safeProgress({ type: 'audit', audit, scores: buildScores(audit) });
    return audit;
  });

  const rewritePromise = (async () => {
    const experienceForRewrite = parsedData.cv_parsed.experience || [];
    const merged = await runRewriteStage(cvText, parsedData, experienceForRewrite, m);

    // Build the full final_cv by merging the rewrite patch onto the parsed CV.
    // The rewrite stage only returns summary/experience/skills_with_evidence
    // (the parts it rewrites) — education, certifications, languages, and
    // contact info are carried over verbatim from parse to save output tokens.
    //
    // Skills go through an evidence-binding pass first: any new skill the
    // rewrite added MUST be traceable to a real string in the rewritten CV
    // body (a bullet, cert, education, or the summary). Skills that fail
    // the check are dropped. Carried-over source-CV skills are auto-trusted.
    const rewrittenExperience = Array.isArray(merged.experience) && merged.experience.length
      ? merged.experience
      : experienceForRewrite;
    const rewrittenSummary = typeof merged.summary === 'string' && merged.summary.trim()
      ? merged.summary
      : parsedData.cv_parsed.summary;

    const sourceSkills = parsedData.cv_parsed.skills || [];
    const skillsRaw = Array.isArray(merged.skills_with_evidence) && merged.skills_with_evidence.length
      ? merged.skills_with_evidence
      : (Array.isArray(merged.skills) ? merged.skills.map((s) => ({ skill: s, evidence_anchor: 'source_cv' })) : []);
    const { boundSkills, droppedSkills, evidenceBindings } = enforceEvidenceBinding(
      skillsRaw,
      sourceSkills,
      rewrittenExperience,
      rewrittenSummary,
      parsedData.cv_parsed.certifications || [],
      parsedData.cv_parsed.education || []
    );

    const final_cv = merged.final_cv || {
      ...parsedData.cv_parsed,
      summary: rewrittenSummary,
      experience: rewrittenExperience,
      skills: boundSkills,
    };

    safeProgress({ type: 'rewrite', final_cv });
    return { merged, final_cv, droppedSkills, evidenceBindings };
  })();

  const [auditData, { merged: mergedData, final_cv, droppedSkills, evidenceBindings }] = await Promise.all([auditPromise, rewritePromise]);

  // Map the merged output back to the existing rewrite/final shape so
  // downstream consumers (frontend, PDF, refine, history) keep working.
  const rewriteData = {
    voice_profile: mergedData.voice_profile,
    rewritten_cv: final_cv,
    changes_made: mergedData.changes_made || [],
    keywords_injected: mergedData.keywords_injected || [],
    keywords_still_missing: mergedData.keywords_still_missing || [],
    evidence_bindings: evidenceBindings,
    skills_dropped_no_evidence: droppedSkills,
  };
  const finalData = {
    final_cv,
    humanization_changes: [],
    ai_detection_risk: mergedData.ai_detection_risk || 'low',
    confidence_note: mergedData.confidence_note || '',
  };

  return {
    parsed: parsedData,
    audit: auditData,
    rewrite: rewriteData,
    final: finalData,
    scores: buildScores(auditData),
  };
};

// Quick refine: single AI call to apply user instructions to an existing final CV.
//
// The model returns a PATCH (only changed fields), not the whole CV. We merge it
// on top of the current CV server-side. This is faster (smaller output = lower
// latency), more reliable (model can't accidentally drop fields it forgot to
// echo), and cheaper. Both `patch` and the legacy `final_cv` shape are accepted
// so a stale prompt response is still safe.
const refineCVWithInstructions = async (finalCV, instructions, meta = {}) => {
  const originalRawText = (meta && meta.originalRawText) || '';

  const refined = await callProvider(
    `You are a precise CV editor. Apply the user's instructions to a CV.

You receive:
1. CURRENT CV (JSON) — the latest version.
2. ORIGINAL CV TEXT — only consult for restore/put-back requests.
3. USER INSTRUCTIONS.

OUTPUT — strict JSON, exactly two keys:
{
  "patch": { ... only the fields you are changing ... },
  "changes_applied": [ "short human-readable change description", ... ]
}

For arrays (skills, experience, education, certifications, languages), put the FULL updated array in patch.
For string fields (full_name, email, phone, location, linkedin, summary), put the new string.
OMIT every field you did not change.

EXAMPLES — read carefully, match the style:

User: "https://www.linkedin.com/in/johndoe/"
User: "https://www.linkedin.com/in/johndoe/  this is my linkedin link change it"
User: "set linkedin to https://www.linkedin.com/in/johndoe/"
→ {"patch": {"linkedin": "https://www.linkedin.com/in/johndoe/"}, "changes_applied": ["Updated LinkedIn URL"]}

User: "my email is jane@example.com"
→ {"patch": {"email": "jane@example.com"}, "changes_applied": ["Updated email"]}

User: "change my phone to +355 691234567"
→ {"patch": {"phone": "+355 691234567"}, "changes_applied": ["Updated phone"]}

User: "change my name to Jane Doe"
→ {"patch": {"full_name": "Jane Doe"}, "changes_applied": ["Updated name"]}

User: "add a 2-sentence summary"
→ {"patch": {"summary": "..."}, "changes_applied": ["Generated summary"]}

User: "add AWS and Docker to skills"
→ {"patch": {"skills": [...full new skills array including AWS and Docker...]}, "changes_applied": ["Added AWS, Docker"]}

RULES:
- A bare URL, email, or phone number IS a valid instruction — infer the target field from the URL host or value shape and update it. Do NOT ask for clarification.
- Apply ONLY what the user asked. Never touch unrelated fields.
- ADD/SUGGEST for skills/certifications: real industry-standard items only (AWS Certified X, PMP, CISSP, Scrum, etc.). 4–7 items unless asked otherwise.
- RESTORE/PUT-BACK: extract exact details from ORIGINAL CV TEXT.
- NEVER fabricate work experience, employers, dates, or education.

Return valid JSON only. No markdown, no prose.`,
    `CURRENT CV (JSON):
${JSON.stringify(finalCV, null, 2)}

ORIGINAL CV TEXT (consult only for restore requests):
${originalRawText ? originalRawText.slice(0, 4000) : '(not available)'}

USER INSTRUCTIONS:
${instructions}`,
    'Refine CV',
    { ...meta, feature: 'cv_refine' }
  );

  // Accept both the new patch shape and the legacy full-CV shape. Merging on
  // top of the original CV means any field the model forgets to echo back
  // survives untouched — drift-proof.
  const rawPatch = refined && (refined.patch || refined.final_cv) || {};
  const updatedFinalCV = { ...finalCV, ...rawPatch };
  const changes = (refined && Array.isArray(refined.changes_applied))
    ? refined.changes_applied
    : [];

  return { final_cv: updatedFinalCV, changes_applied: changes };
};

module.exports = { analyzeCVWithJD, refineCVWithInstructions };
