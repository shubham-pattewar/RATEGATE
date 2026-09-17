// Runs before every test file (jest `setupFiles`), before any module imports,
// so config/env.js validates against these values rather than a real .env.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-test-secret';
process.env.MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/rategate-test';
process.env.LOG_LEVEL = 'silent';
process.env.ALLOW_PRIVATE_TARGETS = 'true';
