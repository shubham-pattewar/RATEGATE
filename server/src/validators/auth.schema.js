import { z } from 'zod';

const email = z.string().trim().toLowerCase().email('Invalid email address').max(254);
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters');

export const signupSchema = z.object({ email, password }).strict();

export const loginSchema = z.object({ email, password: z.string().min(1).max(128) }).strict();
