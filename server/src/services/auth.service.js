import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

const BCRYPT_ROUNDS = 12;
const API_KEY_PREFIX = 'rg_';
const API_KEY_DISPLAY_CHARS = 8;

/**
 * Generates a fresh API key. The raw key is returned to the caller exactly once;
 * only the hash + display prefix are persisted.
 */
export function generateApiKey() {
  const raw = API_KEY_PREFIX + crypto.randomBytes(32).toString('base64url');
  return {
    raw,
    hash: hashApiKey(raw),
    prefix: raw.slice(0, API_KEY_PREFIX.length + API_KEY_DISPLAY_CHARS),
  };
}

/**
 * API keys are high-entropy random strings, so an unsalted SHA-256 is sufficient
 * (there is nothing to dictionary-attack) and lets us look them up by exact match.
 */
export function hashApiKey(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), email: user.email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

export function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

export async function signup({ email, password }) {
  const existing = await User.findOne({ email }).lean();
  if (existing) throw ApiError.conflict('An account with this email already exists', { field: 'email' });

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const apiKey = generateApiKey();

  const user = await User.create({
    email,
    passwordHash,
    apiKeyHash: apiKey.hash,
    apiKeyPrefix: apiKey.prefix,
    apiKeyCreatedAt: new Date(),
  });

  return { user, token: signToken(user), apiKey: apiKey.raw };
}

export async function login({ email, password }) {
  const user = await User.findOne({ email });
  // Same error for unknown email and wrong password so we don't leak which
  // emails are registered.
  const invalid = ApiError.unauthorized('Invalid email or password');
  if (!user) throw invalid;

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw invalid;

  return { user, token: signToken(user) };
}

export async function regenerateApiKey(userId) {
  const apiKey = generateApiKey();
  const user = await User.findByIdAndUpdate(
    userId,
    { apiKeyHash: apiKey.hash, apiKeyPrefix: apiKey.prefix, apiKeyCreatedAt: new Date() },
    { new: true },
  );
  if (!user) throw ApiError.notFound('User not found');
  return { user, apiKey: apiKey.raw };
}

export async function findUserByApiKey(rawKey) {
  return User.findOne({ apiKeyHash: hashApiKey(rawKey) }).lean();
}
