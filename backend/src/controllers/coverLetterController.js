// Cover Letter Controller
// Generates tailored cover letters using Claude AI

const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { callAI } = require('../services/aiClient');
const { parsePDF } = require('../services/cvParserService');
const { incrementUsage } = require('../services/usageService');

// Configure multer for PDF uploads
const upload = multer({
  dest: path.join(__dirname, '..', '..', 'uploads'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  },
});

const uploadCV = upload.single('cv_file');

const buildPrompt = (cvText, jobDescription, tone) => {
  const toneInstruction = tone === 'formal'
    ? 'Use a formal, professional tone.'
    : tone === 'friendly'
    ? 'Use a warm, conversational yet professional tone.'
    : 'Use a confident, balanced professional tone.';

  return `You are an expert career coach and cover letter writer. Write a compelling, tailored cover letter based on the candidate's CV and the target job description.

${toneInstruction}

Guidelines:
- Keep it concise (3-4 paragraphs, under 400 words)
- Open with a strong hook — no generic "I am writing to apply" openings
- Highlight 2-3 specific achievements from the CV that directly match the job requirements
- Show genuine enthusiasm for the company and role
- End with a confident call to action
- Do NOT include placeholder brackets like [Your Name] — write it as a complete letter
- Do NOT include the date or addresses — just the letter body

CANDIDATE'S CV:
${cvText}

JOB DESCRIPTION:
${jobDescription}

Write the cover letter now. Return ONLY the letter text, no extra commentary.`;
};

// Generate from raw text (used by CV Analyzer inline)
const generateCoverLetter = async (req, res) => {
  const { cv_text, job_description, tone } = req.body;

  if (!cv_text || !job_description) {
    return res.status(400).json({ error: 'cv_text and job_description are required' });
  }

  try {
    const text = await callAI(
      'You are an expert career coach and cover letter writer.',
      buildPrompt(cv_text, job_description, tone),
      2000,
      { userId: req.user?.id, userEmail: req.user?.email, feature: 'cover_letter' }
    );

    await incrementUsage(req.user?.id, 'cover_letter');

    return res.status(200).json({ cover_letter: text });
  } catch (err) {
    console.error('Cover letter generation error:', err.message);
    return res.status(500).json({ error: `Failed to generate cover letter: ${err.message}` });
  }
};

// Generate from PDF upload (used by standalone Cover Letter page)
const generateFromPdf = async (req, res) => {
  let uploadedFilePath = null;

  try {
    await new Promise((resolve, reject) => {
      uploadCV(req, res, (err) => {
        if (err) reject(err);
        else resolve(undefined);
      });
    });

    if (!req.file) {
      return res.status(400).json({ error: 'PDF file is required' });
    }

    uploadedFilePath = req.file.path;
    const jobDescription = req.body.job_description;
    const tone = req.body.tone || 'balanced';

    if (!jobDescription) {
      return res.status(400).json({ error: 'job_description is required' });
    }

    const cvText = await parsePDF(uploadedFilePath);

    const text = await callAI(
      'You are an expert career coach and cover letter writer.',
      buildPrompt(cvText, jobDescription, tone),
      2000,
      { userId: req.user?.id, userEmail: req.user?.email, feature: 'cover_letter' }
    );

    await incrementUsage(req.user?.id, 'cover_letter');

    return res.status(200).json({ cover_letter: text });
  } catch (err) {
    console.error('Cover letter PDF generation error:', err.message);
    return res.status(500).json({ error: `Failed to generate cover letter: ${err.message}` });
  } finally {
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      fs.unlinkSync(uploadedFilePath);
    }
  }
};

// Refine an existing cover letter with AI instructions
const refineCoverLetter = async (req, res) => {
  const { cover_letter, instructions } = req.body;

  if (!cover_letter || !instructions) {
    return res.status(400).json({ error: 'cover_letter and instructions are required' });
  }

  try {
    const text = await callAI(
      'You are an expert cover letter editor. Apply changes precisely and return only the updated letter.',
      `Here is a cover letter:\n\n${cover_letter}\n\nApply the following changes:\n${instructions}\n\nReturn ONLY the updated cover letter text, nothing else.`,
      2000,
      { userId: req.user?.id, userEmail: req.user?.email, feature: 'cl_refine' }
    );

    return res.status(200).json({ cover_letter: text });
  } catch (err) {
    console.error('Cover letter refine error:', err.message);
    return res.status(500).json({ error: `Failed to refine cover letter: ${err.message}` });
  }
};

module.exports = { generateCoverLetter, generateFromPdf, refineCoverLetter };
