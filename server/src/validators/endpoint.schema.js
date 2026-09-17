import { z } from 'zod';
import { env } from '../config/env.js';
import { RATE_LIMIT_BOUNDS } from '../models/Endpoint.js';

// ---------------------------------------------------------------------------
// Private-IP guard
// ---------------------------------------------------------------------------
const PRIVATE_IP_RE =
  /^(https?:\/\/)(localhost|127\.\d+\.\d+\.\d+|0\.0\.0\.0|::1|\[::1\]|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+)/i;

function targetUrl() {
  return z
    .string()
    .trim()
    .url('targetUrl must be a valid URL')
    .max(2048)
    .refine(
      (url) => env.ALLOW_PRIVATE_TARGETS || !PRIVATE_IP_RE.test(url),
      'Private / loopback targets are not allowed (set ALLOW_PRIVATE_TARGETS=true to override)',
    );
}

// ---------------------------------------------------------------------------
// Nested rate-limit sub-schema
// ---------------------------------------------------------------------------
const rateLimitSchema = z.object({
  limit: z
    .number({ required_error: 'rateLimit.limit is required' })
    .int()
    .min(RATE_LIMIT_BOUNDS.limit.min)
    .max(RATE_LIMIT_BOUNDS.limit.max),
  windowMs: z
    .number({ required_error: 'rateLimit.windowMs is required' })
    .int()
    .min(RATE_LIMIT_BOUNDS.windowMs.min)
    .max(RATE_LIMIT_BOUNDS.windowMs.max),
  // We only implement sliding_window; accept the field but always coerce it.
  algorithm: z
    .enum(['sliding_window'])
    .default('sliding_window')
    .optional()
    .transform(() => 'sliding_window'),
});

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------
export const createEndpointSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    targetUrl: targetUrl(),
    rateLimit: rateLimitSchema,
  })
  .strict();

// ---------------------------------------------------------------------------
// Update (all fields optional, at least one required)
// ---------------------------------------------------------------------------
export const updateEndpointSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    targetUrl: targetUrl().optional(),
    rateLimit: rateLimitSchema.partial().optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, 'At least one field must be provided');
