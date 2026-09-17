/**
 * Integration tests for the proxy route + rate-limit enforcement.
 *
 * We do NOT make real HTTP calls to an upstream in tests.  Instead we spin up
 * a tiny echo server on a random port using Node's `http` module, register it
 * as the endpoint target, and hit /proxy/:id.  This keeps the tests hermetic
 * and fast while exercising the full proxy code path.
 */

import http from 'node:http';
import { connectTestDb, clearTestDb, disconnectTestDb } from '../helpers/db.js';
import { buildTestApp, signupViaHttp } from '../helpers/app.js';
import { createEndpoint } from '../../src/services/endpoint.service.js';
import { User } from '../../src/models/User.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Starts a simple echo server that responds 200 OK for every request. */
function startEchoServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ echo: req.url }));
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, url: `http://127.0.0.1:${port}` });
    });
  });
}

// ---------------------------------------------------------------------------
// Suite setup
// ---------------------------------------------------------------------------
let agent, rateLimitStore, echoServer, echoUrl;
let token, apiKey, userId, endpointId;

beforeAll(async () => {
  await connectTestDb();
  ({ agent, rateLimitStore } = buildTestApp());
  ({ server: echoServer, url: echoUrl } = await startEchoServer());
});

afterEach(async () => {
  await clearTestDb();
  rateLimitStore.entries?.clear(); // reset in-memory buckets between tests
});

afterAll(async () => {
  await rateLimitStore.close();
  await disconnectTestDb();
  echoServer.close();
});

/** Signs up, creates a test endpoint with a tight rate limit, returns identifiers. */
async function setup({ limit = 3, windowMs = 60_000 } = {}) {
  const body = await signupViaHttp(agent, 'proxy@example.com');
  token = body.token;
  apiKey = body.apiKey;

  // We need the raw userId to create the endpoint directly (faster than HTTP).
  const user = await User.findOne({ email: 'proxy@example.com' }).lean();
  userId = user._id;

  const endpoint = await createEndpoint(userId, {
    name: 'Test',
    targetUrl: echoUrl,
    rateLimit: { limit, windowMs },
  });
  endpointId = String(endpoint._id);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('proxy authentication', () => {
  beforeEach(() => setup());

  it('rejects requests with no API key', async () => {
    const res = await agent.get(`/proxy/${endpointId}`);
    expect(res.status).toBe(401);
  });

  it('rejects requests with an invalid API key', async () => {
    const res = await agent.get(`/proxy/${endpointId}`).set('x-api-key', 'rg_invalid');
    expect(res.status).toBe(401);
  });

  it('accepts the API key via Authorization: Bearer', async () => {
    const res = await agent.get(`/proxy/${endpointId}`).set('authorization', `Bearer ${apiKey}`);
    expect(res.status).toBe(200);
  });
});

describe('proxy forwarding', () => {
  beforeEach(() => setup());

  it('forwards GET requests and returns upstream body + 200', async () => {
    const res = await agent.get(`/proxy/${endpointId}/hello?q=1`).set('x-api-key', apiKey);
    expect(res.status).toBe(200);
    const body = JSON.parse(res.text);
    expect(body.echo).toContain('hello');
  });

  it('sets X-RateLimit-* headers on allowed responses', async () => {
    const res = await agent.get(`/proxy/${endpointId}`).set('x-api-key', apiKey);
    expect(res.headers['x-ratelimit-limit']).toBeDefined();
    expect(res.headers['x-ratelimit-remaining']).toBeDefined();
    expect(res.headers['x-ratelimit-reset']).toBeDefined();
  });
});

describe('rate limiting', () => {
  beforeEach(() => setup({ limit: 3, windowMs: 60_000 }));

  it('allows requests up to the limit then returns 429', async () => {
    // First 3 should be allowed.
    for (let i = 0; i < 3; i++) {
      const res = await agent.get(`/proxy/${endpointId}`).set('x-api-key', apiKey);
      expect(res.status).toBe(200);
    }
    // The 4th must be blocked.
    const blocked = await agent.get(`/proxy/${endpointId}`).set('x-api-key', apiKey);
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('RATE_LIMITED');
    expect(blocked.headers['retry-after']).toBeDefined();
  });

  it('returns 429 with Retry-After and resetAt in the error body', async () => {
    for (let i = 0; i < 3; i++) {
      await agent.get(`/proxy/${endpointId}`).set('x-api-key', apiKey);
    }
    const res = await agent.get(`/proxy/${endpointId}`).set('x-api-key', apiKey);
    expect(res.status).toBe(429);
    expect(Number(res.headers['retry-after'])).toBeGreaterThan(0);
    expect(res.body.error.details).toMatchObject({
      retryAfterMs: expect.any(Number),
      resetAt: expect.any(String),
    });
  });

  it('X-RateLimit-Remaining decrements correctly', async () => {
    const first = await agent.get(`/proxy/${endpointId}`).set('x-api-key', apiKey);
    expect(Number(first.headers['x-ratelimit-remaining'])).toBe(2); // 3 - 1 = 2

    const second = await agent.get(`/proxy/${endpointId}`).set('x-api-key', apiKey);
    expect(Number(second.headers['x-ratelimit-remaining'])).toBe(1);
  });
});

describe('inactive endpoint', () => {
  it('returns 403 when the endpoint is disabled', async () => {
    await setup();
    // Disable the endpoint directly.
    const { updateEndpoint } = await import('../../src/services/endpoint.service.js');
    await updateEndpoint(userId, endpointId, { isActive: false });

    const res = await agent.get(`/proxy/${endpointId}`).set('x-api-key', apiKey);
    expect(res.status).toBe(403);
  });
});
