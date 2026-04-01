import { Router } from 'express';
import { toggleReaction } from '../controllers/reactionController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { createRateLimiter } from '../middleware/rateLimitMiddleware.js';
import { validateRequest, validators } from '../middleware/validationMiddleware.js';

export const reactionRoutes = Router();

reactionRoutes.post(
  '/',
  requireAuth,
  createRateLimiter({
    windowMs: 10_000,
    max: 30,
    keyPrefix: 'feed-reaction',
    message: 'Too many reactions. Please slow down.',
  }),
  validateRequest({
    body: [
      validators.requiredString('referenceType', 'referenceType'),
      validators.requiredString('referenceId', 'referenceId'),
      validators.requiredString('reactionType', 'reactionType'),
    ],
  }),
  toggleReaction,
);
