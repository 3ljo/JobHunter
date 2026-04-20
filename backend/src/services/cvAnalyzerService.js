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

const analyzeCVWithJD = async (cvText, jobDescription, meta = {}) => {
  const m = { ...meta, feature: 'cv_analysis' };
  // ──────────────────────────────────────────────
  // STAGE 1 — PARSE + AUDIT (merged into one call)
  // Was 2 sequential calls; merging saves one full LLM round-trip.
  // ──────────────────────────────────────────────
  const stage1 = await callProvider(
    `You are a combined expert CV parser, JD analyst, and senior ATS optimization expert.
You know Workday, Taleo, iCIMS, Greenhouse, and Lever deeply.
Your output must always be valid JSON only. No markdown, no explanation, no extra text.

Key ATS facts you must apply in the audit:
- Hard skill keywords account for 35% of ATS ranking weight
- Soft skills add near zero ATS value
- Optimal keyword match rate is 65-75%. Over 75% is keyword stuffing and gets penalized
- ATS parsers cannot read tables, text boxes, headers/footers, graphics, multi-column layouts
- Section headers must be standard: Work Experience, Education, Skills, Professional Summary, Certifications
- Taleo is strictest: single column DOCX only
- Workday, Greenhouse, Lever added AI semantic matching in 2024-2025`,
    `Parse the CV and the job description, then audit the CV against the JD.

CV TEXT:
${cvText}

JOB DESCRIPTION:
${jobDescription}

Return ONLY this JSON structure, nothing else. Preserve ALL certifications and education
entries from the CV — never drop a factual credential. If an entry has a URL (certificate
link, institution website, course page), you MUST capture it in the "url" field. Also
capture city and country if present next to the institution. Dropping URLs or locations
is a critical failure.

Languages: every language entry MUST have BOTH a "name" (e.g., "English", "Italian",
"German") AND a "level" (e.g., "B2", "Native", "Fluent"). NEVER output just a level with
no name. If the CV lists "English B2" and "Italian B1", output
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
  },
  "audit": {
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
  }
}`,
    'Parse + Audit',
    m
  );

  const parsedData = { cv_parsed: stage1.cv_parsed, jd_fingerprint: stage1.jd_fingerprint };
  const auditData  = stage1.audit;

  // ──────────────────────────────────────────────
  // STAGE 2 — DATE ADJUSTMENT (conditional)
  // ──────────────────────────────────────────────
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

  // ──────────────────────────────────────────────
  // STAGE 3 — REWRITE + HUMANIZE (merged into 1 call)
  // Previously 2 sequential calls (~5-8s each); now 1 call that
  // produces already-humanized output. Cuts roughly half the
  // total analysis latency.
  // ──────────────────────────────────────────────
  const mergedData = await callProvider(
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

ATS audit (issues to fix in the rewrite):
${JSON.stringify(auditData)}

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

  // ──────────────────────────────────────────────
  // Return complete pipeline result
  // ──────────────────────────────────────────────
  return {
    parsed: parsedData,
    audit: auditData,
    dateAdjustment: dateAdjustment,
    rewrite: rewriteData,
    final: finalData,
    scores: {
      current_ats: auditData.ats_scores.overall,
      projected_ats: auditData.projected_score_after_fixes,
      formatting: auditData.ats_scores.formatting,
      keyword_match: auditData.ats_scores.keyword_match,
      bullet_quality: auditData.ats_scores.bullet_quality,
      section_structure: auditData.ats_scores.section_structure,
    },
  };
};

// Quick refine: single Claude call to apply user instructions to existing final CV
const refineCVWithInstructions = async (finalCV, instructions, meta = {}) => {
  const originalRawText = (meta && meta.originalRawText) || '';

  const refined = await callProvider(
    `You are a CV editing assistant. You receive:
1. The CURRENT CV (JSON) — the latest rewritten version shown to the user.
2. The ORIGINAL CV TEXT — what the user originally uploaded, BEFORE any AI rewrites.
3. User instructions.

Apply the requested changes precisely. Do NOT change anything the user did not ask to change.

Rules:
- Preserve the exact same JSON structure.
- Only modify the fields the user's instructions target; keep everything else identical.

RESTORE / PUT-BACK requests (e.g. "put back my certifications", "restore the jobs you removed"):
- Extract the exact details from the ORIGINAL CV TEXT and populate the field.
- Never invent facts the user originally stated (employers, dates, education, etc.).
- If the original text also lacks the requested content, leave the field empty and note it in changes_applied.

ADD / SUGGEST requests (e.g. "add the best certifications for this role", "suggest skills for a DevOps engineer", "add industry-standard certifications"):
- It IS ALLOWED to generate new, industry-standard suggestions relevant to the CV's
  role, seniority, and skills.
- For certifications, include ONLY real, recognized certifications (AWS Certified X,
  Microsoft Certified Y, CompTIA Z, PMP, CISSP, Google Professional, Scrum, etc.).
  Include the full official name. Do NOT invent fake certifications.
- For skills, pick widely recognized industry-standard skills that align with the role.
- Keep the list focused: 4–7 items max unless the user asked for more.
- NEVER fabricate work experience, job titles, employers, dates, or education —
  those must come from the user's original CV text.

Formatting:
- If the user asks to change dates, update them exactly as requested.
- If the user asks to add skills, append them to the existing skills array (dedupe).
- If the user asks to change the summary, rewrite only the summary.
- Populate \`changes_applied\` with short human-readable descriptions of what was changed.
- Return valid JSON only. No markdown, no explanation.`,
    `CURRENT CV (JSON):
${JSON.stringify(finalCV, null, 2)}

ORIGINAL CV TEXT (source of truth for anything missing from the current CV):
${originalRawText ? originalRawText.slice(0, 8000) : '(not available)'}

User instructions:
${instructions}

Apply the changes and return the COMPLETE updated CV in this exact JSON structure:
{
  "final_cv": {
    "full_name": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "summary": "",
    "experience": [
      {
        "title": "",
        "company": "",
        "duration": "",
        "bullets": []
      }
    ],
    "skills": [],
    "education": [
      {
        "degree": "",
        "institution": "",
        "year": "",
        "city": "",
        "country": "",
        "url": ""
      }
    ],
    "certifications": [
      { "name": "", "issuer": "", "year": "", "url": "" }
    ],
    "languages": [
      { "name": "", "level": "" }
    ]
  },
  "changes_applied": []
}`,
    'Refine CV',
    { ...meta, feature: 'cv_refine' }
  );

  return refined;
};

module.exports = { analyzeCVWithJD, refineCVWithInstructions };
