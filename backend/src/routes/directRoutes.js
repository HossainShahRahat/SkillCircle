import { Router } from 'express';
import {
  createDirectMessage,
  createOrFetchDirectChat,
  listDirectMessages,
} from '../controllers/messageController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { createRateLimiter } from '../middleware/rateLimitMiddleware.js';
import { validateRequest, validators } from '../middleware/validationMiddleware.js';

export const directRoutes = Router();

const messageLimiter = createRateLimiter({
  windowMs: 10_000,
  max: 12,
  keyPrefix: 'direct-message',
  message: 'Too many direct messages sent too quickly.',
});

directRoutes.get('/:chatId/messages', requireAuth, listDirectMessages);
directRoutes.post(
  '/:chatId/message',
  requireAuth,
  messageLimiter,
  validateRequest({
    body: [validators.optionalString('content', 4000, 'content')],
    params: [validators.requiredString('chatId', 'chatId')],
  }),
  createDirectMessage,
);
directRoutes.post(
  '/with/:userId',
  requireAuth,
  validateRequest({ params: [validators.requiredString('userId', 'userId')] }),
  createOrFetchDirectChat,
);
