// CV Controller
// Handles CV upload, AI analysis pipeline, DOCX generation, history, and deletion

const path = require('path');
const fs = require('fs');
const multer = require('multer');
const supabase = require('../services/supabaseClient');
const { parsePDF } = require('../services/cvParserService');
const { analyzeCVWithJD, refineCVWithInstructions } = require('../services/cvAnalyzerService');
const { generateCVDocxBuffer, generateCVTxt } = require('../services/cvGeneratorService');
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

// Postgres TEXT/JSONB columns reject NUL bytes (error 22P05 "unsupported Unicode
// escape sequence"), even though they're valid in JSON. pdf-parse leaks them
// from PDFs with custom fonts, and the AI occasionally echoes them back inside
// the JSON result — both inserts then fail with no useful fallback. Walk the
// value and strip `\x00` from every string in place.
const stripNulBytes = (value) => {
  if (typeof value === 'string') return value.replace(/\x00/g, '');
  if (Array.isArray(value)) return value.map(stripNulBytes);
  if (value && typeof value === 'object') {
    const out = {};
    for (const k of Object.keys(value)) out[k] = stripNulBytes(value[k]);
    return out;
  }
  return value;
};

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
    // Job description needs real content — an empty or 1-char string just
    // burns a CV analysis quota slot and returns a garbage AI response
    // that crashes downstream when we try to read result.scores. Cap at
    // ~15k chars (about 3.5k tokens) so a pasted 50KB blob doesn't hit
    // the AI's context limit and 500 after spending the quota.
    const jobDescriptionRaw = typeof req.body.job_description === 'string'
      ? req.body.job_description.trim()
      : '';
    if (jobDescriptionRaw.length < 20) {
      return res.status(400).json({
        error: 'Job description is too short — please paste at least 20 characters.',
        code: 'jd_too_short',
      });
    }
    if (jobDescriptionRaw.length > 15000) {
      return res.status(400).json({
        error: 'Job description is too long. Please shorten it (max ~15,000 characters).',
        code: 'jd_too_long',
      });
    }

    uploadedFilePath = req.file.path;
    const jobDescription = jobDescriptionRaw;

    // Parse the PDF before flipping the response into streaming mode, so any
    // parse error still returns a normal JSON 4xx/5xx with the right status.
    const cvText = await parsePDF(uploadedFilePath);

    // ── Stream NDJSON ─────────────────────────────────────────────────────
    // Each AI stage finishes in parallel — we flush a `{type, ...}\n` chunk
    // as soon as each one completes so the UI can render partial results.
    // Final shape: ...progress events..., then `{type:"done", result, cv_record_id}`.
    res.status(200);
    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    // Disable proxy buffering (nginx, some Render edges) so chunks reach the browser live.
    res.setHeader('X-Accel-Buffering', 'no');
    if (typeof res.flushHeaders === 'function') res.flushHeaders();

    const writeEvent = (event) => {
      if (res.writableEnded || res.destroyed) return;
      try {
        res.write(JSON.stringify(event) + '\n');
        if (typeof res.flush === 'function') res.flush();
      } catch (_) {
        /* socket gone — analysis continues but events are dropped */
      }
    };

    const result = await analyzeCVWithJD(
      cvText,
      jobDescription,
      { userId: req.user.id, userEmail: req.user.email },
      writeEvent,
    );

    // Pipeline succeeded — count this as one analysis against the user's daily quota.
    await incrementUsage(req.user.id, 'cv_analysis');

    // Save record to cvs table (no file storage — PDF is generated on-demand)
    const insertData = {
      user_id: req.user.id,
      file_name: `cv_optimized_${Date.now()}.pdf`,
      file_url: null,
      raw_text: stripNulBytes(cvText),
      ats_score: result.scores.current_ats,
      projected_score: result.scores.projected_ats || null,
      ats_feedback: stripNulBytes(result),
      is_generated: false,
    };

    let { data: cvRecord, error: dbError } = await supabase
      .from('cvs')
      .insert(insertData)
      .select()
      .single();

    // Retry without projected_score if column doesn't exist
    let finalDbError = null;
    if (dbError) {
      console.error('DB save error (retrying without projected_score):', {
        message: dbError.message,
        code: dbError.code,
        details: dbError.details,
        hint: dbError.hint,
      });
      const { projected_score, ...fallbackData } = insertData;
      const fallback = await supabase
        .from('cvs')
        .insert(fallbackData)
        .select()
        .single();
      cvRecord = fallback.data;
      if (fallback.error) {
        console.error('DB save fallback error:', {
          message: fallback.error.message,
          code: fallback.error.code,
          details: fallback.error.details,
          hint: fallback.error.hint,
          user_id: req.user.id,
        });
        finalDbError = fallback.error;
      }
    }

    // If both inserts failed, the AI editor and download buttons will be dead
    // (they need a cv_record_id). Surface the actual reason in the done event
    // so the UI can show something more actionable than "CV record not ready".
    const saveError = !cvRecord && finalDbError
      ? `${finalDbError.message}${finalDbError.code ? ` (${finalDbError.code})` : ''}`
      : null;

    writeEvent({
      type: 'done',
      result: { ...result, download_url: null, cv_record_id: cvRecord ? cvRecord.id : null },
      cv_record_id: cvRecord ? cvRecord.id : null,
      save_error: saveError,
    });
    return res.end();
  } catch (err) {
    console.error('CV analysis error:', err.message);
    // If we already flipped to NDJSON streaming, send the error as an event
    // and end the stream — `res.status(500).json(...)` would crash with
    // "Cannot set headers after they are sent".
    if (res.headersSent) {
      try {
        res.write(JSON.stringify({ type: 'error', error: err.message || 'CV analysis failed' }) + '\n');
      } catch (_) { /* socket already closed */ }
      return res.end();
    }
    return res.status(500).json({ error: err.message || 'CV analysis failed' });
  } finally {
    // Clean up temp files
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      fs.unlinkSync(uploadedFilePath);
    }
  }
};

