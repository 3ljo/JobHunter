// Job Tracker Controller
// Handles CRUD operations for tracked job applications and stats

const supabase = require('../services/supabaseClient');

const VALID_STATUSES = ['applied', 'interview', 'offer', 'rejected', 'saved'];

// GET — Retrieve all jobs for the authenticated user
const getAllJobs = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('job_tracker')
      .select('*')
      .eq('user_id', req.user.id)
      .order('applied_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ jobs: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// POST — Add a new job to the tracker
const addJob = async (req, res) => {
  const { company_name, job_title, job_url, status, notes, applied_at } = req.body;

  if (!company_name || !job_title) {
    return res.status(400).json({ error: 'company_name and job_title are required' });
  }

  const jobStatus = status || 'applied';
  if (!VALID_STATUSES.includes(jobStatus)) {
    return res.status(400).json({ error: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  try {
    const { data, error } = await supabase
      .from('job_tracker')
      .insert({
        user_id: req.user.id,
        company_name,
        job_title,
        job_url: job_url || null,
        status: jobStatus,
        notes: notes || null,
        applied_at: applied_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({ message: 'Job added', job: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// PUT — Update an existing tracked job
const updateJob = async (req, res) => {
  const { job_id } = req.params;
  const { company_name, job_title, job_url, status, notes, applied_at } = req.body;

  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  try {
    // Verify the job belongs to the authenticated user
    const { data: existing, error: fetchError } = await supabase
      .from('job_tracker')
      .select('id')
      .eq('id', job_id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Build update object with only provided fields
    const updates = {};
    if (company_name !== undefined) updates.company_name = company_name;
    if (job_title !== undefined) updates.job_title = job_title;
    if (job_url !== undefined) updates.job_url = job_url;
    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.notes = notes;
    if (applied_at !== undefined) updates.applied_at = applied_at;

    const { data, error } = await supabase
      .from('job_tracker')
      .update(updates)
      .eq('id', job_id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ message: 'Job updated', job: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// DELETE — Remove a tracked job
const deleteJob = async (req, res) => {
  const { job_id } = req.params;

  try {
    // Verify the job belongs to the authenticated user
    const { data: existing, error: fetchError } = await supabase
      .from('job_tracker')
      .select('id')
      .eq('id', job_id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const { error } = await supabase
      .from('job_tracker')
      .delete()
      .eq('id', job_id)
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ message: 'Job deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// GET — Job application stats grouped by status
const getJobStats = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('job_tracker')
      .select('status')
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Count jobs by status
    const stats = {
      total: data.length,
      applied: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
      saved: 0,
    };

    for (const job of data) {
      if (stats[job.status] !== undefined) {
        stats[job.status]++;
      }
    }

    return res.status(200).json({ stats });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { getAllJobs, addJob, updateJob, deleteJob, getJobStats };
