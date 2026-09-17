import { connectTestDb, clearTestDb, disconnectTestDb } from '../helpers/db.js';
import { buildTestApp, signupViaHttp } from '../helpers/app.js';

let agent;
let rateLimitStore;

beforeAll(async () => {
  await connectTestDb();
  ({ agent, rateLimitStore } = buildTestApp());
});
afterEach(clearTestDb);
afterAll(async () => {
  await rateLimitStore.close();
  await disconnectTestDb();
});

describe('POST /api/auth/signup', () => {
  it('creates an account and returns user, token and a one-time API key', async () => {
    const res = await agent.post('/api/auth/signup').send({ email: 'New@Example.com', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email: 'new@example.com' });
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect(res.body.user).not.toHaveProperty('apiKeyHash');
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.apiKey).toMatch(/^rg_/);
  });

  it('returns 422 with per-field issues on invalid input', async () => {
    const res = await agent.post('/api/auth/signup').send({ email: 'bad', password: '123' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.map((d) => d.path).sort()).toEqual(['email', 'password']);
  });

  it('rejects unknown fields', async () => {
    const res = await agent
      .post('/api/auth/signup')
      .send({ email: 'x@example.com', password: 'password123', isAdmin: true });
    expect(res.status).toBe(422);
  });

  it('returns 400 for malformed JSON', async () => {
    const res = await agent.post('/api/auth/signup').set('content-type', 'application/json').send('{bad');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });
});

describe('POST /api/auth/login', () => {
  it('issues a token usable on protected routes', async () => {
    await signupViaHttp(agent, 'me@example.com');
    const login = await agent.post('/api/auth/login').send({ email: 'me@example.com', password: 'password123' });
    expect(login.status).toBe(200);

    const me = await agent.get('/api/auth/me').set('authorization', `Bearer ${login.body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe('me@example.com');
  });

  it('returns 401 on bad credentials', async () => {
    await signupViaHttp(agent, 'me@example.com');
    const res = await agent.post('/api/auth/login').send({ email: 'me@example.com', password: 'wrong-pass' });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } });
  });
});

describe('protected routes', () => {
  it('reject missing, malformed and forged tokens', async () => {
    expect((await agent.get('/api/auth/me')).status).toBe(401);
    expect((await agent.get('/api/auth/me').set('authorization', 'Basic abc')).status).toBe(401);
    expect((await agent.get('/api/auth/me').set('authorization', 'Bearer not.a.jwt')).status).toBe(401);
  });

  it('POST /api-key/regenerate returns a new key and updates the visible prefix', async () => {
    const { token, user, apiKey } = await signupViaHttp(agent);
    const res = await agent.post('/api/auth/api-key/regenerate').set('authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.apiKey).toMatch(/^rg_/);
    expect(res.body.apiKey).not.toBe(apiKey);
    expect(res.body.user.apiKeyPrefix).not.toBe(user.apiKeyPrefix);
    expect(res.body.user.apiKeyPrefix).toBe(res.body.apiKey.slice(0, 11));
  });
});

describe('GET /health', () => {
  it('reports which rate-limit store is live', async () => {
    const res = await agent.get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', rateLimitStore: 'memory-fallback' });
  });
});
