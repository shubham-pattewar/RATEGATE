import { connectTestDb, clearTestDb, disconnectTestDb } from '../helpers/db.js';
import { signup } from '../../src/services/auth.service.js';
import {
  createEndpoint,
  listEndpoints,
  getEndpoint,
  updateEndpoint,
  deleteEndpoint,
} from '../../src/services/endpoint.service.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const VALID_ENDPOINT = {
  name: 'My API',
  targetUrl: 'http://example.com/api',
  rateLimit: { limit: 100, windowMs: 60_000 },
};

let userId;

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(disconnectTestDb);

beforeEach(async () => {
  const { user } = await signup({ email: 'owner@example.com', password: 'password123' });
  userId = user._id;
});

// ---------------------------------------------------------------------------
// createEndpoint
// ---------------------------------------------------------------------------
describe('createEndpoint', () => {
  it('persists and returns a new endpoint owned by the user', async () => {
    const doc = await createEndpoint(userId, VALID_ENDPOINT);
    expect(doc.name).toBe('My API');
    expect(doc.targetUrl).toBe('http://example.com/api');
    expect(doc.rateLimit.limit).toBe(100);
    expect(doc.rateLimit.windowMs).toBe(60_000);
    expect(doc.isActive).toBe(true);
    expect(String(doc.userId)).toBe(String(userId));
  });
});

// ---------------------------------------------------------------------------
// listEndpoints
// ---------------------------------------------------------------------------
describe('listEndpoints', () => {
  it('returns only endpoints owned by the requesting user', async () => {
    const { user: other } = await signup({ email: 'other@example.com', password: 'password123' });

    await createEndpoint(userId, VALID_ENDPOINT);
    await createEndpoint(other._id, { ...VALID_ENDPOINT, name: 'Other' });

    const mine = await listEndpoints(userId);
    expect(mine).toHaveLength(1);
    expect(mine[0].name).toBe('My API');
  });
});

// ---------------------------------------------------------------------------
// getEndpoint
// ---------------------------------------------------------------------------
describe('getEndpoint', () => {
  it('returns the endpoint when the owner requests it', async () => {
    const created = await createEndpoint(userId, VALID_ENDPOINT);
    const fetched = await getEndpoint(userId, created._id);
    expect(String(fetched._id)).toBe(String(created._id));
  });

  it('throws 404 for a non-existent endpoint', async () => {
    const fakeId = '000000000000000000000001';
    await expect(getEndpoint(userId, fakeId)).rejects.toMatchObject({ status: 404 });
  });

  it('throws 404 when a different user requests the endpoint (no info leak)', async () => {
    const { user: other } = await signup({ email: 'other@example.com', password: 'password123' });
    const created = await createEndpoint(userId, VALID_ENDPOINT);
    await expect(getEndpoint(other._id, created._id)).rejects.toMatchObject({ status: 404 });
  });

  it('throws 403 for proxy access to an inactive endpoint', async () => {
    const created = await createEndpoint(userId, VALID_ENDPOINT);
    await updateEndpoint(userId, created._id, { isActive: false });
    await expect(getEndpoint(userId, created._id, { forProxy: true })).rejects.toMatchObject({ status: 403 });
  });
});

// ---------------------------------------------------------------------------
// updateEndpoint
// ---------------------------------------------------------------------------
describe('updateEndpoint', () => {
  it('merges a partial rateLimit patch without losing other fields', async () => {
    const created = await createEndpoint(userId, VALID_ENDPOINT);
    const updated = await updateEndpoint(userId, created._id, {
      rateLimit: { limit: 50 },
    });
    expect(updated.rateLimit.limit).toBe(50);
    expect(updated.rateLimit.windowMs).toBe(60_000); // unchanged
    expect(updated.name).toBe('My API');             // unchanged
  });

  it('rejects updates from a non-owner', async () => {
    const { user: other } = await signup({ email: 'other@example.com', password: 'password123' });
    const created = await createEndpoint(userId, VALID_ENDPOINT);
    await expect(updateEndpoint(other._id, created._id, { name: 'Hijack' })).rejects.toMatchObject({ status: 404 });
  });
});

// ---------------------------------------------------------------------------
// deleteEndpoint
// ---------------------------------------------------------------------------
describe('deleteEndpoint', () => {
  it('removes the endpoint so it can no longer be fetched', async () => {
    const created = await createEndpoint(userId, VALID_ENDPOINT);
    await deleteEndpoint(userId, created._id);
    await expect(getEndpoint(userId, created._id)).rejects.toMatchObject({ status: 404 });
  });

  it('rejects deletion by a non-owner', async () => {
    const { user: other } = await signup({ email: 'other@example.com', password: 'password123' });
    const created = await createEndpoint(userId, VALID_ENDPOINT);
    await expect(deleteEndpoint(other._id, created._id)).rejects.toMatchObject({ status: 404 });
  });
});
