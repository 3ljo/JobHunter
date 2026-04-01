// Profile controller
// Handles user profile CRUD operations

const supabase = require('../services/supabaseClient');

// Get the authenticated user's profile
const getProfile = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    return res.status(200).json({ profile: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Update the authenticated user's profile (upsert)
const updateProfile = async (req, res) => {
  const { full_name, location, linkedin_url, website_url, avatar_url } = req.body;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: req.user.id,
        email: req.user.email,
        full_name,
        location,
        linkedin_url,
        website_url,
        avatar_url,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ message: 'Profile updated', profile: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Create a minimal profile (called internally after registration)
const createProfile = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: req.user.id,
        email: req.user.email,
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({ profile: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { getProfile, updateProfile, createProfile };
