// Mock Interview Service
// AI prompt helpers for the voice mock interview (virtual HR) feature.
// All calls go through aiClient.callAI with feature='mock_interview'
// so usage is rate-limited and cost-tracked automatically.

const { callAI, getCurrentProvider } = require('./aiClient');

// ── JSON helper (same pattern as cvAnalyzerService) ───────────────
const parseJsonResponse = (text, stageName) => {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      try { return JSON.parse(match[1].trim()); }
      catch { /* fallthrough */ }
    }
    throw new Error(`Stage "${stageName}" returned invalid JSON (provider: ${getCurrentProvider()})`);
  }
};

// ── 1) Generate tailored questions ────────────────────────────────
const generateQuestions = async ({ cvText, jobDescription, difficulty = 'standard', jobTitle = '' }, meta = {}) => {
  const m = { ...meta, feature: 'mock_interview' };

  const system = `You are a senior hiring manager running a realistic interview for the role described.
Produce 6 to 8 questions tailored to the candidate's CV and the job description.
Mix exactly:
- 2 to 3 behavioral questions (where STAR-method answers are appropriate)
- 2 to 3 technical or domain-specific questions targeting the JD's hard skills
- 1 to 2 situational / hypothetical questions

Difficulty levels:
- standard: realistic mid-level interviewer, normal pressure
- challenging: senior interviewer, probes deeply, follows up on weak claims
- stress: deliberately adversarial / stress-test style questions (tight time,
  unexpected curveballs, pressure language)

Rules:
- Each question must be answerable in 60 to 120 seconds of speech.
- Prefer questions that probe specific claims in the CV when possible.
- Never reveal the "right answer" in the question.
- Return valid JSON only. No markdown.`;

  const user = `Candidate CV:
${cvText || '(no CV provided)'}

Job description${jobTitle ? ` for the role: ${jobTitle}` : ''}:
${jobDescription}

Difficulty: ${difficulty}

Return ONLY this JSON:
{
  "questions": [
    {
      "id": "q1",
      "text": "",
      "kind": "behavioral|technical|situational",
      "expected_signals": ["", ""]
    }
  ]
}`;

  const raw = await callAI(system, user, null, { ...m, stage: 'interview_generate_questions' });
  const parsed = parseJsonResponse(raw, 'interview_generate_questions');
  if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    throw new Error('AI did not return any questions');
  }
  // Normalize ids so the frontend can reference them safely
  parsed.questions = parsed.questions.map((q, i) => ({
    id: q.id || `q${i + 1}`,
    text: String(q.text || '').trim(),
    kind: ['behavioral', 'technical', 'situational'].includes(q.kind) ? q.kind : 'behavioral',
    expected_signals: Array.isArray(q.expected_signals) ? q.expected_signals : [],
  }));
  return parsed.questions;
};

// ── 2) Score a single answer ──────────────────────────────────────
const scoreAnswer = async ({ question, answer, jobDescription }, meta = {}) => {
  const m = { ...meta, feature: 'mock_interview' };

  const system = `You are a strict but fair interviewer reviewing a candidate's spoken answer.
Score 0 to 100 using these weighted criteria:
- relevance to the question (25%)
- specificity and concrete evidence / metrics (25%)
- structure (STAR where appropriate) and clarity (20%)
- alignment with the job description (20%)
- communication quality (length, rambling, filler) (10%)

Penalize: vague claims, rambling, unsupported "we did great things", filler words.
Reward: specific numbers, named tools, clear outcome, honest framing.

Keep feedback short (2 to 4 sentences), actionable, and direct. No flattery.
Return valid JSON only. No markdown.`;

  const user = `Question (${question.kind}): ${question.text}
${question.expected_signals && question.expected_signals.length ? `Signals we were hoping to hear: ${question.expected_signals.join(', ')}\n` : ''}
Job description:
${jobDescription || '(none provided)'}

Candidate's transcribed answer:
"""${(answer || '').trim() || '(no answer)'}"""

Return ONLY this JSON:
{
  "score": 0,
  "feedback": "",
  "missing_signals": []
}`;

  const raw = await callAI(system, user, null, { ...m, stage: 'interview_score_answer' });
  const parsed = parseJsonResponse(raw, 'interview_score_answer');
  return {
    score: Math.max(0, Math.min(100, parseInt(parsed.score, 10) || 0)),
    feedback: String(parsed.feedback || ''),
    missing_signals: Array.isArray(parsed.missing_signals) ? parsed.missing_signals : [],
  };
};

// ── 3) Generate final report ──────────────────────────────────────
const generateFinalReport = async ({ questions, answers, cvText, jobDescription, jobTitle }, meta = {}) => {
  const m = { ...meta, feature: 'mock_interview' };

  const system = `You are a senior hiring manager writing a concise post-interview debrief for a candidate.
Summarize how they performed across all answers.

Weighting:
- Technical and JD-specific answers count double
- Behavioral answers count normally
- Situational answers count 1.5x

Produce:
- An overall_score (0-100, weighted)
- 3 concrete strengths (each one short bullet, reference specific answer if possible)
- 3 concrete weaknesses (each one short bullet, reference specific answer if possible)
- 3 top_improvements ordered by impact; each should be a specific, practiceable action

No fluff, no "overall a good interview" filler. Be direct, like a hiring manager writing
honest feedback the candidate can act on before the real interview.
Return valid JSON only. No markdown.`;

  const user = `${jobTitle ? `Role: ${jobTitle}\n` : ''}Job description:
${jobDescription || '(none)'}

Candidate CV (for context):
${(cvText || '').slice(0, 4000)}

Session (questions and transcribed answers with per-answer scores):
${JSON.stringify(
  questions.map((q) => {
    const a = (answers || []).find((x) => x.question_id === q.id) || {};
    return {
      question: q.text,
      kind: q.kind,
      answer: a.transcript || '',
      score: a.score || 0,
      per_answer_feedback: a.feedback || '',
    };
  }),
  null,
  2
)}

Return ONLY this JSON:
{
  "overall_score": 0,
  "strengths": [],
  "weaknesses": [],
  "top_improvements": []
}`;

  const raw = await callAI(system, user, null, { ...m, stage: 'interview_final_report' });
  const parsed = parseJsonResponse(raw, 'interview_final_report');
  return {
    overall_score: Math.max(0, Math.min(100, parseInt(parsed.overall_score, 10) || 0)),
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
    top_improvements: Array.isArray(parsed.top_improvements) ? parsed.top_improvements : [],
  };
};

module.exports = { generateQuestions, scoreAnswer, generateFinalReport };
