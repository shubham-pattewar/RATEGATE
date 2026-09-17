/**
 * Wraps an async Express handler so rejected promises reach the error middleware
 * instead of hanging the request (Express 4 does not do this natively).
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
