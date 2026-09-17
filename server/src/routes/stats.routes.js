import { Router } from 'express';
import { z } from 'zod';
import { requireJwt } from '../middleware/requireJwt.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { VALID_RANGES } from '../services/stats.service.js';
import { stats } from '../controllers/stats.controller.js';

export const statsRouter = Router();

statsRouter.use(requireJwt);

const rangeSchema = z.object({
  range: z.enum(VALID_RANGES).default('6h'),
});

// GET /api/endpoints/:id/stats?range=24h
statsRouter.get('/:id/stats', validate(rangeSchema, 'query'), asyncHandler(stats));
