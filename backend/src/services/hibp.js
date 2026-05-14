// Have-I-Been-Pwned password range API check.
// k-anonymity: we send the first 5 chars of the SHA-1 and HIBP
// returns every hash that starts with those 5 chars + an occurrence
// count. The full password and full hash never leave this server.
//
// Free, no API key needed. We fail open (treat as not-pwned) on
// network error so an HIBP outage doesn't block signups.

const crypto = require('crypto');
const https = require('https');

const HIBP_HOST = 'api.pwnedpasswords.com';
const TIMEOUT_MS = 2000;

function sha1Upper(input) {
  return crypto.createHash('sha1').update(input, 'utf8').digest('hex').toUpperCase();
}

function fetchRange(prefix) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      {
        host: HIBP_HOST,
        path: `/range/${prefix}`,
        headers: { 'User-Agent': 'cvclimber-auth-check' },
        timeout: TIMEOUT_MS,
      },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HIBP returned ${res.statusCode}`));
        }
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolve(body));
      }
    );
    req.on('timeout', () => {
      req.destroy(new Error('HIBP request timed out'));
    });
    req.on('error', reject);
  });
}

// Returns the breach count for `password`, or 0 if not found.
// Returns 0 (fail-open) on any network/parse error.
async function pwnedCount(password) {
  try {
    const hash = sha1Upper(password);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);
    const body = await fetchRange(prefix);
    for (const line of body.split('\n')) {
      const idx = line.indexOf(':');
      if (idx === -1) continue;
      if (line.slice(0, idx).trim().toUpperCase() === suffix) {
        return parseInt(line.slice(idx + 1).trim(), 10) || 0;
      }
    }
    return 0;
  } catch {
    return 0;
  }
}

module.exports = { pwnedCount };
