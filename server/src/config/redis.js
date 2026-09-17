import Redis from 'ioredis';
import { logger } from '../utils/logger.js';

/**
 * Attempts to connect to Redis. Resolves with a ready client, or `null` if
 * `url` is unset or the server cannot be reached within `timeoutMs`. The caller
 * decides how to degrade (see services/rateLimiter/index.js) — this module
 * never hides a failure.
 */
export async function connectRedis(url, { timeoutMs = 3000 } = {}) {
  if (!url) return null;

  const client = new Redis(url, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    connectTimeout: timeoutMs,
    retryStrategy: (attempt) => Math.min(attempt * 200, 2000),
  });

  client.on('error', (err) => logger.warn({ err: err.message }, 'redis error'));
  client.on('reconnecting', () => logger.warn('redis reconnecting'));

  try {
    await client.connect();
    await client.ping();
    logger.info({ url: redactUrl(url) }, 'redis connected');
    return client;
  } catch (err) {
    logger.error({ err: err.message, url: redactUrl(url) }, 'redis unavailable');
    client.disconnect();
    return null;
  }
}

function redactUrl(url) {
  try {
    const u = new URL(url);
    if (u.password) u.password = '***';
    return u.toString();
  } catch {
    return url;
  }
}
