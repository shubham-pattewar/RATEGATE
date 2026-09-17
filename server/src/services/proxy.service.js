/**
 * proxy.service.js
 *
 * This is the critical path of RateGate.  For every incoming proxy request:
 *
 *  1. Resolve the registered endpoint (owner-check + active-check, with cache).
 *  2. Run the sliding-window rate-limit check atomically in Redis (or memory).
 *  3. If BLOCKED  → respond 429 immediately, log the rejection.
 *  4. If ALLOWED  → forward the request to the real upstream via undici,
 *                   stream the response back, log the outcome.
 *
 * No rate-limiting npm package is used.  The algorithm runs entirely in
 * slidingWindow.lua (Redis) or MemoryRateLimitStore.js (fallback).
 */

import { fetch, ProxyAgent } from 'undici'; // undici ships with Node ≥18
import { getEndpoint } from './endpoint.service.js';
import { RequestLog } from '../models/RequestLog.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

// Headers we must not forward to the upstream (hop-by-hop).
const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  // RateGate-specific — strip so the upstream never sees the caller's key.
  'x-api-key',
  'host',
]);

// Headers we must not forward back to the client from the upstream.
const UPSTREAM_HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'transfer-encoding',
  'trailer',
  'upgrade',
]);

/**
 * Builds the rate-limit Redis key for a given endpoint + client pair.
 * Convention: rl:<endpointId>:<clientId>
 * This is the same key pattern expected by slidingWindow.lua.
 */
export function buildRateLimitKey(endpointId, clientId) {
  return `rl:${endpointId}:${clientId}`;
}

/**
 * Main proxy handler.  Called by the proxy controller after API-key auth.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {{ rateLimitStore: import('./rateLimiter/RateLimitStore.js').RateLimitStore }} deps
 */
export async function handleProxy(req, res, { rateLimitStore }) {
  const { endpointId } = req.params;
  const { userId, clientId } = req.apiClient;

  // -------------------------------------------------------------------------
  // 1. Resolve endpoint (cache-first; throws 404/403 on bad state).
  // -------------------------------------------------------------------------
  const endpoint = await getEndpoint(userId, endpointId, { forProxy: true });

  // -------------------------------------------------------------------------
  // 2. Rate-limit check.
  //    Key scoped to (endpoint, caller) so each API client gets its own bucket.
  //    The store.hit() call is atomic; blocked attempts are NOT recorded in the
  //    window — a client hammering a saturated limit cannot push its own reset.
  // -------------------------------------------------------------------------
  const key = buildRateLimitKey(endpointId, clientId);
  const { limit, windowMs } = endpoint.rateLimit;
  const decision = await rateLimitStore.hit(key, limit, windowMs);

  // Attach rate-limit headers on every response (RFC 6585 + draft RateLimit).
  res.set({
    'X-RateLimit-Limit': String(decision.limit),
    'X-RateLimit-Remaining': String(decision.remaining),
    'X-RateLimit-Reset': String(Math.ceil(decision.resetAtMs / 1000)), // Unix epoch seconds
  });

  if (!decision.allowed) {
    // 3. Blocked — log and return 429 immediately.
    const retryAfterSec = Math.ceil(decision.retryAfterMs / 1000);
    res.set('Retry-After', String(retryAfterSec));

    void writeLog({
      endpointId,
      userId,
      clientId,
      clientIp: req.ip,
      method: req.method,
      path: req.path,
      outcome: 'blocked',
      statusCode: 429,
      latencyMs: 0,
    });

    throw ApiError.rateLimited({
      retryAfterMs: decision.retryAfterMs,
      resetAt: new Date(decision.resetAtMs).toISOString(),
    });
  }

  // -------------------------------------------------------------------------
  // 4. Allowed — forward to upstream.
  // -------------------------------------------------------------------------
  const startMs = Date.now();

  // Build the upstream URL.  Any path segments after /proxy/:endpointId are
  // appended to the registered targetUrl.
  const proxyPath = req.params[0] ?? ''; // everything after /:endpointId
  const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  const upstreamUrl = endpoint.targetUrl.replace(/\/$/, '') + '/' + proxyPath.replace(/^\//, '') + query;

  // Copy safe request headers.
  const forwardHeaders = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (!HOP_BY_HOP.has(k.toLowerCase())) forwardHeaders[k] = v;
  }
  // Tell the upstream who the real client is.
  forwardHeaders['x-forwarded-for'] = req.ip;
  forwardHeaders['x-forwarded-host'] = req.hostname;
  forwardHeaders['x-rategate-endpoint'] = endpointId;

  let upstreamRes;
  try {
    upstreamRes = await fetch(upstreamUrl, {
      method: req.method,
      headers: forwardHeaders,
      // Stream the request body through (undici handles Buffer / readable).
      body: ['GET', 'HEAD'].includes(req.method.toUpperCase()) ? undefined : req,
      // Prevent undici from decompressing — let the client handle it.
      compress: false,
      signal: AbortSignal.timeout(Number(process.env.PROXY_TIMEOUT_MS ?? 15000)),
      // Allow undici to follow redirects.
      redirect: 'follow',
    });
  } catch (err) {
    const latencyMs = Date.now() - startMs;
    void writeLog({
      endpointId,
      userId,
      clientId,
      clientIp: req.ip,
      method: req.method,
      path: req.path,
      outcome: 'upstream_error',
      statusCode: 502,
      latencyMs,
    });
    logger.warn({ err: err.message, upstreamUrl, endpointId }, 'upstream request failed');
    throw ApiError.upstream(`Upstream unreachable: ${err.message}`);
  }

  const latencyMs = Date.now() - startMs;

  // Copy safe response headers.
  for (const [k, v] of upstreamRes.headers.entries()) {
    if (!UPSTREAM_HOP_BY_HOP.has(k.toLowerCase())) {
      res.set(k, v);
    }
  }
  res.status(upstreamRes.status);

  // Log the allowed request (fire-and-forget — don't block the response).
  void writeLog({
    endpointId,
    userId,
    clientId,
    clientIp: req.ip,
    method: req.method,
    path: req.path,
    outcome: 'allowed',
    statusCode: upstreamRes.status,
    latencyMs,
  });

  // Stream the upstream body back to the client.
  if (upstreamRes.body) {
    const reader = upstreamRes.body.getReader();
    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    } finally {
      reader.releaseLock();
    }
  }
  res.end();
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Writes a RequestLog document asynchronously.  Errors are logged but never
 * surfaced to the client — logging must never affect proxy availability.
 */
async function writeLog(fields) {
  try {
    await RequestLog.create({ ...fields, timestamp: new Date() });
  } catch (err) {
    logger.error({ err: err.message }, 'failed to write request log');
  }
}
