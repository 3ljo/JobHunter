// Cover Letter Controller
// Generates tailored cover letters using Claude AI

const path = require('path');
const fs = require('fs');
const multer = require('multer');
const anthropic = require('../services/anthropicClient');
const { parsePDF } = require('../services/cvParserService');

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
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: buildPrompt(cv_text, job_description, tone) }],
    });

    return res.status(200).json({ cover_letter: response.content[0].text });
  } catch (err) {
    console.error('Cover letter generation error:', err.message, err.status || '');
    const message = err.status === 401 ? 'AI service authentication error — check API key'
      : err.status === 429 ? 'AI rate limit reached — please try again in a moment'
      : err.status === 529 ? 'AI service is temporarily overloaded — please retry'
      : `Failed to generate cover letter: ${err.message}`;
    return res.status(500).json({ error: message });
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

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: buildPrompt(cvText, jobDescription, tone) }],
    });

    return res.status(200).json({ cover_letter: response.content[0].text });
  } catch (err) {
    console.error('Cover letter PDF generation error:', err.message, err.status || '');
    const message = err.status === 401 ? 'AI service authentication error — check API key'
      : err.status === 429 ? 'AI rate limit reached — please try again in a moment'
      : err.status === 529 ? 'AI service is temporarily overloaded — please retry'
      : `Failed to generate cover letter: ${err.message}`;
    return res.status(500).json({ error: message });
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
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `Here is a cover letter:\n\n${cover_letter}\n\nApply the following changes:\n${instructions}\n\nReturn ONLY the updated cover letter text, nothing else.`,
        },
      ],
    });

    return res.status(200).json({ cover_letter: response.content[0].text });
  } catch (err) {
    console.error('Cover letter refine error:', err.message, err.status || '');
    const message = err.status === 401 ? 'AI service authentication error — check API key'
      : err.status === 429 ? 'AI rate limit reached — please try again in a moment'
      : err.status === 529 ? 'AI service is temporarily overloaded — please retry'
      : `Failed to refine cover letter: ${err.message}`;
    return res.status(500).json({ error: message });
  }
};

module.exports = { generateCoverLetter, generateFromPdf, refineCoverLetter };
