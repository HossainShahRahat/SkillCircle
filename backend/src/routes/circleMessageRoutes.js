import { Router } from 'express';
import {
  createCircleMessage,
  listCircleMessages,
} from '../controllers/messageController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { createRateLimiter } from '../middleware/rateLimitMiddleware.js';
import { validateRequest, validators } from '../middleware/validationMiddleware.js';

export const circleMessageRoutes = Router();

const messageLimiter = createRateLimiter({
  windowMs: 10_000,
  max: 20,
  keyPrefix: 'circle-message',
  message: 'Too many circle messages sent too quickly.',
});

circleMessageRoutes.get('/:circleId/messages', requireAuth, listCircleMessages);
circleMessageRoutes.post(
  '/:circleId/message',
  requireAuth,
  messageLimiter,
  validateRequest({
    body: [validators.optionalString('content', 4000, 'content')],
    params: [validators.requiredString('circleId', 'circleId')],
  }),
  createCircleMessage,
);
