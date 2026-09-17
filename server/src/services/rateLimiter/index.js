import { connectRedis } from '../../config/redis.js';
import { logger } from '../../utils/logger.js';
import { MemoryRateLimitStore } from './MemoryRateLimitStore.js';
import { RedisRateLimitStore } from './RedisRateLimitStore.js';

/**
 * Chooses the rate-limit backend at boot.
 *
 * Redis is the intended production store. If REDIS_URL is missing or the server
 * is unreachable we fall back to the in-memory implementation, but loudly:
 * an error-level log line at startup and `rateLimitStore: "memory-fallback"`
 * on GET /health, so the degradation can never go unnoticed.
 *
 * @returns {Promise<import('./RateLimitStore.js').RateLimitStore>}
 */
export async function createRateLimitStore({ redisUrl }) {
  const redis = await connectRedis(redisUrl);
  if (redis) return new RedisRateLimitStore(redis);

  logger.error(
    redisUrl
      ? 'Redis unreachable — using IN-MEMORY rate-limit store. Limits are per-process and reset on restart.'
      : 'REDIS_URL not set — using IN-MEMORY rate-limit store. Limits are per-process and reset on restart.',
  );
  return new MemoryRateLimitStore();
}

export { MemoryRateLimitStore, RedisRateLimitStore };
