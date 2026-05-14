// Gift-a-Pass — $9 one-time purchase where the buyer gives a recipient
// 7 days of 7-Day Pass access. Reuses the Starter variant in LS; the
// order fires `order_created` with custom_data.gift=true, which the
// subscription webhook routes into gifted_passes instead of granting
// the pass to the buyer.

const supabase = require('../services/supabaseClient');
const { PLANS } = require('../services/stripeService');
const ls = require('../services/lemonSqueezyService');

function canonicalFrontend() {
  const raw = process.env.FRONTEND_URL || '';
  const first = raw.split(',')[0].trim();
  return first.replace(/\/$/, '');
}

// POST /api/gift/checkout — create a LS hosted checkout for a gifted pass.
// Body: { recipient_email, message? }
const createGiftCheckout = async (req, res) => {
  try {
    const { recipient_email, message } = req.body || {};
    const recipient = (recipient_email || '').toLowerCase().trim();
    if (!recipient || !/^\S+@\S+\.\S+$/.test(recipient)) {
      return res.status(400).json({ error: 'Valid recipient_email is required' });
    }

    // Can't gift a pass to yourself.
    if (req.user?.email && req.user.email.toLowerCase() === recipient) {
      return res.status(400).json({ error: 'You cannot gift a pass to your own email' });
    }

    // Prevent double-gifting the same recipient.
    const { data: existing } = await supabase
      .from('gifted_passes')
      .select('id, redeemed')
      .ilike('recipient_email', recipient)
      .maybeSingle();
    if (existing) {
      return res.status(409).json({
        error: existing.redeemed
          ? 'This recipient has already redeemed a gifted pass.'
          : 'A gift pass for this recipient already exists. Ask them to check their email.',
      });
    }

    const variantId = ls.getVariantId('starter', 'once');
    if (!variantId) {
      return res.status(500).json({
        error: 'Gift checkout not configured — LEMONSQUEEZY_VARIANT_STARTER_PASS missing.',
      });
    }

    const successUrl = `${canonicalFrontend()}/gift/success`;
    const url = await ls.createCheckout({
      variantId,
      userId: req.user.id,
      email: req.user.email,
      plan: 'starter',
      interval: 'once',
      successUrl,
      custom: {
        user_id: req.user.id,
        plan: 'starter',
        interval: 'once',
        gift: true,
        recipient_email: recipient,
        gift_message: (message || '').slice(0, 500),
      },
    });

    return res.json({ url });
  } catch (err) {
    console.error('gift checkout error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

// GET /api/gift/:code — public lookup. Returns minimal info so the
// /redeem page can render something useful before the recipient signs in.
const lookupGift = async (req, res) => {
  try {
    const passCode = String(req.params.code || '').toUpperCase().trim();
    if (!passCode) return res.status(400).json({ error: 'pass code required' });

    const { data } = await supabase
      .from('gifted_passes')
      .select('id, recipient_email, message, redeemed, created_at')
      .eq('pass_code', passCode)
      .maybeSingle();

    if (!data) return res.status(404).json({ error: 'Gift not found' });

    return res.json({
      recipient_email: data.recipient_email,
      message: data.message,
      redeemed: data.redeemed,
      created_at: data.created_at,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// POST /api/gift/:code/redeem — the recipient (authenticated) redeems
// the pass. Verifies:
//   - gift not already redeemed
//   - logged-in user's email matches recipient_email (case-insensitive)
// Grants a 7-day Pass via the subscriptions table.
const redeemGift = async (req, res) => {
  try {
    const passCode = String(req.params.code || '').toUpperCase().trim();
    const { data: gift } = await supabase
      .from('gifted_passes')
      .select('*')
      .eq('pass_code', passCode)
      .maybeSingle();

    if (!gift) return res.status(404).json({ error: 'Gift not found' });
    if (gift.redeemed) return res.status(409).json({ error: 'This gift has already been redeemed' });

    const userEmail = (req.user.email || '').toLowerCase();
    if (userEmail !== gift.recipient_email.toLowerCase()) {
      return res.status(403).json({
        error: `This gift is addressed to ${gift.recipient_email}. Sign in with that email to redeem.`,
      });
    }

    const durationDays = PLANS.starter?.pass_duration_days || 7;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    await supabase.from('subscriptions').upsert(
      {
        user_id: req.user.id,
        plan: 'starter',
        billing_interval: 'once',
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: expiresAt.toISOString(),
        cancel_at_period_end: false,
      },
      { onConflict: 'user_id' }
    );

    await supabase
      .from('gifted_passes')
      .update({
        redeemed: true,
        redeemed_at: now.toISOString(),
        redeemed_by_user_id: req.user.id,
      })
      .eq('id', gift.id);

    return res.json({
      ok: true,
      expires_at: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error('redeem gift error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { createGiftCheckout, lookupGift, redeemGift };
