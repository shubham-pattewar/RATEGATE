/**
 * Contract every rate-limit store implements. The proxy middleware depends on
 * this shape only, so Redis and the in-memory fallback are interchangeable.
 *
 * @typedef {object} RateLimitDecision
 * @property {boolean} allowed      whether this request may proceed
 * @property {number}  limit        configured max requests per window
 * @property {number}  remaining    requests still available in the current window (0 when blocked)
 * @property {number}  retryAfterMs milliseconds until at least one slot frees up (0 when allowed)
 * @property {number}  resetAtMs    epoch ms at which the oldest tracked request slides out of the
 *                                  window, i.e. when the next slot frees up (oldest + windowMs)
 */

/**
 * @typedef {object} RateLimitStore
 * @property {'redis'|'memory-fallback'} kind
 *   Which backend is live. Surfaced on /health so a degraded deployment is visible.
 * @property {(key: string, limit: number, windowMs: number, nowMs?: number) => Promise<RateLimitDecision>} hit
 *   Atomically records one request attempt against `key` and decides whether it is allowed.
 *   Blocked attempts are NOT recorded — a client hammering a saturated limit must not push
 *   its own reset further into the future.
 * @property {(key: string) => Promise<void>} reset
 *   Forgets all history for `key`.
 * @property {() => Promise<void>} close
 *   Releases underlying connections / timers.
 */

export {};
