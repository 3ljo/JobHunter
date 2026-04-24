// Onboarding controller
// Handles career preferences collected after first login

const supabase = require('../services/supabaseClient');

// Get the authenticated user's onboarding data
const getOnboarding = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('onboarding')
      .select('*')
      .eq('user_id', req.user.id)
      .maybeSingle();

    // Missing row is a normal state (fresh users). Return 200 with null
    // so the frontend doesn't have to treat 404 as a happy path.
    if (error) {
      console.error('getOnboarding error:', error.message);
      return res.status(500).json({ error: 'Could not load onboarding' });
    }
    return res.status(200).json({ onboarding: data || null });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Accepted value sets. Anything outside is rejected so a malformed or
// malicious client can't poison the row (this is used across the app
// for CV analysis context, so a garbage value would degrade quality).
const CAREER_LEVELS = ['entry', 'mid', 'senior', 'lead', 'executive', 'student', 'intern'];
const JOB_TYPES = ['full_time', 'part_time', 'contract', 'freelance', 'internship', 'remote', 'hybrid', 'onsite'];

const trimStr = (v, max) => {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  if (!t) return null;
  return t.length > max ? t.slice(0, max) : t;
};

const trimStrArray = (v, maxItems, maxLen) => {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => trimStr(x, maxLen))
    .filter(Boolean)
    .slice(0, maxItems);
};

// Save or update onboarding data (upsert)
const saveOnboarding = async (req, res) => {
  const body = req.body || {};

  // Schema validation — accept only known fields with shape + length
  // caps. Previously we spread whatever the client sent directly into
  // the upsert, so any extra keys (or 1MB strings) would try to persist.
  const job_title = trimStr(body.job_title, 120);
  const career_level = typeof body.career_level === 'string' && CAREER_LEVELS.includes(body.career_level)
    ? body.career_level
    : null;
  const job_type = typeof body.job_type === 'string' && JOB_TYPES.includes(body.job_type)
    ? body.job_type
    : null;
  const preferred_locations = trimStrArray(body.preferred_locations, 20, 80);
  const preferred_industries = trimStrArray(body.preferred_industries, 20, 80);
  const skills = trimStrArray(body.skills, 50, 60);

  if (career_level === null && typeof body.career_level === 'string' && body.career_level.length > 0) {
    return res.status(400).json({ error: `career_level must be one of: ${CAREER_LEVELS.join(', ')}` });
  }
  if (job_type === null && typeof body.job_type === 'string' && body.job_type.length > 0) {
    return res.status(400).json({ error: `job_type must be one of: ${JOB_TYPES.join(', ')}` });
  }

  try {
    const { data, error } = await supabase
      .from('onboarding')
      .upsert({
        user_id: req.user.id,
        job_title,
        career_level,
        job_type,
        preferred_locations,
        preferred_industries,
        skills,
        is_completed: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('saveOnboarding error:', error.message);
      return res.status(400).json({ error: 'Could not save onboarding' });
    }

    return res.status(200).json({ message: 'Onboarding saved', onboarding: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { getOnboarding, saveOnboarding };
