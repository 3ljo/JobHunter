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
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Onboarding not found' });
    }

    return res.status(200).json({ onboarding: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Save or update onboarding data (upsert)
const saveOnboarding = async (req, res) => {
  const { job_title, career_level, job_type, preferred_locations, preferred_industries, skills } = req.body;

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
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ message: 'Onboarding saved', onboarding: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { getOnboarding, saveOnboarding };
