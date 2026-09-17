import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SCRIPT = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'slidingWindow.lua'), 'utf8');

/**
 * Sliding-window-log rate limiter backed by Redis sorted sets.
 * See slidingWindow.lua for the algorithm; this class only handles transport.
 *
 * ioredis `defineCommand` registers the script once (EVALSHA with automatic
 * SCRIPT LOAD fallback), so each `hit` is a single round-trip.
 *
 * @implements {import('./RateLimitStore.js').RateLimitStore}
 */
export class RedisRateLimitStore {
  kind = 'redis';

  /** @param {import('ioredis').Redis} redis */
  constructor(redis) {
    this.redis = redis;
    if (!this.redis.slidingWindowHit) {
      this.redis.defineCommand('slidingWindowHit', { numberOfKeys: 1, lua: SCRIPT });
    }
  }

  async hit(key, limit, windowMs, nowMs = Date.now()) {
    const member = `${nowMs}-${crypto.randomBytes(6).toString('hex')}`;
    const [allowed, remaining, retryAfterMs, resetAtMs] = await this.redis.slidingWindowHit(
      key,
      limit,
      windowMs,
      nowMs,
      member,
    );
    return {
      allowed: allowed === 1,
      limit,
      remaining: Number(remaining),
      retryAfterMs: Number(retryAfterMs),
      resetAtMs: Number(resetAtMs),
    };
  }

  async reset(key) {
    await this.redis.del(key);
  }

  async close() {
    await this.redis.quit();
  }
}
