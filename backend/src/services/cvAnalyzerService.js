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

// Helper to calculate total experience years from parsed experience entries
const calculateTotalExperience = (experience) => {
  let totalMonths = 0;
  const now = new Date();

  for (const exp of experience) {
    if (!exp.duration) continue;
    const duration = exp.duration.toLowerCase().trim();

    // Try to parse "MMM YYYY - MMM YYYY" or "MMM YYYY - Present" patterns
    const rangeMatch = duration.match(
      /(\w+)\s+(\d{4})\s*[-–—to]+\s*(\w+)\s*(\d{4})?/i
    );
    if (rangeMatch) {
      const startMonth = new Date(`${rangeMatch[1]} 1, ${rangeMatch[2]}`);
      let endMonth;
      if (
        rangeMatch[3].toLowerCase() === 'present' ||
        rangeMatch[3].toLowerCase() === 'current'
      ) {
        endMonth = now;
      } else {
        endMonth = new Date(
          `${rangeMatch[3]} 1, ${rangeMatch[4] || now.getFullYear()}`
        );
      }
      if (!isNaN(startMonth) && !isNaN(endMonth)) {
        const months =
          (endMonth.getFullYear() - startMonth.getFullYear()) * 12 +
          (endMonth.getMonth() - startMonth.getMonth());
        totalMonths += Math.max(0, months);
      }
    }
  }

  return Math.round((totalMonths / 12) * 10) / 10; // round to 1 decimal
};

