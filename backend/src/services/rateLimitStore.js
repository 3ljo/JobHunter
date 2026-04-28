// Sliding-window rate-limit store with optional Redis backing.
//
// If REDIS_URL is set, hits are stored in a Redis sorted set keyed
// by `ratelimit:<key>` — survives process restarts and is shared
// across instances when the backend scales out. Without Redis, we
// fall back to an in-memory Map keyed by string. The in-memory mode
// is single-process only; on Render single-instance it gives a
// cheap brute-force floor but quietly turns into "n × limit" the
// moment you autoscale, so REDIS_URL should be configured before
// you ever enable horizontal scaling.

let redisClient = null;
let redisReady = false;

(async () => {
  if (!process.env.REDIS_URL) return;
  try {
    // Lazy-require so the dep stays optional.
    // eslint-disable-next-line global-require
    const { createClient } = require('redis');
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on('error', (err) => {
      console.error('[rateLimitStore] redis error', err);
    });
    await redisClient.connect();
    redisReady = true;
    console.log('[rateLimitStore] connected to Redis');
  } catch (err) {
    console.error(
      '[rateLimitStore] failed to connect to Redis, falling back to in-memory:',
      err.message
    );
    redisClient = null;
    redisReady = false;
  }
})();

const memHits = new Map(); // key -> [{ ts }]

function memCheck(key, windowMs, maxHits, now) {
  const list = (memHits.get(key) || []).filter((h) => now - h.ts < windowMs);
  if (list.length >= maxHits) {
    const oldest = list[0].ts;
    memHits.set(key, list);
    return { allowed: false, retryAfterSec: Math.ceil((windowMs - (now - oldest)) / 1000) };
  }
  list.push({ ts: now });
  memHits.set(key, list);
  return { allowed: true };
}

async function redisCheck(key, windowMs, maxHits, now) {
  const redisKey = `ratelimit:${key}`;
  const cutoff = now - windowMs;
  const member = `${now}:${Math.random().toString(36).slice(2, 10)}`;
  // Drop expired entries, count remaining, push self, set TTL.
  const multi = redisClient.multi();
  multi.zRemRangeByScore(redisKey, 0, cutoff);
  multi.zCard(redisKey);
  multi.zAdd(redisKey, [{ score: now, value: member }]);
  multi.pExpire(redisKey, windowMs);
  const [, count] = await multi.exec();
  if ((count || 0) >= maxHits) {
    // We already added our own entry above; if over the limit, find
    // the oldest legitimate hit to compute Retry-After, then remove
    // our own marker so we don't permanently inflate the bucket.
    await redisClient.zRem(redisKey, member);
    const oldest = await redisClient.zRange(redisKey, 0, 0, { BY: 'SCORE' });
    const oldestTs = oldest && oldest[0] ? Number(oldest[0].split(':')[0]) : now;
    return {
      allowed: false,
      retryAfterSec: Math.ceil((windowMs - (now - oldestTs)) / 1000),
    };
  }
  return { allowed: true };
}

// Returns { allowed: boolean, retryAfterSec?: number }.
async function check(key, windowMs, maxHits) {
  const now = Date.now();
  if (redisReady && redisClient) {
    try {
      return await redisCheck(key, windowMs, maxHits, now);
    } catch (err) {
      console.error('[rateLimitStore] redis check failed, falling back to memory:', err.message);
    }
  }
  return memCheck(key, windowMs, maxHits, now);
}

module.exports = { check };
