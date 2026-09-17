-- Sliding Window Log rate limiter.
--
-- One sorted set per (endpoint, client). Each allowed request is stored as a
-- member whose SCORE is its arrival timestamp in milliseconds. "How many
-- requests happened in the last `window` ms?" is then just: drop everything
-- older than (now - window) and count what is left.
--
-- Running this as a single Lua script makes the whole read-evict-count-write
-- sequence atomic: Redis executes scripts serially, so two concurrent requests
-- can never both observe `count == limit - 1` and both get admitted.
--
-- KEYS[1] = zset key, e.g. rl:<endpointId>:<clientId>
-- ARGV[1] = limit      (max requests per window)
-- ARGV[2] = window     (window length in ms)
-- ARGV[3] = now        (current time in ms — passed in so all nodes agree on the clock
--                       and so tests can control time)
-- ARGV[4] = member     (unique id for this request; the timestamp alone would collide
--                       when two requests land in the same millisecond)
--
-- Returns: { allowed(0|1), remaining, retryAfterMs, resetAtMs }

local key    = KEYS[1]
local limit  = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local now    = tonumber(ARGV[3])
local member = ARGV[4]

local windowStart = now - window

-- 1. Evict every entry that has slid out of the window.
redis.call('ZREMRANGEBYSCORE', key, '-inf', windowStart)

-- 2. Count what remains: that is exactly the number of requests in the last `window` ms.
local count = redis.call('ZCARD', key)

if count < limit then
  -- 3a. Admit: record this request and refresh the key TTL so an idle client's
  --     set is garbage-collected by Redis once its window has fully elapsed.
  redis.call('ZADD', key, now, member)
  redis.call('PEXPIRE', key, window)

  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local resetAt = tonumber(oldest[2]) + window
  return { 1, limit - count - 1, 0, resetAt }
end

-- 3b. Reject. The window is full, so the earliest moment a slot frees up is
--     when the OLDEST tracked request slides out: oldest + window.
--     We deliberately do NOT record the rejected attempt — otherwise a client
--     retrying too eagerly would keep pushing its own reset further away.
local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
local oldestTs = tonumber(oldest[2])
local retryAfter = (oldestTs + window) - now
if retryAfter < 1 then retryAfter = 1 end

return { 0, 0, retryAfter, oldestTs + window }
