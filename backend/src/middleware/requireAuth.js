// Authentication middleware
// Verifies Bearer token and attaches user to request

const supabase = require('../services/supabaseClient');

const requireAuth = async (req, res, next) => {
  // Extract Bearer token from Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  // Reject if no token provided
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Verify the token with Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Attach verified user to request object
    req.user = data.user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

module.exports = requireAuth;
