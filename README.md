# RateGate

**Rate-Limiter as a Service** — register your API endpoints, get a proxy URL, and RateGate enforces configurable rate limits before forwarding requests to your real upstream.

Built as a portfolio project demonstrating production-quality Node.js backend architecture: real rate-limiting algorithm, JWT + API-key auth, MongoDB aggregation pipelines, Redis Lua scripting, and a React dashboard.

---

## Architecture

```
client/                  React + Tailwind v4 + Recharts dashboard
server/
  src/
    app.js               Express factory (dependency-injected, testable)
    index.js             Server bootstrap (DB connect, store init, HTTP listen)
    config/              env validation (Zod), MongoDB connect, Redis connect
    models/              Mongoose schemas: User, Endpoint, RequestLog
    routes/              Router factories; proxy router separate from /api
    controllers/         Thin HTTP adapters — no business logic
    services/
      auth.service.js    Signup, login, API key generation/verification
      endpoint.service.js CRUD with in-process TTL cache (avoids DB on every proxy hit)
      proxy.service.js   Core: rate-limit check → forward → log
      stats.service.js   MongoDB aggregation: timeseries + top clients
      rateLimiter/       Algorithm implementation (see below)
    middleware/          requireJwt, requireApiKey, validate (Zod), errorHandler
    validators/          Zod schemas for auth and endpoint input
    utils/               ApiError, asyncHandler, pino logger
```

### Request flow

```
Client → POST X-API-Key: rg_xxx
         ↓
/proxy/:endpointId
         ↓
requireApiKey  →  SHA-256 hash lookup in MongoDB (User.apiKeyHash)
         ↓
proxy.service:
  1. getEndpoint(userId, endpointId, { forProxy: true })
     - Process-level TTL cache (30 s) — no DB round-trip on hot path
     - Asserts ownership + isActive
  2. rateLimitStore.hit(`rl:<endpointId>:<clientId>`, limit, windowMs)
     - Atomic in Redis (Lua) or in-memory (single-threaded JS)
  3a. Blocked → 429 + Retry-After header + JSON error, log outcome
  3b. Allowed → undici.fetch upstream, stream response back, log outcome
```

---

## Rate-Limiting Algorithm

**Chosen algorithm: Sliding Window Log**

### How it works

Every allowed request is stored as a timestamp in a sorted set (Redis ZSET) keyed by `rl:<endpointId>:<clientId>`. To decide whether a new request is allowed:

1. **Evict** all entries with `score ≤ now − windowMs` (`ZREMRANGEBYSCORE`).
2. **Count** remaining entries (`ZCARD`).
3. If `count < limit`: **admit** — `ZADD` the new timestamp, refresh TTL (`PEXPIRE`).
4. If `count ≥ limit`: **reject** — compute `retryAfterMs = oldest_timestamp + windowMs − now`.

Rejected requests are **not recorded**. A client hammering a saturated limit cannot push its own reset window further into the future.

The entire read-evict-count-write sequence runs inside a single Lua script (`slidingWindow.lua`). Redis executes Lua scripts serially, making the sequence **atomic** — two concurrent requests cannot both observe `count == limit - 1` and both get admitted.

### Why not token bucket?

Token bucket requires persisting two values atomically (token count + last-refill timestamp) and more complex Lua logic to implement correctly. Sliding window log is simpler, interview-friendly (15-line Lua script), and produces **exact** counts with no approximation error.

### In-memory fallback

`MemoryRateLimitStore` mirrors the Lua algorithm exactly using a sorted timestamp array per key. It is correct for a single process (Node is single-threaded, so the evict/count/append is naturally atomic), but **not** for multi-process deployments. On startup the server logs an `error`-level message and the `/health` endpoint reports `rateLimitStore: "memory-fallback"` so degradation is never silent.

---

## MongoDB Schema

### User
| Field | Type | Notes |
|---|---|---|
| email | String | unique, lowercase |
| passwordHash | String | bcrypt, 12 rounds |
| apiKeyHash | String | SHA-256 of raw key, unique |
| apiKeyPrefix | String | `rg_` + 8 display chars, shown in UI |
| apiKeyCreatedAt | Date | |

