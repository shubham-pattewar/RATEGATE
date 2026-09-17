import { findUserByApiKey } from '../services/auth.service.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const API_KEY_HEADER = 'x-api-key';

/**
 * Proxy authentication. Accepts the key via `X-API-Key` (preferred) or
 * `Authorization: Bearer <key>` for clients that can't set custom headers.
 *
 * Sets `req.apiClient = { userId, clientId }` where `clientId` is the key's
 * display prefix — the identifier used for per-client rate limiting and logs.
 */
export const requireApiKey = asyncHandler(async (req, res, next) => {
  let raw = req.headers[API_KEY_HEADER];
  if (!raw) {
    const [scheme, token] = (req.headers.authorization ?? '').split(' ');
    if (scheme === 'Bearer' && token?.startsWith('rg_')) raw = token;
  }
  if (!raw || typeof raw !== 'string') {
    throw ApiError.unauthorized('Missing API key (send it in the X-API-Key header)');
  }

  const user = await findUserByApiKey(raw);
  if (!user) throw ApiError.unauthorized('Invalid API key');

  req.apiClient = { userId: user._id, clientId: user.apiKeyPrefix };
  next();
});
