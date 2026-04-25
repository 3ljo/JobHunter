// Mock Interview Controller
// Voice-based AI interview sessions — Pro+ gated.

const supabase = require('../services/supabaseClient');
const {
  generateQuestions,
  scoreAnswer,
  generateFinalReport,
} = require('../services/mockInterviewService');
const { incrementUsage } = require('../services/usageService');

const DIFFICULTY_VALUES = ['standard', 'challenging', 'stress'];

// Helper: fetch a session + verify ownership.
const fetchOwnedSession = async (cv_id, userId) => {
  const { data, error } = await supabase
    .from('mock_interviews')
    .select('*')
    .eq('id', cv_id)
    .eq('user_id', userId)
    .single();
  if (error || !data) return { error: 'Interview not found' };
  return { data };
};

// Helper: fetch optional CV text from cvs table.
const fetchCvText = async (cv_id, userId) => {
  if (!cv_id) return '';
  try {
    const { data } = await supabase
      .from('cvs')
      .select('raw_text, ats_feedback')
      .eq('id', cv_id)
      .eq('user_id', userId)
      .single();
    if (!data) return '';
    // Prefer the rewritten CV if it exists; fall back to raw upload text.
    const finalCv = data.ats_feedback?.final?.final_cv;
    if (finalCv) {
      const { full_name, email, summary, experience, skills, education, certifications } = finalCv;
      const expStr = Array.isArray(experience)
        ? experience
            .map((e) => `${e.title || ''} @ ${e.company || ''} (${e.duration || ''})\n  - ${(e.bullets || []).join('\n  - ')}`)
            .join('\n')
        : '';
      const eduStr = Array.isArray(education)
        ? education.map((e) => [e.degree, e.institution, e.year].filter(Boolean).join(' — ')).join('\n')
        : '';
      return [
        full_name && `Name: ${full_name}`,
        summary && `Summary: ${summary}`,
        expStr && `Experience:\n${expStr}`,
        Array.isArray(skills) && skills.length && `Skills: ${skills.join(', ')}`,
        eduStr && `Education: ${eduStr}`,
        Array.isArray(certifications) && certifications.length &&
          `Certifications: ${certifications.map((c) => (typeof c === 'string' ? c : c.name || '')).join(', ')}`,
      ].filter(Boolean).join('\n\n');
    }
    return data.raw_text || '';
  } catch {
    return '';
  }
};

// POST /api/interview/start — creates a session and generates questions
const startInterview = async (req, res) => {
  try {
    const { cv_id, job_description, job_title, difficulty } = req.body || {};

    if (!job_description || !String(job_description).trim()) {
      return res.status(400).json({ error: 'job_description is required' });
    }

    const diff = DIFFICULTY_VALUES.includes(difficulty) ? difficulty : 'standard';
    const cvText = await fetchCvText(cv_id, req.user.id);

    let questions;
    try {
      questions = await generateQuestions(
        { cvText, jobDescription: job_description, difficulty: diff, jobTitle: job_title || '' },
        { userId: req.user.id, userEmail: req.user.email }
      );
    } catch (aiErr) {
      console.error('AI question generation failed:', aiErr.message);
      return res.status(502).json({ error: `AI did not return valid questions: ${aiErr.message}` });
    }

    const { data, error } = await supabase
      .from('mock_interviews')
      .insert({
        user_id: req.user.id,
        cv_id: cv_id || null,
        job_title: job_title || null,
        job_description,
        difficulty: diff,
        questions,
        answers: [],
        status: 'in_progress',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create interview row:', error);
      const msg = error.message || '';
      // Friendly hint when the table is missing from the DB.
      if (/relation.*does not exist|mock_interviews/i.test(msg)) {
        return res.status(500).json({
          error: 'mock_interviews table is missing in Supabase. Run backend/src/database/mock-interview-schema.sql in the Supabase SQL editor, then try again.',
        });
      }
      return res.status(500).json({ error: `Database insert failed: ${msg}` });
    }

    // Session created — count this as one mock interview against the daily quota.
    await incrementUsage(req.user.id, 'mock_interview');

    return res.status(200).json({ id: data.id, questions });
  } catch (err) {
    console.error('Start interview error:', err);
    return res.status(500).json({ error: err.message || 'Failed to start interview' });
  }
};

// POST /api/interview/:id/answer — submits one answer and scores it
const submitAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    const { question_id, transcript } = req.body || {};

    if (!question_id) return res.status(400).json({ error: 'question_id is required' });

    const { data: session, error: fetchErr } = await fetchOwnedSession(id, req.user.id);
    if (fetchErr) return res.status(404).json({ error: fetchErr });

    if (session.status === 'completed') {
      return res.status(400).json({ error: 'Interview already completed' });
    }

    const question = (session.questions || []).find((q) => q.id === question_id);
    if (!question) return res.status(400).json({ error: 'Unknown question_id' });

    const scored = await scoreAnswer(
      { question, answer: transcript || '', jobDescription: session.job_description },
      { userId: req.user.id, userEmail: req.user.email }
    );

    // Replace any existing answer for this question, or append a new one
    const existing = (session.answers || []).filter((a) => a.question_id !== question_id);
    const answers = [
      ...existing,
      {
        question_id,
        transcript: transcript || '',
        score: scored.score,
        feedback: scored.feedback,
        missing_signals: scored.missing_signals,
      },
    ];

    const { error: updateErr } = await supabase
      .from('mock_interviews')
      .update({ answers })
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (updateErr) {
      console.error('Failed to save answer:', updateErr);
      return res.status(500).json({ error: `Failed to save answer: ${updateErr.message}` });
    }

    return res.status(200).json({
      question_id,
      score: scored.score,
      feedback: scored.feedback,
      missing_signals: scored.missing_signals,
    });
  } catch (err) {
    console.error('Submit answer error:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to score answer' });
  }
};

// POST /api/interview/:id/finish — generates the final report
const finishInterview = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: session, error: fetchErr } = await fetchOwnedSession(id, req.user.id);
    if (fetchErr) return res.status(404).json({ error: fetchErr });

    if (session.status === 'completed' && session.final_report) {
      return res.status(200).json({ id: session.id, final_report: session.final_report });
    }

    const cvText = await fetchCvText(session.cv_id, req.user.id);

    const report = await generateFinalReport(
      {
        questions: session.questions || [],
        answers: session.answers || [],
        cvText,
        jobDescription: session.job_description,
        jobTitle: session.job_title,
      },
      { userId: req.user.id, userEmail: req.user.email }
    );

    const { error: updateErr } = await supabase
      .from('mock_interviews')
      .update({
        final_report: report,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (updateErr) {
      console.error('Failed to save report:', updateErr);
      return res.status(500).json({ error: `Failed to save report: ${updateErr.message}` });
    }

    return res.status(200).json({ id, final_report: report });
  } catch (err) {
    console.error('Finish interview error:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to finalize interview' });
  }
};

// GET /api/interview/:id — fetch a full session (questions + answers + report)
const getInterview = async (req, res) => {
  try {
    const { data, error } = await fetchOwnedSession(req.params.id, req.user.id);
    if (error) return res.status(404).json({ error });
    return res.status(200).json({ interview: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// GET /api/interview/history — last 20 sessions for this user
const getHistory = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('mock_interviews')
      .select('id, job_title, difficulty, status, created_at, completed_at, final_report')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ interviews: data || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { startInterview, submitAnswer, finishInterview, getInterview, getHistory };
