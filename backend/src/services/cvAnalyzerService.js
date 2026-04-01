// CV Analyzer Service
// 7-stage AI pipeline using Claude API for CV analysis, ATS audit, rewrite, and humanization

const anthropic = require('./anthropicClient');

const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 4000;

// Helper to call Claude and parse JSON response
const callClaude = async (systemPrompt, userMessage, stageName) => {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const text = response.content[0].text;

  try {
    return JSON.parse(text);
  } catch (err) {
    // Try to extract JSON from the response if wrapped in markdown
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch (innerErr) {
        throw new Error(`Stage "${stageName}" returned invalid JSON`);
      }
    }
    throw new Error(`Stage "${stageName}" returned invalid JSON`);
  }
};

// Main pipeline: runs 4 sequential Claude calls building on each result
const analyzeCVWithJD = async (cvText, jobDescription) => {
  // ──────────────────────────────────────────────
  // CALL 1 — PARSE CV & JD FINGERPRINT
  // ──────────────────────────────────────────────
  const parsedData = await callClaude(
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
    'Parse & JD Fingerprint'
  );

  // ──────────────────────────────────────────────
  // CALL 2 — ATS AUDIT & SCORING
  // ──────────────────────────────────────────────
  const auditData = await callClaude(
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
    'ATS Audit & Scoring'
  );

  // ──────────────────────────────────────────────
  // CALL 3 — VOICE EXTRACTION & INTELLIGENT REWRITE
  // ──────────────────────────────────────────────
  const rewriteData = await callClaude(
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

Parsed CV data:
${JSON.stringify(parsedData.cv_parsed)}

JD fingerprint (keywords to embed):
${JSON.stringify(parsedData.jd_fingerprint)}

ATS audit (issues to fix):
${JSON.stringify(auditData)}

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
    'Voice Extraction & Rewrite'
  );

  // ──────────────────────────────────────────────
  // CALL 4 — FINAL HUMANIZATION PASS
  // ──────────────────────────────────────────────
  const finalData = await callClaude(
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
    'Final Humanization'
  );

  // ──────────────────────────────────────────────
  // Return complete pipeline result
  // ──────────────────────────────────────────────
  return {
    parsed: parsedData,
    audit: auditData,
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

module.exports = { analyzeCVWithJD };