Raw API keys are **never stored**. Only the SHA-256 hash is persisted (high-entropy random string → unsalted hash is safe here; no dictionary attack surface).

### Endpoint
| Field | Type | Notes |
|---|---|---|
| userId | ObjectId | owner reference |
| name | String | display name, max 80 chars |
| targetUrl | String | real upstream URL |
| rateLimit.limit | Number | max requests in window |
| rateLimit.windowMs | Number | window length in milliseconds |
| rateLimit.algorithm | String | always `sliding_window` |
| isActive | Boolean | soft-disable without deletion |

### RequestLog
| Field | Type | Notes |
|---|---|---|
| endpointId | ObjectId | |
| userId | ObjectId | denormalised for query performance |
| clientId | String | apiKeyPrefix of caller |
| clientIp | String | |
| method / path | String | |
| outcome | Enum | `allowed`, `blocked`, `upstream_error`, `unauthorized` |
| statusCode | Number | |
| latencyMs | Number | milliseconds, upstream only |
| timestamp | Date | TTL-indexed (auto-expiry after LOG_RETENTION_DAYS) |

Indexes: `{ endpointId, timestamp }`, `{ endpointId, clientId, timestamp }`, `{ timestamp }` (TTL).

---

## Running Locally

### Prerequisites
- Node.js ≥ 20
- Docker (for MongoDB + Redis)

### 1. Start dependencies

```bash
docker-compose up -d
```

### 2. Configure the server

```bash
cd server
cp .env.example .env
# Edit .env — set JWT_SECRET to a 32+ char random string
```

### 3. Start the server

```bash
cd server
npm install
npm run dev
```

Server starts on `http://localhost:4000`.

### 4. Start the dashboard

```bash
cd client
npm install
npm run dev
```

Dashboard at `http://localhost:5173`. The Vite dev proxy forwards `/api` and `/proxy` to the server automatically.

### 5. Run tests

```bash
cd server
npm test
```

Tests use `mongodb-memory-server` (no real MongoDB needed) and `MemoryRateLimitStore` (no Redis needed).

---

## API Reference

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | — | Create account, returns JWT + one-time API key |
| POST | `/api/auth/login` | — | Returns JWT |
| GET | `/api/auth/me` | JWT | Current user |
| POST | `/api/auth/api-key/regenerate` | JWT | Rotate API key |

### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/endpoints` | JWT | Register endpoint |
| GET | `/api/endpoints` | JWT | List owned endpoints |
| GET | `/api/endpoints/:id` | JWT | Get one |
| PATCH | `/api/endpoints/:id` | JWT | Update (live rate limit changes take effect within 30 s) |
| DELETE | `/api/endpoints/:id` | JWT | Remove |
| GET | `/api/endpoints/:id/stats?range=24h` | JWT | Analytics (`range`: 1h / 6h / 24h / 7d) |

### Proxy

```
ANY /proxy/:endpointId[/*]
Headers: X-API-Key: rg_xxxxxxxxxxxxxxxx
```

Returns upstream response on allow. On block:

```json
HTTP 429 Too Many Requests
Retry-After: 42
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1700000042

{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded",
    "details": {
      "retryAfterMs": 42000,
      "resetAt": "2023-11-14T12:34:02.000Z"
    }
  }
}
```

---

## Project Structure Decisions

- **Factory pattern for `createApp`** — the app never imports its dependencies directly; they're injected. This makes every layer independently testable without mocking module internals.
- **Zod for all inputs** — every route that accepts input validates it with a Zod schema before the controller runs. Validation errors always return 422 with per-field details.
- **Centralized `ApiError`** — every error that reaches the client flows through this class, guaranteeing a consistent `{ error: { code, message, details? } }` envelope regardless of where the failure originated.
- **Fire-and-forget logging** — `RequestLog.create()` is called without `await` after the response is sent. Logging never adds latency to the proxy path.
- **Endpoint cache** — a 30-second in-process TTL cache on the hot proxy path avoids a DB round-trip on every proxied request. Updates bust the cache immediately.
