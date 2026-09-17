/**
 * Application error carrying an HTTP status and a stable machine-readable code.
 * Every error surfaced to clients flows through this class so the JSON shape is
 * identical regardless of where the failure originated.
 */
export class ApiError extends Error {
  /**
   * @param {number} status HTTP status code
   * @param {string} code   stable, SCREAMING_SNAKE identifier for clients
   * @param {string} message human-readable summary
   * @param {object} [details] optional structured context (validation issues, limits, ...)
   */
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message, details) {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, 'NOT_FOUND', message);
  }

  static conflict(message, details) {
    return new ApiError(409, 'CONFLICT', message, details);
  }

  static validation(details) {
    return new ApiError(422, 'VALIDATION_ERROR', 'Request validation failed', details);
  }

  static rateLimited(details) {
    return new ApiError(429, 'RATE_LIMITED', 'Rate limit exceeded', details);
  }

  static upstream(message, details) {
    return new ApiError(502, 'UPSTREAM_ERROR', message, details);
  }
}
