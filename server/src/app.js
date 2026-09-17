import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env, isTest } from './config/env.js';
import { logger } from './utils/logger.js';
import { buildApiRouter } from './routes/index.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

/**
 * Express app factory. Dependencies are injected so tests can build an app
 * against an in-memory rate-limit store and an ephemeral MongoDB.
 *
 * @param {object} deps
 * @param {import('./services/rateLimiter/RateLimitStore.js').RateLimitStore} deps.rateLimitStore
 */
export function createApp({ rateLimitStore }) {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', true);

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()), credentials: true }));
  if (!isTest) {
    app.use(
      pinoHttp({
        logger,
        autoLogging: { ignore: (req) => req.url === '/health' },
        customLogLevel: (req, res, err) => (err || res.statusCode >= 500 ? 'error' : 'debug'),
      }),
    );
  }

  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      rateLimitStore: rateLimitStore.kind,
      uptimeSec: Math.round(process.uptime()),
    });
  });

  // Build routers.  buildApiRouter now returns both the management API router
  // and the proxy router (the proxy needs the store injected at construction).
  const { api, proxyRouter } = buildApiRouter({ rateLimitStore });

  // Dashboard / management API: JSON bodies parsed here only (not for /proxy).
  app.use('/api', express.json({ limit: '100kb' }), api);

  // Proxy: raw body streaming — do NOT add express.json() here.
  app.use('/proxy', proxyRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

