// Promo Code Controller
// Handles promo code validation (user-facing) and CRUD (admin-facing)

const supabase = require('../services/supabaseClient');

// POST /api/promo/validate — Validate a promo code and return discount info
const validatePromo = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Promo code is required' });

    const { data: promo, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('is_active', true)
      .single();

    if (error || !promo) {
      return res.status(404).json({ error: 'Invalid promo code' });
    }

    // Check expiry
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return res.status(400).json({ error: 'This promo code has expired' });
    }

    // Check max uses
    if (promo.max_uses && promo.times_used >= promo.max_uses) {
      return res.status(400).json({ error: 'This promo code has reached its usage limit' });
    }

    // Check if user already used this code
    const { data: existing } = await supabase
      .from('promo_code_usage')
      .select('id')
      .eq('promo_code_id', promo.id)
      .eq('user_id', req.user.id)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'You have already used this promo code' });
    }

    return res.json({
      valid: true,
      promo: {
        id: promo.id,
        code: promo.code,
        discount_type: promo.discount_type,
        discount_amount: parseFloat(promo.discount_amount),
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ─── ADMIN ENDPOINTS ───────────────────────────────────────

// GET /api/admin/promos — List all promo codes
const listPromos = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.json({ promos: data || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// POST /api/admin/promos — Create a promo code
const createPromo = async (req, res) => {
  try {
    const { code, discount_type, discount_amount, max_uses, expires_at } = req.body;

    if (!code || !discount_type || !discount_amount) {
      return res.status(400).json({ error: 'Code, discount type, and amount are required' });
    }

    if (!['percent', 'fixed'].includes(discount_type)) {
      return res.status(400).json({ error: 'Discount type must be "percent" or "fixed"' });
    }

    if (discount_type === 'percent' && (discount_amount < 1 || discount_amount > 100)) {
      return res.status(400).json({ error: 'Percent discount must be between 1 and 100' });
    }

    const { data, error } = await supabase
      .from('promo_codes')
      .insert({
        code: code.toUpperCase().trim(),
        discount_type,
        discount_amount,
        max_uses: max_uses || null,
        expires_at: expires_at || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return res.status(400).json({ error: 'A promo code with this name already exists' });
      // 42501 = insufficient_privilege, which is what Postgres returns
      // for a row-level-security rejection. Surface an admin-friendly
      // message telling them exactly which migration to run, instead
      // of leaking the raw PostgreSQL error to the client.
      if (error.code === '42501' || /row-level security/i.test(error.message || '')) {
        console.error('promo create RLS violation:', error.message);
        return res.status(500).json({
          error: 'Database policy blocked this write. Run backend/src/database/fix-promo-rls.sql in the Supabase SQL editor, then retry.',
          code: 'rls_blocked',
        });
      }
      throw error;
    }

    return res.status(201).json({ promo: data });
  } catch (err) {
    console.error('createPromo error:', err.message);
    return res.status(500).json({ error: 'Could not create promo code' });
  }
};

// PUT /api/admin/promos/:id — Update a promo code
const updatePromo = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('promo_codes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return res.json({ promo: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// DELETE /api/admin/promos/:id — Delete a promo code
const deletePromo = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('promo_codes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return res.json({ message: 'Promo code deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// GET /api/promo/banner — Public: return the most recent active promo for the landing page banner
const getActiveBanner = async (req, res) => {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('promo_codes')
      .select('code, discount_type, discount_amount, expires_at')
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return res.json({ banner: null });
    }

    // Check max uses
    // (we already filtered active, but let's also check usage via a separate query is overkill for a banner)
    return res.json({
      banner: {
        code: data.code,
        discount_type: data.discount_type,
        discount_amount: parseFloat(data.discount_amount),
        expires_at: data.expires_at,
      },
    });
  } catch (err) {
    return res.json({ banner: null });
  }
};

module.exports = { validatePromo, listPromos, createPromo, updatePromo, deletePromo, getActiveBanner };
