// CV Controller
// Handles CV upload, AI analysis pipeline, DOCX generation, history, and deletion

const path = require('path');
const fs = require('fs');
const multer = require('multer');
const supabase = require('../services/supabaseClient');
const { parsePDF } = require('../services/cvParserService');
const { analyzeCVWithJD, refineCVWithInstructions } = require('../services/cvAnalyzerService');
const { generateCVDocx } = require('../services/cvGeneratorService');
const { generateCVPdfBuffer } = require('../services/cvPdfService');
const { incrementUsage } = require('../services/usageService');

// Configure multer for PDF uploads (max 5MB)
const upload = multer({
  dest: path.join(__dirname, '..', '..', 'uploads'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// Middleware for single PDF upload
const uploadCV = upload.single('cv_file');

// POST /api/cv/analyze — Full CV analysis pipeline
const analyzeCV = async (req, res) => {
  let uploadedFilePath = null;

  try {
    // Handle file upload via multer
    await new Promise((resolve, reject) => {
      uploadCV(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // Validate required fields
    if (!req.file) {
      return res.status(400).json({ error: 'CV file (PDF) is required' });
    }
    if (!req.body.job_description) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    uploadedFilePath = req.file.path;
    const jobDescription = req.body.job_description;

    // Stage 1: Parse the PDF
    const cvText = await parsePDF(uploadedFilePath);

    // Stages 2-7: Run the full AI analysis pipeline
    const result = await analyzeCVWithJD(cvText, jobDescription, { userId: req.user.id, userEmail: req.user.email });

    // Pipeline succeeded — count this as one analysis against the user's daily quota.
    await incrementUsage(req.user.id, 'cv_analysis');

    // Save record to cvs table (no file storage — PDF is generated on-demand)
    const insertData = {
      user_id: req.user.id,
      file_name: `cv_optimized_${Date.now()}.pdf`,
      file_url: null,
      raw_text: cvText,
      ats_score: result.scores.current_ats,
      projected_score: result.scores.projected_ats || null,
      ats_feedback: result,
      is_generated: false,
    };

    let { data: cvRecord, error: dbError } = await supabase
      .from('cvs')
      .insert(insertData)
      .select()
      .single();

    // Retry without projected_score if column doesn't exist
    if (dbError) {
      console.error('DB save error (retrying without projected_score):', dbError.message);
      const { projected_score, ...fallbackData } = insertData;
      const fallback = await supabase
        .from('cvs')
        .insert(fallbackData)
        .select()
        .single();
      cvRecord = fallback.data;
      if (fallback.error) {
        console.error('DB save fallback error:', fallback.error.message);
      }
    }

    return res.status(200).json({
      ...result,
      download_url: null,
      cv_record_id: cvRecord ? cvRecord.id : null,
    });
  } catch (err) {
    console.error('CV analysis error:', err.message);
    return res.status(500).json({ error: err.message || 'CV analysis failed' });
  } finally {
    // Clean up temp files
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      fs.unlinkSync(uploadedFilePath);
    }
  }
};

// GET /api/cv/history — Get user's CV analysis history
const getCVHistory = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('cvs')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ cvs: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// DELETE /api/cv/:cv_id — Delete a CV record and its file
const deleteCVRecord = async (req, res) => {
  const { cv_id } = req.params;

  try {
    // Verify the CV belongs to the authenticated user
    const { data: cv, error: fetchError } = await supabase
      .from('cvs')
      .select('*')
      .eq('id', cv_id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !cv) {
      return res.status(404).json({ error: 'CV not found' });
    }

    // Delete from Supabase Storage
    if (cv.file_name) {
      const storagePath = `${req.user.id}/${cv.file_name}`;
      await supabase.storage.from('cvs').remove([storagePath]);
    }

    // Delete from cvs table
    const { error: deleteError } = await supabase
      .from('cvs')
      .delete()
      .eq('id', cv_id)
      .eq('user_id', req.user.id);

    if (deleteError) {
      return res.status(400).json({ error: deleteError.message });
    }

    return res.status(200).json({ message: 'CV deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Extract template + photo from request body or query (supports GET + POST)
const readExportOptions = (req) => {
  const src = (req.method === 'POST' ? req.body : req.query) || {};
  return {
    template: typeof src.template === 'string' ? src.template : undefined,
    photo: typeof src.photo === 'string' ? src.photo : null,
  };
};

// GET/POST /api/cv/download/:cv_id — Generate and stream PDF on-demand
const downloadCVPdf = async (req, res) => {
  const { cv_id } = req.params;

  try {
    const { data: cv, error } = await supabase
      .from('cvs')
      .select('*')
      .eq('id', cv_id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !cv) {
      return res.status(404).json({ error: 'CV not found' });
    }

    const feedback = cv.ats_feedback;
    const finalCV = feedback?.final?.final_cv;
    if (!finalCV) {
      return res.status(400).json({ error: 'No rewritten CV data available' });
    }

    const opts = readExportOptions(req);
    const pdfBuffer = await generateCVPdfBuffer(finalCV, opts);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="cv_optimized.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    return res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF generation error:', err.message);
    return res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

// GET/POST /api/cv/preview/:cv_id — Generate and stream PDF inline for preview
const previewCVPdf = async (req, res) => {
  const { cv_id } = req.params;

  try {
    const { data: cv, error } = await supabase
      .from('cvs')
      .select('*')
      .eq('id', cv_id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !cv) {
      return res.status(404).json({ error: 'CV not found' });
    }

    const feedback = cv.ats_feedback;
    const finalCV = feedback?.final?.final_cv;
    if (!finalCV) {
      return res.status(400).json({ error: 'No rewritten CV data available' });
    }

    const opts = readExportOptions(req);
    const pdfBuffer = await generateCVPdfBuffer(finalCV, opts);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="cv_preview.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    return res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF preview error:', err.message);
    return res.status(500).json({ error: 'Failed to generate PDF preview' });
  }
};

// POST /api/cv/refine — Apply quick AI edits to an existing CV
const refineCV = async (req, res) => {
  try {
    const { cv_id, instructions } = req.body;

    if (!cv_id || !instructions) {
      return res.status(400).json({ error: 'cv_id and instructions are required' });
    }

    // Fetch the CV record and verify ownership
    const { data: cv, error: fetchError } = await supabase
      .from('cvs')
      .select('*')
      .eq('id', cv_id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !cv) {
      return res.status(404).json({ error: 'CV not found' });
    }

    const currentFinalCV = cv.ats_feedback?.final?.final_cv;
    if (!currentFinalCV) {
      return res.status(400).json({ error: 'No CV data to refine' });
    }

    // Single Claude call to apply changes — pass the original raw CV text so the AI
    // can recover content that was pruned in earlier rewrites (e.g. certifications)
    const refined = await refineCVWithInstructions(
      currentFinalCV,
      instructions,
      { userId: req.user.id, userEmail: req.user.email, originalRawText: cv.raw_text || '' }
    );

    // Update the final_cv in ats_feedback
    const updatedFeedback = {
      ...cv.ats_feedback,
      final: {
        ...cv.ats_feedback.final,
        final_cv: refined.final_cv,
      },
    };

    const { error: updateError } = await supabase
      .from('cvs')
      .update({ ats_feedback: updatedFeedback })
      .eq('id', cv_id)
      .eq('user_id', req.user.id);

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    return res.status(200).json({
      final_cv: refined.final_cv,
      changes_applied: refined.changes_applied || [],
    });
  } catch (err) {
    console.error('CV refine error:', err.message);
    return res.status(500).json({ error: err.message || 'CV refinement failed' });
  }
};

// POST /api/cv/create — Generate a CV from user-supplied structured data (no AI analysis).
// Saves to the `cvs` table using the same shape analyzeCV produces, so the existing
// download/preview endpoints render it without any further changes.
const createCV = async (req, res) => {
  try {
    const { cv, template, photo } = req.body || {};

    if (!cv || typeof cv !== 'object') {
      return res.status(400).json({ error: 'cv object is required' });
    }
    if (!cv.full_name || !String(cv.full_name).trim()) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    // Normalize: drop empty strings/arrays so the templates render cleanly.
    const clean = {
      full_name:  String(cv.full_name || '').trim() || undefined,
      email:      String(cv.email || '').trim() || undefined,
      phone:      String(cv.phone || '').trim() || undefined,
      location:   String(cv.location || '').trim() || undefined,
      linkedin:   String(cv.linkedin || '').trim() || undefined,
      summary:    String(cv.summary || '').trim() || undefined,
      experience: Array.isArray(cv.experience)
        ? cv.experience
            .map((e) => ({
              title:    String(e?.title || '').trim() || undefined,
              company:  String(e?.company || '').trim() || undefined,
              duration: String(e?.duration || '').trim() || undefined,
              bullets:  Array.isArray(e?.bullets)
                ? e.bullets.map((b) => String(b || '').trim()).filter(Boolean)
                : [],
            }))
            .filter((e) => e.title || e.company || (e.bullets && e.bullets.length))
        : [],
      education: Array.isArray(cv.education)
        ? cv.education
            .map((e) => ({
              degree:      String(e?.degree || '').trim() || undefined,
              institution: String(e?.institution || '').trim() || undefined,
              year:        String(e?.year || '').trim() || undefined,
            }))
            .filter((e) => e.degree || e.institution || e.year)
        : [],
      skills: Array.isArray(cv.skills)
        ? cv.skills.map((s) => String(s || '').trim()).filter(Boolean)
        : [],
      certifications: Array.isArray(cv.certifications)
        ? cv.certifications
            .map((c) => (typeof c === 'string' ? c.trim() : String(c?.name || '').trim()))
            .filter(Boolean)
        : [],
    };

    const insertData = {
      user_id: req.user.id,
      file_name: `cv_created_${Date.now()}.pdf`,
      file_url: null,
      raw_text: null,
      ats_score: null,
      ats_feedback: {
        final: {
          final_cv: clean,
          // Remember what the user picked so the history list can show it
          // and re-downloads default to the same template.
          template: typeof template === 'string' ? template : 'harvard',
          photo: typeof photo === 'string' && photo.startsWith('data:image/') ? photo : null,
        },
      },
      is_generated: true,
    };

    let { data: cvRecord, error: dbError } = await supabase
      .from('cvs')
      .insert(insertData)
      .select()
      .single();

    // Retry without projected_score column if the legacy schema doesn't have it — same
    // defensive pattern analyzeCV uses. `projected_score` isn't in insertData here, but
    // other optional columns could also be missing on older Supabase projects.
    if (dbError) {
      console.error('createCV insert failed:', dbError.message);
      return res.status(500).json({ error: `Failed to save CV: ${dbError.message}` });
    }

    // Counts against the daily CV quota (same quota as analyze — one "CV" per day).
    await incrementUsage(req.user.id, 'cv_analysis');

    return res.status(200).json({
      cv_record_id: cvRecord.id,
      final_cv: clean,
    });
  } catch (err) {
    console.error('CV create error:', err.message);
    return res.status(500).json({ error: err.message || 'CV creation failed' });
  }
};

module.exports = { analyzeCV, createCV, getCVHistory, deleteCVRecord, downloadCVPdf, previewCVPdf, refineCV };
