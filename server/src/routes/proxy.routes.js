import { Router } from 'express';
import { requireApiKey } from '../middleware/requireApiKey.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { proxy } from '../controllers/proxy.controller.js';

/**
 * Proxy router factory.  Receives the rateLimitStore so it can inject it into
 * res.locals before the controller runs — keeping the controller free of
 * direct store imports (easier to test in isolation).
 *
 * Route pattern: ALL /proxy/:endpointId/*
 *   - :endpointId  identifies the registered endpoint
 *   - /*           the sub-path is forwarded verbatim to the upstream target
 *
 * Authentication: X-API-Key header (or Authorization: Bearer rg_...)
 */
export function buildProxyRouter({ rateLimitStore }) {
  const router = Router();

  // Inject the rate-limit store into res.locals for every proxy request.
  router.use((req, res, next) => {
    res.locals.rateLimitStore = rateLimitStore;
    next();
  });

  // Express 4 `*` param must be named; use a wildcard route that captures
  // everything after the endpointId as req.params[0].
  router.all(
    '/:endpointId/*',
    requireApiKey,
    asyncHandler(proxy),
  );

  // Also handle requests directly to /proxy/:endpointId (no trailing path).
  router.all(
    '/:endpointId',
    requireApiKey,
    asyncHandler(proxy),
  );

  return router;
}
