import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { isProd } from '../config/env.js';

/**
 * Translates framework / driver errors we did not raise ourselves into ApiErrors
 * so clients always receive the same envelope.
 */
function normalize(err) {
  if (err instanceof ApiError) return err;

  // express.json() body parse failure
  if (err.type === 'entity.parse.failed') {
    return ApiError.badRequest('Malformed JSON body');
  }
  if (err.type === 'entity.too.large') {
    return new ApiError(413, 'PAYLOAD_TOO_LARGE', 'Request body too large');
  }

  // Mongoose
  if (err.name === 'CastError') {
    return ApiError.badRequest(`Invalid value for ${err.path}`);
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern ?? {})[0] ?? 'field';
    return ApiError.conflict(`${field} already exists`, { field });
  }
  if (err.name === 'ValidationError' && err.errors) {
    const issues = Object.values(err.errors).map((e) => ({ path: e.path, message: e.message }));
    return ApiError.validation(issues);
  }

  // jsonwebtoken
  if (err.name === 'TokenExpiredError') return ApiError.unauthorized('Token expired');
  if (err.name === 'JsonWebTokenError') return ApiError.unauthorized('Invalid token');

  return new ApiError(500, 'INTERNAL_ERROR', 'Internal server error');
}

// eslint-disable-next-line no-unused-vars -- Express identifies error middleware by arity
export function errorHandler(err, req, res, next) {
  const apiError = normalize(err);

  if (apiError.status >= 500) {
    logger.error({ err, reqId: req.id, path: req.originalUrl }, 'unhandled error');
  } else {
    logger.debug({ code: apiError.code, path: req.originalUrl }, apiError.message);
  }

  if (res.headersSent) return;

  const body = {
    error: {
      code: apiError.code,
      message: apiError.message,
      ...(apiError.details !== undefined && { details: apiError.details }),
    },
  };
  if (!isProd && apiError.status >= 500 && err.stack) {
    body.error.stack = err.stack;
  }
  res.status(apiError.status).json(body);
}
