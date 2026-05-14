# Auth security hardening — manual config required

The code changes are deployed, but a few of the fixes need configuration in
external systems that I can't reach from here. **Do these before pushing
the new backend to Render**, otherwise the cookie-based auth path will fail
on production.

## 1. Render — backend env vars

Add to the JobHunter service env (Render → service → Environment):

| Var | Value | Why |
|-----|-------|-----|
| `SUPABASE_ANON_KEY` | (from Supabase → Project Settings → API → anon/publishable key) | Required by the new per-request user-scoped Supabase client. Without it, all DB queries silently fall back to the service-role client and RLS doesn't apply — the whole point of fix #8 is lost. |
| `REDIS_URL` | `redis://...` (Upstash, Render Redis, etc.) | Optional. Without it, rate limiting falls back to in-memory and quietly turns into "n × limit" the moment you autoscale. Add a free Upstash Redis instance and paste the connection URL. |
| `NODE_ENV` | `production` | The session cookie flips to `Secure` + `SameSite=None` only when `NODE_ENV=production`. Render usually sets this for you — verify. |

`FRONTEND_URL` should already be a comma-separated list of your allowed
origins (e.g. `https://cvclimber.lol,https://www.cvclimber.lol`). The new
CORS code rejects any origin not in that list — confirm every origin you
expect to serve is listed.

## 2. Supabase dashboard

### Auth → Policies (password strength)
- Set **Minimum password length** to **12**.
- Enable **Check passwords against HaveIBeenPwned**. (We also check this
  in our backend, but enabling it here gives a second layer and rejects
  pwned passwords during Supabase-only flows like the recovery
  `updateUserById` path.)

### Auth → Email
- **OTP expiry / Recovery token TTL**: drop to **5–15 minutes**. Currently
  defaults to 1 hour; if a recovery email is ever forwarded or sits in a
  backup, that's a 60-minute window of full account takeover.
- **Email rate limit**: cap the number of confirmation/recovery emails
  per hour per user (default is generous).

### Auth → URL Configuration
- **Site URL**: `https://cvclimber.lol` (the canonical frontend origin).
- **Redirect URLs**: add every origin the SPA will run on. Must include
  exact matches for `https://cvclimber.lol/auth/callback` and
  `https://cvclimber.lol/reset-password`. If a redirect URL isn't in this
  allow-list, Supabase rejects the auth callback.

### Auth → Multi-Factor Authentication
- **TOTP**: enable. Frontend MFA enrollment UI on the Settings page is
  already wired; users can opt in.
- Consider enforcing MFA for admins specifically (Supabase doesn't have
  a built-in policy for this, but you can gate admin endpoints in code
  using `requireAal2`).

### Auth → SMTP
- Configure a custom SMTP provider (Resend, SendGrid, Postmark) for
  production. Supabase's built-in mailer has tight rate limits and
  occasionally lands in spam. Required for any non-trivial signup volume.

## 3. Cross-origin cookies — domain consideration

The frontend (`cvclimber.lol`) and backend (`jobhunter-r46b.onrender.com`)
live on different parent domains. Browsers send cookies cross-site only
when `SameSite=None; Secure` is set — which the new session cookie does —
but Safari ITP and Firefox ETP can still interfere with third-party
cookies in some configurations.

**Reliable fix:** point a subdomain of cvclimber.lol at the Render
backend, e.g. `api.cvclimber.lol`. Then the cookie becomes first-party
and ITP rules don't apply.

Render → Service → Custom Domains → add `api.cvclimber.lol` → DNS CNAME
to the Render hostname → update the frontend `NEXT_PUBLIC_API_URL` and
backend `FRONTEND_URL` accordingly.

Until then the current setup will work in Chrome/Edge with no caveats,
will work in Firefox in standard mode, and may show intermittent issues
in Safari for users who have third-party cookie blocking on (default).

## 4. Frontend (Vercel) env

If you switch to `api.cvclimber.lol`:
- `NEXT_PUBLIC_API_URL=https://api.cvclimber.lol`

No other frontend env changes are needed — nothing about auth is
configured frontend-side anymore (the token never touches the SPA).

## 5. What changed in this hardening pass — summary

For each finding from your security review, here's where it landed:

