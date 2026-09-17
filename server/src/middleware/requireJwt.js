import { verifyToken } from '../services/auth.service.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Dashboard authentication: expects `Authorization: Bearer <jwt>`.
 * Loads the user so downstream handlers can rely on `req.user` being current
 * (e.g. reflecting a regenerated API key prefix).
 */
export const requireJwt = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw ApiError.unauthorized('Missing bearer token');
  }

  const payload = verifyToken(token); // throws JsonWebTokenError / TokenExpiredError
  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('Account no longer exists');

  req.user = user;
  next();
});
