import request from 'supertest';
import { createApp } from '../../src/app.js';
import { MemoryRateLimitStore } from '../../src/services/rateLimiter/MemoryRateLimitStore.js';

/** Builds an app wired to a fresh in-memory rate-limit store. */
export function buildTestApp() {
  const rateLimitStore = new MemoryRateLimitStore();
  const app = createApp({ rateLimitStore });
  return { app, rateLimitStore, agent: request(app) };
}

export async function signupViaHttp(agent, email = 'user@example.com', password = 'password123') {
  const res = await agent.post('/api/auth/signup').send({ email, password });
  if (res.status !== 201) throw new Error(`signup failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body; // { user, token, apiKey }
}
