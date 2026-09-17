import { Router } from 'express';
import * as controller from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { requireJwt } from '../middleware/requireJwt.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { loginSchema, signupSchema } from '../validators/auth.schema.js';

export const authRouter = Router();

authRouter.post('/signup', validate(signupSchema), asyncHandler(controller.signup));
authRouter.post('/login', validate(loginSchema), asyncHandler(controller.login));
authRouter.get('/me', requireJwt, asyncHandler(controller.me));
authRouter.post('/api-key/regenerate', requireJwt, asyncHandler(controller.regenerateApiKey));