| # | Finding | Fix |
|---|---------|-----|
| 1 | Account enumeration | `/register` and `/resend-verification` always return 200 with a generic message; `/login` always returns one generic 401 (silently re-sends the verification email in the background when the email is unconfirmed). Timing jittered. |
| 2 | 6-char password minimum | 12-char floor in `utils/passwordPolicy.js`, plus HIBP breach check, applied consistently to register / reset / change. Strength meter on the register form updated to 12/16/diversity buckets. |
| 3 | `/change-password` had no current-password check | Now requires `current_password`, re-authenticates via `signInWithPassword` before rotating, then `signOut('global')` to kill every other session. Frontend forces re-login after success. |
| 4 | `/reset-password` accepted any session token | Now decodes the JWT and verifies the `amr` claim contains `recovery`. A regular session token (e.g. one lifted via XSS) can no longer rotate the password. |
| 5 | Token in localStorage | Removed entirely. Session is an httpOnly `auth_token` cookie set by the backend; SPA holds only the user object in memory. CSRF protection via double-submit cookie pattern (`csrf_token` cookie + `X-CSRF-Token` header). |
| 6 | In-memory rate limiter | New `rateLimitStore.js` uses Redis when `REDIS_URL` is set, falls back to in-memory otherwise. Email-keyed buckets added on top of the IP-keyed buckets so targeted attacks against one account from a botnet are also throttled. |
| 7 | No backend logout / revoke | New `POST /api/auth/logout` calls `signOut('global')` and clears the cookies. Settings + Navbar buttons now hit it. |
| 8 | Service-role on every request | New `services/supabaseUserClient.js` builds a per-request client scoped to the caller's JWT. MFA controller and `/logout` already use it. **Service-role is still used for genuinely admin operations** (rotate password during recovery, delete user, change-password admin). Other controllers (CV, profile, tracker, etc.) still need to be migrated — see "Follow-up" below. |
| 9 | CORS unspecified | Strict allowlist from `FRONTEND_URL`, mirrors only listed origins, exposes `Retry-After`, allows `X-CSRF-Token`. |
| 10 | Recovery-link TTL too long | Configure in Supabase dashboard (above). |
| 11 | No MFA | Full TOTP enrollment + login challenge flow. Settings card on the frontend, backend gates sensitive ops via `requireAal2`. |
| 12 | Recovery `access_token` in body | Now sent in `Authorization: Bearer <token>` header (no body capture). |

Plus two extras:
- `helmet` baseline headers added (HSTS, no-sniff, X-Frame-Options).
- Generic-error UX on register: the page tells the user "if this email is new, we sent a verification link; if you already have an account, we sent a recovery link" — no enumeration leak, but still a usable path forward for both cases. The backend triggers a recovery email when the email already exists.

## 6. Follow-up work (out of scope for this pass)

These would tighten the system further; flag them if you want them done:

- **Migrate other controllers to the user-scoped Supabase client** —
  `cvController`, `profileController`, `jobTrackerController`,
  `subscriptionController`, etc. all still import the service-role
  `supabaseClient`. RLS won't apply on those routes until they're
  migrated. Use `req.accessToken` (set by `requireAuth`) and
  `createUserClient(req.accessToken)` to construct a scoped client.

- **CSP on the frontend** — the backend Helmet config skips CSP because
  it doesn't ship HTML. The Next.js app should add a CSP header (in
  `next.config.js` or middleware) to restrict script sources.

- **Per-account login alert emails** — when a login from a new IP/UA
  succeeds, email the user. Cheap signal that catches credential
  stuffing even when password + MFA are both compromised.

- **Backup codes for MFA** — Supabase doesn't natively issue MFA backup
  codes. Implement in-app: generate 10 single-use codes at enrollment,
  store hashed in a custom `mfa_backup_codes` table, accept any one as
  an alternative to TOTP at challenge time.

- **Account-deletion confirmation re-auth** — currently `requireAal2`
  protects it (good), but a non-MFA user can delete their account with
  just an active session token. Consider requiring the password to be
  re-entered as well.

- **Audit log table** — record every auth event (login, logout, password
  change, MFA enroll/remove, account delete) with IP/UA. Useful for
  user-facing "recent activity" UI and for incident response.