// GET /api/cv/history — Get user's CV analysis history (paginated).
// Query params: ?page=1&page_size=20 (page_size capped at 50 so a
// malicious client can't request 10k rows in one query).
const getCVHistory = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const rawPageSize = parseInt(req.query.page_size, 10) || 20;
    const pageSize = Math.min(50, Math.max(1, rawPageSize));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('cvs')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('getCVHistory error:', error.message);
      return res.status(500).json({ error: 'Could not load CV history' });
    }

    return res.status(200).json({
      cvs: data || [],
      page,
      page_size: pageSize,
      total: count || 0,
      has_more: count ? from + (data || []).length < count : false,
    });
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

// Sanitize a user-supplied filename: strip path separators / control chars,
// keep something safe for Content-Disposition. Returns a fallback if empty.
const sanitizeFilename = (raw, fallback = 'cv_optimized') => {
  if (typeof raw !== 'string') return fallback;
  const cleaned = raw
    .replace(/[\\/:*?"<>|\x00-\x1f]/g, '')
    .replace(/\.+$/g, '')
    .trim()
    .slice(0, 100);
  return cleaned || fallback;
};

const FORMATS = {
  pdf:  { ext: 'pdf',  mime: 'application/pdf' },
  docx: { ext: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  txt:  { ext: 'txt',  mime: 'text/plain; charset=utf-8' },
};

// Extract template + photo + format + filename from request body or query
const readExportOptions = (req) => {
  const src = (req.method === 'POST' ? req.body : req.query) || {};
  const rawFormat = typeof src.format === 'string' ? src.format.toLowerCase() : 'pdf';
  const format = FORMATS[rawFormat] ? rawFormat : 'pdf';
  return {
    template: typeof src.template === 'string' ? src.template : undefined,
    photo: typeof src.photo === 'string' ? src.photo : null,
    format,
    filename: sanitizeFilename(src.filename),
  };
};

// GET/POST /api/cv/download/:cv_id — Generate and stream the CV in the
// requested format (PDF / DOCX / TXT).
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
    const fmt = FORMATS[opts.format];

    let buffer;
    if (opts.format === 'docx') {
      buffer = await generateCVDocxBuffer(finalCV);
    } else if (opts.format === 'txt') {
      buffer = Buffer.from(generateCVTxt(finalCV), 'utf-8');
    } else {
      buffer = await generateCVPdfBuffer(finalCV, opts);
    }

    res.set({
      'Content-Type': fmt.mime,
      'Content-Disposition': `attachment; filename="${opts.filename}.${fmt.ext}"`,
      'Content-Length': buffer.length,
    });

    return res.send(buffer);
  } catch (err) {
    console.error('CV download error:', err.message);
    return res.status(500).json({ error: 'Failed to generate file' });
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

// POST /api/cv/patch — Direct field update, no AI involved. Used by the
// QuickEditBox fast-path for atomic edits the frontend can detect
// deterministically (bare LinkedIn URL, email, phone). Whitelist of allowed
// fields prevents arbitrary structured writes from the client.
const patchCV = async (req, res) => {
  try {
    const { cv_id, patch } = req.body;

    if (!cv_id || !patch || typeof patch !== 'object') {
      return res.status(400).json({ error: 'cv_id and patch are required' });
    }

    const ALLOWED_FIELDS = ['full_name', 'email', 'phone', 'location', 'linkedin'];
    const cleanPatch = {};
    for (const key of ALLOWED_FIELDS) {
      if (typeof patch[key] === 'string') {
        const value = patch[key].trim();
        if (value.length > 0 && value.length <= 500) cleanPatch[key] = value;
      }
    }
    if (Object.keys(cleanPatch).length === 0) {
      return res.status(400).json({ error: 'No valid fields to patch' });
    }

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
      return res.status(400).json({ error: 'No CV data to patch' });
    }

    const updatedCV = { ...currentFinalCV, ...cleanPatch };
    const updatedFeedback = {
      ...cv.ats_feedback,
      final: { ...cv.ats_feedback.final, final_cv: updatedCV },
    };

    const { error: updateError } = await supabase
      .from('cvs')
      .update({ ats_feedback: updatedFeedback })
      .eq('id', cv_id)
      .eq('user_id', req.user.id);

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    const labels = { full_name: 'name', email: 'email', phone: 'phone', location: 'location', linkedin: 'LinkedIn URL' };
    return res.status(200).json({
      final_cv: updatedCV,
      changes_applied: Object.keys(cleanPatch).map((k) => `Updated ${labels[k] || k}`),
    });
  } catch (err) {
    console.error('CV patch error:', err.message);
    return res.status(500).json({ error: err.message || 'CV patch failed' });
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

    // Beyond name, require that at least ONE meaningful section has
    // real content — otherwise users submit {full_name: "X"} and burn
    // a CV quota slot on an empty PDF that has nothing to render.
    const hasExperience = Array.isArray(cv.experience) && cv.experience.some(
      (e) => (e?.title && String(e.title).trim()) ||
             (e?.company && String(e.company).trim()) ||
             (Array.isArray(e?.bullets) && e.bullets.some((b) => b && String(b).trim()))
    );
    const hasEducation = Array.isArray(cv.education) && cv.education.some(
      (e) => (e?.degree && String(e.degree).trim()) ||
             (e?.institution && String(e.institution).trim())
    );
    const hasSkills = Array.isArray(cv.skills) && cv.skills.some((s) => s && String(s).trim());
    const hasSummary = typeof cv.summary === 'string' && cv.summary.trim().length >= 20;
    if (!hasExperience && !hasEducation && !hasSkills && !hasSummary) {
      return res.status(400).json({
        error: 'Please fill in at least one section (experience, education, skills, or a summary).',
        code: 'cv_empty',
      });
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
      languages: Array.isArray(cv.languages)
        ? cv.languages
            .map((l) => {
              if (!l) return null;
              if (typeof l === 'string') return { name: l.trim() };
              const name = String(l.name || '').trim();
              const level = String(l.level || '').trim();
              if (!name) return null;
              return level ? { name, level } : { name };
            })
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

module.exports = { analyzeCV, createCV, getCVHistory, deleteCVRecord, downloadCVPdf, previewCVPdf, refineCV, patchCV };
