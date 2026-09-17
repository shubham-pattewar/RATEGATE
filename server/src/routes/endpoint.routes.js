import { Router } from 'express';
import { requireJwt } from '../middleware/requireJwt.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createEndpointSchema, updateEndpointSchema } from '../validators/endpoint.schema.js';
import * as controller from '../controllers/endpoint.controller.js';

export const endpointRouter = Router();

// All endpoint management routes require a valid dashboard JWT.
endpointRouter.use(requireJwt);

endpointRouter.post('/', validate(createEndpointSchema), asyncHandler(controller.create));
endpointRouter.get('/', asyncHandler(controller.list));
endpointRouter.get('/:id', asyncHandler(controller.get));
endpointRouter.patch('/:id', validate(updateEndpointSchema), asyncHandler(controller.update));
endpointRouter.delete('/:id', asyncHandler(controller.remove));