// Helper: date adjustment stage — only runs if required years > current years
const runDateAdjustmentStage = (parsedData, m) => {
  const requiredYears = parseFloat(parsedData.jd_fingerprint.required_experience_years) || 0;
  const currentYears = calculateTotalExperience(parsedData.cv_parsed.experience || []);
  if (!(requiredYears > 0 && currentYears < requiredYears)) return Promise.resolve(null);

  return callProvider(
    `You are a strategic CV date optimizer. Your job is to adjust work experience dates on a CV so that the total years of experience meets or slightly exceeds a target requirement.

Rules:
- You can ONLY modify start dates and end dates of existing positions — never add fake companies or roles
- Push the START DATE of the EARLIEST job backward to add the missing years
- Keep all date gaps between jobs realistic (no overlapping positions unless the original had overlaps)
- If the candidate has multiple positions, distribute the added time naturally — primarily extend the earliest role, but you can slightly extend others if it looks more natural
- All dates must be in the same format as the original CV (e.g., "Jan 2020 - Present")
- Never set any date in the future
- Keep end dates of past roles unchanged when possible — only adjust start dates
- The total experience after adjustment should be between the required years and required years + 1 (don't overshoot)
- Make it look natural: round to full months, avoid suspiciously round numbers

Your output must always be valid JSON only. No markdown, no explanation, no extra text.`,
    `The job requires ${requiredYears} years of experience.
The candidate currently has approximately ${currentYears} years based on their CV dates.
Gap to fill: ${(requiredYears - currentYears).toFixed(1)} years.

Current experience entries:
${JSON.stringify(parsedData.cv_parsed.experience, null, 2)}

Today's date: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}

Adjust the dates to meet the ${requiredYears}-year requirement. Return ONLY this JSON:
{
  "adjusted_experience": [
    {
      "title": "",
      "company": "",
      "original_duration": "",
      "adjusted_duration": "",
      "change_reason": ""
    }
  ],
  "original_total_years": ${currentYears},
  "adjusted_total_years": 0,
  "required_years": ${requiredYears},
  "strategy_used": ""
}`,
    'Date Manipulation',
    m
  );
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
const runRewriteStage = (cvText, parsedData, experienceForRewrite, dateAdjustment, requiredYears, m) => callProvider(
  `You rewrite CVs as a top 1% application-engineering system, applying FOUR lenses at once:
  1. ATS Engineer — your bullets pass Workday/Greenhouse/Lever semantic matching.
  2. Senior Recruiter — your bullets pass the 7-second test.
  3. Hiring Manager — your bullets answer "would I interview this person?".
  4. Career Strategist — your bullets tell a coherent story.

CORE PRINCIPLES (non-negotiable):
1. TRUTH FIRST. Never invent skills, employers, titles, dates, metrics, or credentials. The candidate's facts are sacred — only the framing changes.
2. SPECIFIC OVER GENERIC. "Improved performance" is banned. "Reduced p95 latency from 1.2s → 340ms across 3M daily requests" is the standard.
3. MIRROR THE JD. Use the employer's EXACT phrasing for hard skills. If the JD says "TypeScript", do not write "JS/TS". If it says "stakeholder management", do not write "managed stakeholders".
4. QUANTIFY EVERYTHING. Every bullet that can carry a number should: % improvement, $ saved/earned, users/transactions affected, time reduced, team size, scope. If a number is impossible without invention, lean on scope/scale words from the original CV — never fabricate.
5. SHOW MECHANISM. Bullets follow Action + Mechanism + Result. Not just what was achieved, but the specific lever pulled.

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
- Preserve ALL work experience dates EXACTLY as provided (including any adjusted ones).
- Keep the experience array in the SAME ORDER as input, with the same title + company + duration. Only bullets change.
- If summary references years of experience, keep it consistent with the dates.
- Skills: return the FULL updated skills array (parsed skills + any JD keywords naturally added using EXACT JD phrasing). Don't drop existing skills.
- Summary: 2–3 lines, tailored to the JD, integrating 4–5 top keywords naturally.
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

${dateAdjustment ? `IMPORTANT — DATE ADJUSTMENTS APPLIED:
The experience dates were strategically adjusted to meet the job's ${requiredYears}-year experience requirement.
Use these adjusted dates EXACTLY as provided; do not revert.
The professional summary MUST reflect the new total years (${Math.floor(dateAdjustment.adjusted_total_years)}+ years or ${requiredYears}+ years).` : ''}

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
  "skills": [],
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
//   1b) Audit                    ┐
//   2 ) Date adjustment (cond.)  ├─ run in parallel after 1a
//   3 ) Rewrite + Humanize       ┘
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
  // STAGE 1b (audit) and STAGE 2+3 (date adj → rewrite) in parallel
  // ──────────────────────────────────────────────
  const auditPromise = runAuditStage(cvText, parsedData, m).then((audit) => {
    safeProgress({ type: 'audit', audit, scores: buildScores(audit) });
    return audit;
  });

  const rewritePromise = (async () => {
    const dateAdjustment = await runDateAdjustmentStage(parsedData, m);
    const requiredYears = parseFloat(parsedData.jd_fingerprint.required_experience_years) || 0;
    const experienceForRewrite = dateAdjustment
      ? dateAdjustment.adjusted_experience.map((adj) => {
          const original = parsedData.cv_parsed.experience.find(
            (e) => e.company === adj.company && e.title === adj.title
          ) || {};
          return {
            ...original,
            duration: adj.adjusted_duration,
            original_duration: adj.original_duration,
          };
        })
      : parsedData.cv_parsed.experience;

    const merged = await runRewriteStage(cvText, parsedData, experienceForRewrite, dateAdjustment, requiredYears, m);

    // Build the full final_cv by merging the rewrite patch onto the parsed CV.
    // The rewrite stage now only returns summary/experience/skills (the parts
    // it actually rewrites) — education, certifications, languages, and contact
    // info are carried over verbatim from parse to save output tokens.
    // If a stale model response still returns the old `final_cv` shape, use it.
    const final_cv = merged.final_cv || {
      ...parsedData.cv_parsed,
      summary: typeof merged.summary === 'string' && merged.summary.trim()
        ? merged.summary
        : parsedData.cv_parsed.summary,
      experience: Array.isArray(merged.experience) && merged.experience.length
        ? merged.experience
        : experienceForRewrite,
      skills: Array.isArray(merged.skills) && merged.skills.length
        ? merged.skills
        : (parsedData.cv_parsed.skills || []),
    };

    safeProgress({ type: 'rewrite', final_cv });
    return { merged, final_cv, dateAdjustment };
  })();

  const [auditData, { merged: mergedData, final_cv, dateAdjustment }] = await Promise.all([auditPromise, rewritePromise]);

  // Map the merged output back to the existing rewrite/final shape so
  // downstream consumers (frontend, PDF, refine, history) keep working.
  const rewriteData = {
    voice_profile: mergedData.voice_profile,
    rewritten_cv: final_cv,
    changes_made: mergedData.changes_made || [],
    keywords_injected: mergedData.keywords_injected || [],
    keywords_still_missing: mergedData.keywords_still_missing || [],
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
    dateAdjustment,
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
