import http from 'node:http';
import { env } from './config/env.js';
import { connectDb, disconnectDb } from './config/db.js';
import { createRateLimitStore } from './services/rateLimiter/index.js';
import { createApp } from './app.js';
import { logger } from './utils/logger.js';

async function main() {
  await connectDb(env.MONGODB_URI);
  const rateLimitStore = await createRateLimitStore({ redisUrl: env.REDIS_URL });

  const app = createApp({ rateLimitStore });
  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    logger.info({ port: env.PORT, store: rateLimitStore.kind, env: env.NODE_ENV }, 'rategate listening');
  });

  const shutdown = async (signal) => {
    logger.info({ signal }, 'shutting down');
    server.close();
    await Promise.allSettled([rateLimitStore.close(), disconnectDb()]);
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  logger.fatal({ err }, 'failed to start');
  process.exit(1);
});
