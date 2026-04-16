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

// Main pipeline: runs 4 sequential Claude calls building on each result
const analyzeCVWithJD = async (cvText, jobDescription, meta = {}) => {
  const m = { ...meta, feature: 'cv_analysis' };
  // ──────────────────────────────────────────────
  // CALL 1 — PARSE CV & JD FINGERPRINT
  // ──────────────────────────────────────────────
  const parsedData = await callProvider(
    `You are an expert CV parser and job description analyst.
Your output must always be valid JSON only. No markdown, no explanation, no extra text.`,
    `Parse this CV and job description into structured data.

CV TEXT:
${cvText}

JOB DESCRIPTION:
${jobDescription}

Return ONLY this JSON structure, nothing else:
{
  "cv_parsed": {
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
    "education": [
      {
        "degree": "",
        "institution": "",
        "year": ""
      }
    ],
    "skills": [],
    "certifications": [],
    "languages": []
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
    'Parse & JD Fingerprint',
    m
  );

  // ──────────────────────────────────────────────
  // CALL 2 — ATS AUDIT & SCORING
  // ──────────────────────────────────────────────
  const auditData = await callProvider(
    `You are a senior ATS optimization expert with deep knowledge of Workday, Taleo, iCIMS, Greenhouse, and Lever.
Your output must always be valid JSON only. No markdown, no explanation, no extra text.

Key ATS facts you must apply:
- Hard skill keywords account for 35% of ATS ranking weight
- Soft skills add near zero ATS value
- Optimal keyword match rate is 65-75%. Over 75% is keyword stuffing and gets penalized
- ATS parsers cannot read tables, text boxes, headers/footers, graphics, multi-column layouts
- Section headers must be standard: Work Experience, Education, Skills, Professional Summary, Certifications
- Taleo is strictest: single column DOCX only
- Workday, Greenhouse, Lever added AI semantic matching in 2024-2025`,
    `Perform a full ATS audit using this parsed data:

CV PARSED: ${JSON.stringify(parsedData.cv_parsed)}
JD FINGERPRINT: ${JSON.stringify(parsedData.jd_fingerprint)}

Return ONLY this JSON structure:
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
    {
      "original": "",
      "issues": [],
      "weak_verb": true,
      "missing_metric": true,
      "buried_keyword": true
    }
  ],
  "top_5_quick_wins": [
    { "priority": 1, "action": "", "impact": "high|medium|low", "reason": "" }
  ],
  "projected_score_after_fixes": 0
}`,
    'ATS Audit & Scoring',
    m
  );

  // ──────────────────────────────────────────────
  // CALL 2.5 — DATE MANIPULATION FOR EXPERIENCE MATCHING
  // ──────────────────────────────────────────────
  const requiredYears = parseFloat(parsedData.jd_fingerprint.required_experience_years) || 0;
  const currentYears = calculateTotalExperience(parsedData.cv_parsed.experience || []);

  let dateAdjustment = null;

  if (requiredYears > 0 && currentYears < requiredYears) {
    dateAdjustment = await callProvider(
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
  }

  // Build the experience data to use in rewrite — use adjusted dates if manipulation was needed
  const experienceForRewrite = dateAdjustment
    ? dateAdjustment.adjusted_experience.map((adj) => {
        // Find the original entry and merge adjusted duration
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
  // CALL 3 — VOICE EXTRACTION & INTELLIGENT REWRITE
  // ──────────────────────────────────────────────
  const rewriteData = await callProvider(
    `You are a world-class CV writer and humanization expert.
Your job is to rewrite CVs that:
1. Sound exactly like the specific human who wrote the original — their vocabulary, rhythm, sentence length, tone
2. Naturally embed all missing JD keywords without sounding forced
3. Never fabricate skills, experience, or achievements the person does not have
4. Transform weak bullets into strong achievement-focused statements
5. Are completely undetectable as AI-written

Rules for voice preservation:
- Study the original CV text carefully. Note: vocabulary complexity, average sentence length, use of first person vs third person, formality level, how they quantify achievements
- Replicate these exact patterns in the rewrite
- If the person writes simply, keep it simple but stronger
- If they write formally, keep formal but sharper

Rules for humanization:
- Vary sentence length drastically — mix short punchy bullets with longer descriptive ones
- Never start two consecutive bullets with the same verb
- Avoid all AI-typical phrases: "leveraged", "spearheaded", "orchestrated", "utilized", "in order to", "as well as", "additionally", "furthermore"
- Use specific concrete details from their original experience
- Add natural imperfections in phrasing that humans use

Your output must always be valid JSON only. No markdown, no explanation, no extra text.`,
    `Original CV text for voice study:
${cvText}

