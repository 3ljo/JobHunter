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
  `You are an expert CV parser and JD analyst. Your job is to extract clean, structured
data from a CV and a job description. Output strict JSON only — no markdown, no prose.`,
  `Parse the CV and the job description into structured data.

CV TEXT:
${cvText}

JOB DESCRIPTION:
${jobDescription}

Return ONLY this JSON. Preserve ALL certifications and education entries from the CV
— never drop a factual credential. If an entry has a URL (certificate link, institution
website, course page), capture it in the "url" field. Capture city and country if
present next to the institution. Dropping URLs or locations is a critical failure.

Languages: every language entry MUST have BOTH a "name" (e.g., "English", "Italian")
AND a "level" (e.g., "B2", "Native", "Fluent"). NEVER output just a level with no name.
If the CV lists "English B2" and "Italian B1", output
[{"name":"English","level":"B2"},{"name":"Italian","level":"B1"}] — not ["B2","B1"].

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
    "required_hard_skills": [],
    "preferred_hard_skills": [],
    "required_soft_skills": [],
    "required_experience_years": "",
    "required_education": "",
    "required_certifications": [],
    "company_culture_signals": [],
    "keyword_frequency": {}
  }
}`,
  'Parse + JD',
  m
);

// Stage 1b — ATS audit. Uses parsed CV + JD fingerprint, runs in parallel
// with the rewrite. The rewrite no longer depends on this stage.
const runAuditStage = (cvText, parsedData, m) => callProvider(
  `You are a senior ATS optimization expert. You know Workday, Taleo, iCIMS, Greenhouse,
and Lever deeply. Your output must always be valid JSON only — no markdown, no prose.

Key ATS facts you must apply:
- Hard skill keywords account for 35% of ATS ranking weight
- Soft skills add near zero ATS value
- Optimal keyword match rate is 65-75%. Over 75% is keyword stuffing and gets penalized
- ATS parsers cannot read tables, text boxes, headers/footers, graphics, multi-column layouts
- Section headers must be standard: Work Experience, Education, Skills, Professional Summary, Certifications
- Taleo is strictest: single column DOCX only
- Workday, Greenhouse, Lever added AI semantic matching in 2024-2025`,
  `Audit this CV against the job description.

ORIGINAL CV TEXT:
${cvText}

PARSED CV:
${JSON.stringify(parsedData.cv_parsed)}

JD FINGERPRINT:
${JSON.stringify(parsedData.jd_fingerprint)}

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
const runRewriteStage = (cvText, parsedData, experienceForRewrite, dateAdjustment, requiredYears, m) => callProvider(
  `You are a world-class CV writer and humanization expert.
Your job is to produce a FINAL, ATS-optimized, undetectably-human CV in a single pass.

Pass 1 — Voice preservation & intelligent rewrite:
1. Study the original CV text carefully. Detect vocabulary complexity, avg sentence length,
   first vs third person, formality level, quantification style.
2. Rewrite every section in that exact voice — only stronger, sharper, more specific.
3. Naturally embed all missing JD keywords without sounding forced.
4. Never fabricate skills, experience, employers, dates, or achievements.
5. Transform weak bullets into strong achievement-focused statements.
6. PRESERVE every certification, license, degree, and education entry from the parsed CV.
   NEVER drop or empty them. If the parsed CV lists certifications, the final_cv.certifications
   array MUST contain them (rewritten/normalized in wording is fine, but the items themselves
   must survive). Same for education entries. Dropping factual credentials is a critical failure.
7. PRESERVE every URL exactly as given (certificate links, institution websites). Do NOT
   shorten, rewrite, or drop URLs. Copy them character-for-character into the "url" field.
   Same for city, country, and year fields — carry them through verbatim.
8. LANGUAGES must always include BOTH "name" and "level" for every entry. Never output
   a language with just a level and no name. Example: [{"name":"English","level":"B2"}].

Pass 2 — Heavy humanization (applied in the SAME output):
- Vary sentence length drastically — mix short punchy bullets with longer descriptive ones.
- Never start two consecutive bullets with the same verb.
- Avoid all AI-typical phrases: "leveraged", "spearheaded", "orchestrated", "utilized",
  "in order to", "as well as", "additionally", "furthermore".
- Break up overly parallel structures; insert natural thought progression.
- Use contractions where the person's voice allows; add industry-specific jargon they
  would naturally know.
- Vary bullet openings: numbers, context-first, result-first, problem-first.
- The final output must pass GPTZero / Originality.ai / Turnitin.

Strict constraints:
- Preserve ALL work experience dates exactly as provided (including any adjusted ones).
- If the summary references years of experience, keep it consistent with the dates.
- Preserve contact details exactly as provided.
- Return a single valid JSON. No markdown. No explanation.`,
  `Original CV text (source of voice and facts):
${cvText}

Parsed CV data (use these as the facts; dates are authoritative):
${JSON.stringify({ ...parsedData.cv_parsed, experience: experienceForRewrite })}

JD fingerprint (keywords to embed):
${JSON.stringify(parsedData.jd_fingerprint)}

Contact details to preserve exactly:
${JSON.stringify({
  full_name: parsedData.cv_parsed.full_name,
  email: parsedData.cv_parsed.email,
  phone: parsedData.cv_parsed.phone,
  location: parsedData.cv_parsed.location,
  linkedin: parsedData.cv_parsed.linkedin,
})}

${dateAdjustment ? `IMPORTANT — DATE ADJUSTMENTS APPLIED:
The experience dates were strategically adjusted to meet the job's ${requiredYears}-year experience requirement.
Use these adjusted dates EXACTLY as provided; do not revert.
The professional summary MUST reflect the new total years (${Math.floor(dateAdjustment.adjusted_total_years)}+ years or ${requiredYears}+ years).` : ''}

Produce ONE final, humanized CV in this exact JSON structure:
{
  "voice_profile": {
    "detected_formality": "formal|semi-formal|casual",
    "detected_person": "first|third|mixed",
    "avg_bullet_length": "short|medium|long",
    "vocabulary_level": "simple|intermediate|advanced",
    "quantification_style": "heavy|moderate|light"
  },
  "final_cv": {
    "full_name": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "summary": "",
    "experience": [
      { "title": "", "company": "", "duration": "", "bullets": [] }
    ],
    "skills": [],
    "education": [
      { "degree": "", "institution": "", "year": "", "city": "", "country": "", "url": "" }
    ],
    "certifications": [
      { "name": "", "issuer": "", "year": "", "url": "" }
    ],
    "languages": [
      { "name": "", "level": "" }
    ]
  },
  "changes_made": [
    { "section": "", "original": "", "rewritten": "", "reason": "" }
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
    safeProgress({ type: 'rewrite', final_cv: merged.final_cv });
    return { merged, dateAdjustment };
  })();

  const [auditData, { merged: mergedData, dateAdjustment }] = await Promise.all([auditPromise, rewritePromise]);

  // Map the merged output back to the existing rewrite/final shape so
  // downstream consumers (frontend, PDF, refine, history) keep working.
  const rewriteData = {
    voice_profile: mergedData.voice_profile,
    rewritten_cv: mergedData.final_cv,
    changes_made: mergedData.changes_made || [],
    keywords_injected: mergedData.keywords_injected || [],
    keywords_still_missing: mergedData.keywords_still_missing || [],
  };
  const finalData = {
    final_cv: mergedData.final_cv,
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
