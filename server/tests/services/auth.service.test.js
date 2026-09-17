import jwt from 'jsonwebtoken';
import { connectTestDb, clearTestDb, disconnectTestDb } from '../helpers/db.js';
import {
  generateApiKey,
  hashApiKey,
  signup,
  login,
  regenerateApiKey,
  findUserByApiKey,
  verifyToken,
} from '../../src/services/auth.service.js';
import { User } from '../../src/models/User.js';

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(disconnectTestDb);

describe('generateApiKey', () => {
  it('produces a prefixed, high-entropy key whose hash is deterministic', () => {
    const a = generateApiKey();
    const b = generateApiKey();
    expect(a.raw).toMatch(/^rg_[A-Za-z0-9_-]{43}$/);
    expect(a.raw).not.toEqual(b.raw);
    expect(a.prefix).toBe(a.raw.slice(0, 11));
    expect(a.hash).toBe(hashApiKey(a.raw));
    expect(a.hash).toHaveLength(64);
  });
});

describe('signup', () => {
  it('stores only hashes and returns a JWT plus the raw API key once', async () => {
    const { user, token, apiKey } = await signup({ email: 'a@example.com', password: 'password123' });

    expect(apiKey).toMatch(/^rg_/);
    expect(verifyToken(token).sub).toBe(user._id.toString());

    const stored = await User.findById(user._id).lean();
    expect(stored.passwordHash).not.toBe('password123');
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(stored.apiKeyHash).toBe(hashApiKey(apiKey));
    expect(JSON.stringify(stored)).not.toContain(apiKey);
  });

  it('rejects duplicate emails with a 409', async () => {
    await signup({ email: 'dup@example.com', password: 'password123' });
    await expect(signup({ email: 'dup@example.com', password: 'password123' })).rejects.toMatchObject({
      status: 409,
      code: 'CONFLICT',
    });
  });
});

describe('login', () => {
  beforeEach(() => signup({ email: 'l@example.com', password: 'correct-horse' }));

  it('returns a token for valid credentials', async () => {
    const { token } = await login({ email: 'l@example.com', password: 'correct-horse' });
    expect(verifyToken(token).email).toBe('l@example.com');
  });

  it('uses the same 401 for unknown email and wrong password', async () => {
    const expected = { status: 401, message: 'Invalid email or password' };
    await expect(login({ email: 'l@example.com', password: 'nope-nope' })).rejects.toMatchObject(expected);
    await expect(login({ email: 'ghost@example.com', password: 'correct-horse' })).rejects.toMatchObject(expected);
  });
});

describe('API key lifecycle', () => {
  it('regenerate invalidates the old key and activates the new one', async () => {
    const { user, apiKey: oldKey } = await signup({ email: 'k@example.com', password: 'password123' });
    expect(await findUserByApiKey(oldKey)).not.toBeNull();

    const { apiKey: newKey } = await regenerateApiKey(user._id);
    expect(newKey).not.toBe(oldKey);
    expect(await findUserByApiKey(oldKey)).toBeNull();
    expect((await findUserByApiKey(newKey))._id.toString()).toBe(user._id.toString());
  });
});

describe('verifyToken', () => {
  it('rejects expired and tampered tokens', () => {
    const expired = jwt.sign({ sub: 'x' }, process.env.JWT_SECRET, { expiresIn: -10 });
    expect(() => verifyToken(expired)).toThrow(jwt.TokenExpiredError);

    const foreign = jwt.sign({ sub: 'x' }, 'some-other-secret-some-other-secret-1234');
    expect(() => verifyToken(foreign)).toThrow(jwt.JsonWebTokenError);
  });
});
