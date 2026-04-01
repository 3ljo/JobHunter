// CV Controller
// Handles CV upload, AI analysis pipeline, DOCX generation, history, and deletion

const path = require('path');
const fs = require('fs');
const multer = require('multer');
const supabase = require('../services/supabaseClient');
const { parsePDF } = require('../services/cvParserService');
const { analyzeCVWithJD } = require('../services/cvAnalyzerService');
const { generateCVDocx } = require('../services/cvGeneratorService');

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
  let docxPath = null;

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
    const result = await analyzeCVWithJD(cvText, jobDescription);

    // Generate the optimized DOCX file
    const docxFileName = `cv_optimized_${req.user.id}_${Date.now()}.docx`;
    docxPath = path.join(__dirname, '..', '..', 'uploads', docxFileName);
    await generateCVDocx(result.final.final_cv, docxPath);

    // Upload DOCX to Supabase Storage
    const docxBuffer = fs.readFileSync(docxPath);
    const storagePath = `${req.user.id}/${docxFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('cvs')
      .upload(storagePath, docxBuffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: true,
      });

    let fileUrl = null;
    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from('cvs')
        .getPublicUrl(storagePath);
      fileUrl = urlData.publicUrl;
    }

    // Save record to cvs table
    const { data: cvRecord, error: dbError } = await supabase
      .from('cvs')
      .insert({
        user_id: req.user.id,
        file_name: docxFileName,
        file_url: fileUrl,
        raw_text: cvText,
        ats_score: result.scores.current_ats,
        ats_feedback: result,
        is_generated: false,
      })
      .select()
      .single();

    if (dbError) {
      console.error('DB save error:', dbError.message);
    }

    return res.status(200).json({
      ...result,
      download_url: fileUrl,
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
    if (docxPath && fs.existsSync(docxPath)) {
      fs.unlinkSync(docxPath);
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

module.exports = { analyzeCV, getCVHistory, deleteCVRecord };