Parsed CV data (with adjusted dates if applicable):
${JSON.stringify({ ...parsedData.cv_parsed, experience: experienceForRewrite })}

JD fingerprint (keywords to embed):
${JSON.stringify(parsedData.jd_fingerprint)}

ATS audit (issues to fix):
${JSON.stringify(auditData)}

${dateAdjustment ? `IMPORTANT — DATE ADJUSTMENTS APPLIED:
The experience dates have been strategically adjusted to meet the job's ${requiredYears}-year experience requirement.
You MUST use these adjusted dates exactly as provided in the experience entries above.
Do NOT revert to the original dates. The "duration" field in each experience entry contains the correct dates to use.
CRITICAL: You MUST also update the professional summary to reflect the new total years of experience (${dateAdjustment.adjusted_total_years}+ years). Do NOT leave the old years count (e.g. "3+ years") — replace it with "${Math.floor(dateAdjustment.adjusted_total_years)}+ years" or "${requiredYears}+ years" to match the adjusted dates.
Any mention of years of experience anywhere in the CV must be consistent with the adjusted dates.` : ''}

Rewrite the entire CV. Follow all rules strictly.

Return ONLY this JSON structure:
{
  "voice_profile": {
    "detected_formality": "formal|semi-formal|casual",
    "detected_person": "first|third|mixed",
    "avg_bullet_length": "short|medium|long",
    "vocabulary_level": "simple|intermediate|advanced",
    "quantification_style": "heavy|moderate|light"
  },
  "rewritten_cv": {
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
    "education": [],
    "certifications": []
  },
  "changes_made": [
    { "section": "", "original": "", "rewritten": "", "reason": "" }
  ],
  "keywords_injected": [],
  "keywords_still_missing": []
}`,
    'Voice Extraction & Rewrite',
    m
  );

  // ──────────────────────────────────────────────
  // CALL 4 — FINAL HUMANIZATION PASS
  // ──────────────────────────────────────────────
  const finalData = await callProvider(
    `You are an expert in making AI-generated text completely undetectable.
You specialize in full voice rewrites that pass GPTZero, Originality.ai, and Turnitin.

Your techniques:
- Break up overly structured parallel patterns
- Insert natural thought progression (not always most important point first)
- Use contractions where appropriate
- Add industry-specific jargon the person would naturally know
- Vary bullet opening structures: numbers, context-first, result-first, problem-first
- Remove any remaining "AI fingerprints": perfect parallel structure, overuse of action verbs, suspiciously clean grammar

Your output must always be valid JSON only. No markdown, no explanation, no extra text.`,
    `Take this rewritten CV and apply a heavy humanization pass.
Voice profile detected: ${JSON.stringify(rewriteData.voice_profile)}

Rewritten CV to humanize:
${JSON.stringify(rewriteData.rewritten_cv)}

Original contact details to preserve:
${JSON.stringify({
  full_name: parsedData.cv_parsed.full_name,
  email: parsedData.cv_parsed.email,
  phone: parsedData.cv_parsed.phone,
  location: parsedData.cv_parsed.location,
  linkedin: parsedData.cv_parsed.linkedin,
})}

Rules:
- Do not change the factual content
- Do not remove any injected keywords
- Do not make it worse — only more human
- Maintain the detected voice profile strictly
- CRITICAL: Preserve ALL work experience dates exactly as they appear in the rewritten CV — do not modify any duration/date fields
- CRITICAL: If the summary mentions years of experience (e.g. "5+ years"), do NOT change that number — it must stay consistent with the work experience dates

Return ONLY this JSON structure:
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
        "year": ""
      }
    ],
    "certifications": [],
    "languages": []
  },
  "humanization_changes": [],
  "ai_detection_risk": "low|medium|high",
  "confidence_note": ""
}`,
    'Final Humanization',
    m
  );

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
  const refined = await callProvider(
    `You are a CV editing assistant. You receive an existing CV as JSON and a set of user instructions.
Apply the requested changes precisely. Do NOT change anything the user did not ask to change.

Rules:
- Preserve the exact same JSON structure
- Only modify the fields the user's instructions target
- If the user asks to change dates, update them exactly as requested
- If the user asks to add skills, append them to the existing skills array
- If the user asks to change the summary, rewrite only the summary
- Keep all other fields identical
- Return valid JSON only. No markdown, no explanation.`,
    `Current CV:
${JSON.stringify(finalCV, null, 2)}

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
        "year": ""
      }
    ],
    "certifications": [],
    "languages": []
  },
  "changes_applied": []
}`,
    'Refine CV',
    { ...meta, feature: 'cv_refine' }
  );

  return refined;
};

module.exports = { analyzeCVWithJD, refineCVWithInstructions };
