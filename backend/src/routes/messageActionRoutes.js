import { Router } from 'express';
import {
  reactToMessage,
  updateMessageStatusById,
} from '../controllers/messageController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { createRateLimiter } from '../middleware/rateLimitMiddleware.js';
import { validateRequest, validators } from '../middleware/validationMiddleware.js';

export const messageActionRoutes = Router();

messageActionRoutes.post(
  '/:messageId/reaction',
  requireAuth,
  createRateLimiter({
    windowMs: 10_000,
    max: 30,
    keyPrefix: 'message-reaction',
    message: 'Too many reactions. Please slow down.',
  }),
  validateRequest({
    params: [validators.requiredString('messageId', 'messageId')],
    body: [
      validators.requiredString('scope', 'scope'),
      validators.requiredString('emoji', 'emoji'),
      validators.enum('scope', ['direct', 'circle'], 'scope'),
    ],
  }),
  reactToMessage,
);

messageActionRoutes.post(
  '/:messageId/status',
  requireAuth,
  validateRequest({
    params: [validators.requiredString('messageId', 'messageId')],
    body: [
      validators.requiredString('scope', 'scope'),
      validators.requiredString('targetId', 'targetId'),
      validators.requiredString('status', 'status'),
      validators.enum('scope', ['direct', 'circle'], 'scope'),
      validators.enum('status', ['delivered', 'read'], 'status'),
    ],
  }),
  updateMessageStatusById,
);
