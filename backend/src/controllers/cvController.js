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

// GET /api/cv/download/:cv_id — Generate and stream PDF on-demand
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

    const pdfBuffer = await generateCVPdfBuffer(finalCV);

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

// GET /api/cv/preview/:cv_id — Generate and stream PDF inline for preview
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

    const pdfBuffer = await generateCVPdfBuffer(finalCV);

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

    // Single Claude call to apply changes
    const refined = await refineCVWithInstructions(currentFinalCV, instructions, { userId: req.user.id, userEmail: req.user.email });

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

module.exports = { analyzeCV, getCVHistory, deleteCVRecord, downloadCVPdf, previewCVPdf, refineCV };
