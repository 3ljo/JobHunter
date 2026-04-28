// Multi-factor authentication (TOTP) endpoints.
//
// Built on Supabase's MFA primitives. All flows operate on the
// USER-SCOPED Supabase client (built from the caller's access
// token) — the service role can't enroll or verify factors on
// behalf of a user, and we don't want it to.
//
// State machine:
//   POST /enroll          -> returns { factor_id, qr_code, secret }
//                            user scans QR with authenticator app
//   POST /enroll/verify   -> { factor_id, code } -> factor becomes
//                            verified; user now has MFA on their
//                            account. Subsequent logins must clear
//                            a challenge to reach aal2.
//   POST /challenge       -> { factor_id } -> { challenge_id }
//                            (used during login when login() returns
//                             mfa_required:true, AND when stepping up
//                             aal1 -> aal2 to perform a sensitive op)
//   POST /challenge/verify -> { factor_id, challenge_id, code }
//                            -> { access_token } at aal2
//   DELETE /factor/:id    -> requires aal2; removes the factor.

const { body, validationResult } = require('express-validator');
const { createUserClient } = require('../services/supabaseUserClient');
const { setSessionCookie } = require('../middleware/sessionCookie');
const { issueCookie: issueCsrfCookie } = require('../middleware/csrf');

function bearerToken(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

const validate = {
  enroll: [],
  enrollVerify: [
    body('factor_id').isString().notEmpty(),
    body('code').isString().isLength({ min: 6, max: 8 }),
  ],
  challenge: [body('factor_id').isString().notEmpty()],
  challengeVerify: [
    body('factor_id').isString().notEmpty(),
    body('challenge_id').isString().notEmpty(),
    body('code').isString().isLength({ min: 6, max: 8 }),
  ],
};

// Used during login when login() returned `mfa_required: true`.
// The caller hasn't yet been issued cookies — they have only the
// partial (aal1) access_token. This endpoint accepts that token in
// the Authorization header; clients DO NOT need to be authenticated
// via the requireAuth middleware here (they're not yet at a
// session-cookie state). Rate-limited at the route layer.
const challengeLogin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

  const token = bearerToken(req);
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const { factor_id } = req.body;
  try {
    const userClient = createUserClient(token);
    const { data, error } = await userClient.auth.mfa.challenge({ factorId: factor_id });
    if (error || !data) return res.status(400).json({ error: error?.message || 'Challenge failed' });
    return res.status(200).json({ challenge_id: data.id });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const verifyLogin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

  const token = bearerToken(req);
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const { factor_id, challenge_id, code } = req.body;
  try {
    const userClient = createUserClient(token);
    const { data, error } = await userClient.auth.mfa.verify({
      factorId: factor_id,
      challengeId: challenge_id,
      code,
    });
    if (error || !data?.access_token) {
      return res.status(401).json({ error: 'Invalid code' });
    }

    // Issue cookies on the *upgraded* aal2 session.
    setSessionCookie(req, res, data.access_token);
    issueCsrfCookie(req, res);

    // Pull the latest user record (factors etc.) from the new aal2
    // session so the frontend has the fully-resolved profile.
    const userClient2 = createUserClient(data.access_token);
    const { data: meData } = await userClient2.auth.getUser();

    return res.status(200).json({
      user: meData?.user,
      session: { access_token: data.access_token },
    });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid code' });
  }
};

// Authenticated flow — used by a logged-in user to enroll a factor.
const enroll = async (req, res) => {
  try {
    const userClient = createUserClient(req.accessToken);
    const { data, error } = await userClient.auth.mfa.enroll({
      factorType: 'totp',
      issuer: 'CvClimber',
      friendlyName: req.body?.friendly_name || 'Authenticator',
    });
    if (error || !data) return res.status(400).json({ error: error?.message || 'Enroll failed' });
    return res.status(200).json({
      factor_id: data.id,
      qr_code: data.totp.qr_code, // data: URI, ready to render in <img src=...>
      secret: data.totp.secret,
      uri: data.totp.uri,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

// Verify the TOTP enrollment (user typed the 6-digit code from their
// app). On success the factor is marked verified and future logins
// will require it.
const enrollVerify = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

  const { factor_id, code } = req.body;
  try {
    const userClient = createUserClient(req.accessToken);
    const { data: chal, error: chalErr } = await userClient.auth.mfa.challenge({ factorId: factor_id });
    if (chalErr) return res.status(400).json({ error: chalErr.message });
    const { data, error } = await userClient.auth.mfa.verify({
      factorId: factor_id,
      challengeId: chal.id,
      code,
    });
    if (error) return res.status(401).json({ error: 'Invalid code' });

    // Issue the upgraded aal2 cookies — the user just proved
    // possession of the factor.
    if (data?.access_token) {
      setSessionCookie(req, res, data.access_token);
      issueCsrfCookie(req, res);
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

// Aal2 step-up for users who want to upgrade an existing aal1 session
// (e.g. before deleting their account).
const challenge = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

  const { factor_id } = req.body;
  try {
    const userClient = createUserClient(req.accessToken);
    const { data, error } = await userClient.auth.mfa.challenge({ factorId: factor_id });
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ challenge_id: data.id });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const challengeVerify = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

  const { factor_id, challenge_id, code } = req.body;
  try {
    const userClient = createUserClient(req.accessToken);
    const { data, error } = await userClient.auth.mfa.verify({
      factorId: factor_id,
      challengeId: challenge_id,
      code,
    });
    if (error || !data?.access_token) return res.status(401).json({ error: 'Invalid code' });
    setSessionCookie(req, res, data.access_token);
    issueCsrfCookie(req, res);
    return res.status(200).json({ session: { access_token: data.access_token } });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid code' });
  }
};

// Remove a factor. requireAal2 in the route layer enforces that the
// caller has just cleared an MFA challenge — without that, a stolen
// token could trivially disable MFA.
const unenroll = async (req, res) => {
  try {
    const userClient = createUserClient(req.accessToken);
    const { error } = await userClient.auth.mfa.unenroll({ factorId: req.params.factorId });
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

// List the current user's factors — used by the Settings page to
// show enrollment state.
const listFactors = async (req, res) => {
  try {
    const userClient = createUserClient(req.accessToken);
    const { data, error } = await userClient.auth.mfa.listFactors();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ factors: data });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

module.exports = {
  challengeLogin,
  verifyLogin,
  enroll,
  enrollVerify,
  challenge,
  challengeVerify,
  unenroll,
  listFactors,
  validate,
};
