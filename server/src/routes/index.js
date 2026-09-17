import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { endpointRouter } from './endpoint.routes.js';
import { statsRouter } from './stats.routes.js';
import { buildProxyRouter } from './proxy.routes.js';

/**
 * @param {{ rateLimitStore: import('../services/rateLimiter/RateLimitStore.js').RateLimitStore }} deps
 */
export function buildApiRouter({ rateLimitStore }) {
  const api = Router();

  api.use('/auth', authRouter);
  api.use('/endpoints', endpointRouter);
  api.use('/endpoints', statsRouter); // GET /api/endpoints/:id/stats

  // The proxy lives outside /api so its path stays clean: /proxy/:endpointId
  // We return the proxy router separately so app.js can mount it at root level.
  const proxyRouter = buildProxyRouter({ rateLimitStore });

  return { api, proxyRouter };
}
