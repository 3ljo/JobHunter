// Admin middleware
// Verifies user is authenticated AND is an admin (by email)

const supabase = require('../services/supabaseClient');

const ADMIN_EMAILS = ['shurdhieljo@outlook.com'];

const requireAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!ADMIN_EMAILS.includes(data.user.email)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    req.user = data.user;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

module.exports = requireAdmin;
