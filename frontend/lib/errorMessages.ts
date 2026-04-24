// Human-friendly error-message mapping.
//
// Backend error responses have two shapes we care about:
//   { error: "human string", code?: "machine_code" }
// or a plain 500 with a raw Supabase/Stripe message.
//
// Rules:
//   1. If a `code` is present, look it up here. Server-defined codes
//      are stable — UI copy belongs with the client, so the backend
//      owns the machine code and we own the marketing tone.
//   2. If no code but the `error` string looks user-facing (short,
//      no SQL/stack), pass it through.
//   3. Otherwise fall back to the generic message for the context.
//
// Consumers: register/login pages, checkout flow, settings actions.
// Do NOT surface a raw backend string to users — that's how we end
// up with "PostgrestError: duplicate key value violates unique
// constraint" showing as a toast.

const FRIENDLY: Record<string, string> = {
  email_exists: 'An account with this email already exists. Try signing in instead.',
  email_not_confirmed: 'Please verify your email first — check your inbox for the link.',
  jd_too_short: 'Your job description is too short. Paste at least 20 characters.',
  jd_too_long: 'Your job description is too long. Trim it down (max 15,000 characters).',
  cv_empty: 'Please fill in at least one section — experience, education, skills, or summary.',
  plan_required: 'This feature is on a higher plan. Upgrade to unlock it.',
  plan_check_unavailable: 'We had trouble checking your plan. Please try again in a moment.',
  rate_limit_unavailable: 'Service is warming up. Please try again in a moment.',
  rate_limited: 'Too many attempts. Please wait a few minutes before trying again.',
  payout_in_progress: 'You already have a payout in progress. Wait for it to complete.',
  payment_provider_unavailable: 'Payment provider is temporarily unavailable. Try again or contact support.',
  checkout_failed: "We couldn't start checkout. Please try again.",
};

const GENERIC_FALLBACKS: Record<string, string> = {
  register: "We couldn't create your account. Please try again.",
  login: "We couldn't sign you in. Please check your credentials and try again.",
  verify: "We couldn't send the verification email. Please try again.",
  password_reset: "We couldn't reset your password. The link may have expired.",
  upload: "We couldn't upload your file. Please try again.",
  analyze: "We couldn't analyze your CV. Please try again.",
  generate: "We couldn't generate that. Please try again.",
  save: "We couldn't save your changes. Please try again.",
  payment: "We couldn't process that. Please try again or contact support.",
  generic: 'Something went wrong. Please try again.',
};

function looksTechnical(msg: string): boolean {
  if (!msg) return true;
  if (msg.length > 180) return true;
  // Supabase/Postgres error shapes we never want to surface raw.
  return /postgres|supabase|stack|traceback|syntax error|duplicate key|violates|ECONNREFUSED|ETIMEDOUT|\bSQL\b/i.test(msg);
}

export type ErrorContext = keyof typeof GENERIC_FALLBACKS;

/**
 * Convert an axios error (or anything with response.data) into a
 * friendly message suitable for a toast.
 */
export function friendlyError(err: any, context: ErrorContext = 'generic'): string {
  const data = err?.response?.data;
  const code: string | undefined = data?.code;
  if (code && FRIENDLY[code]) return FRIENDLY[code];

  const raw: string | undefined = typeof data?.error === 'string' ? data.error : undefined;
  if (raw && !looksTechnical(raw)) return raw;

  return GENERIC_FALLBACKS[context] || GENERIC_FALLBACKS.generic;
}
