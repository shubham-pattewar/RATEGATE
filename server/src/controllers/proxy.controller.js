import { handleProxy } from '../services/proxy.service.js';

/**
 * Thin handler.  The express `ALL /proxy/:endpointId/*` route calls this after
 * API-key auth.  `rateLimitStore` is injected via res.locals (set in the router
 * factory) so the controller itself stays dependency-free.
 */
export async function proxy(req, res) {
  await handleProxy(req, res, { rateLimitStore: res.locals.rateLimitStore });
}
