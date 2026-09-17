/**
 * In-process sliding-window-log store. Mirrors slidingWindow.lua exactly, using
 * a sorted array of timestamps per key instead of a Redis ZSET.
 *
 * This is a FALLBACK for when Redis is unavailable. It is correct for a single
 * process only: with several server instances each would enforce its own,
 * independent limit. Node is single-threaded so the evict/count/append sequence
 * in `hit` is naturally atomic — there is no await between the read and the write.
 *
 * @implements {import('./RateLimitStore.js').RateLimitStore}
 */
export class MemoryRateLimitStore {
  kind = 'memory-fallback';

  /** @param {{ sweepIntervalMs?: number }} [options] */
  constructor({ sweepIntervalMs = 60_000 } = {}) {
    /** @type {Map<string, { timestamps: number[], expiresAt: number }>} */
    this.entries = new Map();

    // Idle keys would otherwise live forever; a periodic sweep plays the role
    // of Redis' PEXPIRE. unref() so the timer never keeps the process alive.
    this.sweepTimer = setInterval(() => this.sweep(Date.now()), sweepIntervalMs);
    this.sweepTimer.unref?.();
  }

  async hit(key, limit, windowMs, nowMs = Date.now()) {
    const windowStart = nowMs - windowMs;
    const entry = this.entries.get(key) ?? { timestamps: [], expiresAt: 0 };

    // 1. Evict timestamps that slid out of the window. `timestamps` is kept in
    //    ascending order, so we can drop a prefix instead of filtering.
    let firstLive = 0;
    while (firstLive < entry.timestamps.length && entry.timestamps[firstLive] <= windowStart) {
      firstLive++;
    }
    if (firstLive > 0) entry.timestamps.splice(0, firstLive);

    // 2. Count what is left.
    const count = entry.timestamps.length;

    if (count < limit) {
      // 3a. Admit and record.
      entry.timestamps.push(nowMs);
      entry.expiresAt = nowMs + windowMs;
      this.entries.set(key, entry);
      return {
        allowed: true,
        limit,
        remaining: limit - count - 1,
        retryAfterMs: 0,
        resetAtMs: entry.timestamps[0] + windowMs,
      };
    }

    // 3b. Reject without recording; next slot opens when the oldest entry expires.
    const oldest = entry.timestamps[0];
    const resetAtMs = oldest + windowMs;
    return {
      allowed: false,
      limit,
      remaining: 0,
      retryAfterMs: Math.max(1, resetAtMs - nowMs),
      resetAtMs,
    };
  }

  async reset(key) {
    this.entries.delete(key);
  }

  sweep(nowMs) {
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt <= nowMs) this.entries.delete(key);
    }
  }

  async close() {
    clearInterval(this.sweepTimer);
    this.entries.clear();
  }
}
