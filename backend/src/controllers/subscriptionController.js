// Subscription Controller
// Handles Stripe checkout, portal, webhook, and subscription status

const supabase = require('../services/supabaseClient');
const { stripe, PLANS, getPlanLimits } = require('../services/stripeService');

// GET /api/subscription — Get the user's current subscription
const getSubscription = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error || !data) {
      // No subscription record — user is on free plan
      return res.json({
        subscription: {
          plan: 'free',
          status: 'active',
          billing_interval: null,
          current_period_end: null,
          cancel_at_period_end: false,
        },
        limits: getPlanLimits('free'),
      });
    }

    return res.json({
      subscription: data,
      limits: getPlanLimits(data.plan),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// POST /api/subscription/checkout — Create a Stripe Checkout session
const createCheckout = async (req, res) => {
  try {
    const { plan, interval, payment_method } = req.body; // plan: 'pro' | 'pro_plus', interval: 'month' | 'year', payment_method: 'card' | 'paypal' | 'bank_transfer'

    if (!plan || !PLANS[plan] || plan === 'free') {
      return res.status(400).json({ error: 'Invalid plan' });
    }
    if (!interval || !['month', 'year'].includes(interval)) {
      return res.status(400).json({ error: 'Invalid billing interval' });
    }

    const priceId = PLANS[plan].prices[interval];
    if (!priceId || priceId === 'price_REPLACE_ME') {
      return res.status(400).json({ error: 'Stripe price not configured for this plan. Add your Stripe Price IDs to .env' });
    }

    // Find or create Stripe customer
    let customerId;
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', req.user.id)
      .single();

    if (existing?.stripe_customer_id) {
      customerId = existing.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: req.user.email,
        metadata: { user_id: req.user.id },
      });
      customerId = customer.id;

      // Upsert subscription record with customer ID
      await supabase.from('subscriptions').upsert({
        user_id: req.user.id,
        stripe_customer_id: customerId,
        plan: 'free',
        status: 'active',
      }, { onConflict: 'user_id' });
    }

    // Map payment method to Stripe payment_method_types
    const methodMap = {
      card: ['card'],
      paypal: ['paypal'],
    };
    const paymentMethodTypes = methodMap[payment_method] || ['card'];

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: paymentMethodTypes,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/checkout/success`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing?checkout=canceled`,
      metadata: { user_id: req.user.id, plan, interval },
    });

    return res.json({ url: session.url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// POST /api/subscription/portal — Create a Stripe Customer Portal session
const createPortal = async (req, res) => {
  try {
    const { data } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', req.user.id)
      .single();

    if (!data?.stripe_customer_id) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/settings`,
    });

    return res.json({ url: session.url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// POST /api/subscription/webhook — Stripe webhook handler (no auth middleware)
const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata.user_id;
        const plan = session.metadata.plan;
        const interval = session.metadata.interval;
        const subscriptionId = session.subscription;

        // Fetch the subscription to get period dates
        const sub = await stripe.subscriptions.retrieve(subscriptionId);

        await supabase.from('subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: session.customer,
          stripe_subscription_id: subscriptionId,
          plan,
          billing_interval: interval,
          status: sub.status,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
        }, { onConflict: 'user_id' });

        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const customerId = sub.customer;

        // Look up user by Stripe customer ID
        const { data: record } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (record) {
          // Determine plan from the price ID
          const priceId = sub.items.data[0]?.price?.id;
          const plan = resolvePlanFromPriceId(priceId);
          const interval = sub.items.data[0]?.price?.recurring?.interval || 'month';

          await supabase.from('subscriptions').update({
            stripe_subscription_id: sub.id,
            plan,
            billing_interval: interval,
            status: sub.status,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
          }).eq('user_id', record.user_id);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const customerId = sub.customer;

        const { data: record } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (record) {
          await supabase.from('subscriptions').update({
            plan: 'free',
            status: 'canceled',
            stripe_subscription_id: null,
            cancel_at_period_end: false,
          }).eq('user_id', record.user_id);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        const { data: record } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (record) {
          await supabase.from('subscriptions').update({
            status: 'past_due',
          }).eq('user_id', record.user_id);
        }
        break;
      }
    }
  } catch (err) {
    console.error('Webhook processing error:', err.message);
  }

  // Always return 200 so Stripe doesn't retry
  res.json({ received: true });
};

// Helper — resolve internal plan name from a Stripe Price ID
function resolvePlanFromPriceId(priceId) {
  if (!priceId) return 'free';
  for (const [planKey, config] of Object.entries(PLANS)) {
    if (config.prices) {
      if (config.prices.month === priceId || config.prices.year === priceId) {
        return planKey;
      }
    }
  }
  return 'free';
}

module.exports = { getSubscription, createCheckout, createPortal, handleWebhook };
