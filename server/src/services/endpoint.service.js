import { Endpoint } from '../models/Endpoint.js';
import { ApiError } from '../utils/ApiError.js';

// ---------------------------------------------------------------------------
// Simple LRU-style in-process cache so the proxy middleware does not hit
// MongoDB on every forwarded request. TTL is short (30 s) so live rate-limit
// edits propagate quickly without a publish/subscribe mechanism.
// ---------------------------------------------------------------------------
const CACHE_TTL_MS = 30_000;
const endpointCache = new Map(); // endpointId → { doc, expiresAt }

function cacheGet(id) {
  const entry = endpointCache.get(id);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    endpointCache.delete(id);
    return null;
  }
  return entry.doc;
}

function cacheSet(id, doc) {
  endpointCache.set(id, { doc, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function bustEndpointCache(id) {
  endpointCache.delete(String(id));
}

// ---------------------------------------------------------------------------
// CRUD helpers — all are owner-scoped (userId must match).
// ---------------------------------------------------------------------------

export async function createEndpoint(userId, { name, targetUrl, rateLimit }) {
  const doc = await Endpoint.create({ userId, name, targetUrl, rateLimit });
  return doc;
}

export async function listEndpoints(userId) {
  return Endpoint.find({ userId }).sort({ createdAt: -1 }).lean();
}

/**
 * Fetches an endpoint and asserts ownership.
 * When `forProxy` is true the check is intentionally tighter: the endpoint
 * must be active. Dashboard reads should still show inactive endpoints.
 */
export async function getEndpoint(userId, endpointId, { forProxy = false } = {}) {
  let doc;

  if (forProxy) {
    doc = cacheGet(endpointId);
  }

  if (!doc) {
    doc = await Endpoint.findById(endpointId).lean();
    if (forProxy && doc?.isActive) cacheSet(endpointId, doc);
  }

  if (!doc) throw ApiError.notFound('Endpoint not found');

  // Ownership check: callers passing their userId must own the endpoint.
  if (userId !== null && String(doc.userId) !== String(userId)) {
    throw ApiError.notFound('Endpoint not found'); // don't reveal existence
  }

  if (forProxy && !doc.isActive) {
    throw ApiError.forbidden('Endpoint is disabled');
  }

  return doc;
}

export async function updateEndpoint(userId, endpointId, patch) {
  // Deep merge rateLimit if a partial rateLimit patch is provided.
  const existing = await getEndpoint(userId, endpointId);

  const merged = {
    ...patch,
    ...(patch.rateLimit
      ? { rateLimit: { ...existing.rateLimit, ...patch.rateLimit } }
      : {}),
  };

  const updated = await Endpoint.findByIdAndUpdate(endpointId, merged, { new: true, runValidators: true });
  bustEndpointCache(endpointId);
  return updated;
}

export async function deleteEndpoint(userId, endpointId) {
  const existing = await getEndpoint(userId, endpointId);
  await Endpoint.findByIdAndDelete(existing._id);
  bustEndpointCache(endpointId);
}
