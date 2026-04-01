import { Router } from 'express';
import {
  createMessage,
  createOrFetchDirectChat,
  createDirectMessage,
  createCircleMessage,
  listDirectChats,
  listDirectMessages,
  listMessages,
  listCircleMessages,
  markCircleMessages,
  markDirectMessages,
  reactToCircleMessage,
  reactToDirectMessage,
  reactToMessage,
  searchCircleMessages,
  searchDirectMessages,
  syncOfflineMessages,
  updateMessageStatusById,
  uploadChatMedia,
} from '../controllers/messageController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { createRateLimiter } from '../middleware/rateLimitMiddleware.js';
import { validateRequest, validators } from '../middleware/validationMiddleware.js';

export const messageRoutes = Router();

const messageLimiter = createRateLimiter({
  windowMs: 10_000,
  max: 20,
  keyPrefix: 'message',
  message: 'Too many messages sent too quickly.',
});

messageRoutes.get('/direct-chats', requireAuth, listDirectChats);
messageRoutes.post('/direct-chats', requireAuth, createOrFetchDirectChat);
messageRoutes.post('/direct-chats/with/:userId', requireAuth, createOrFetchDirectChat);
messageRoutes.get('/direct-chats/:chatId/messages', requireAuth, listDirectMessages);
messageRoutes.post('/direct-chats/:chatId/messages', requireAuth, messageLimiter, createDirectMessage);
messageRoutes.patch('/direct-chats/:chatId/status', requireAuth, markDirectMessages);
messageRoutes.get('/direct-chats/:chatId/search', requireAuth, searchDirectMessages);
messageRoutes.post('/direct-messages/:messageId/reactions', requireAuth, reactToDirectMessage);

messageRoutes.get('/circles/:circleId', requireAuth, listCircleMessages);
messageRoutes.post('/circles/:circleId', requireAuth, messageLimiter, createCircleMessage);
messageRoutes.patch('/circles/:circleId/status', requireAuth, markCircleMessages);
messageRoutes.get('/circles/:circleId/search', requireAuth, searchCircleMessages);
messageRoutes.post('/circle-messages/:messageId/reactions', requireAuth, reactToCircleMessage);

messageRoutes.post('/media', requireAuth, uploadChatMedia);
messageRoutes.post(
  '/offline-sync',
  requireAuth,
  validateRequest({
    body: [
      (body) => (Array.isArray(body.messages) ? null : 'messages must be an array.'),
    ],
  }),
  syncOfflineMessages,
);
messageRoutes.post('/:messageId/reaction', requireAuth, reactToMessage);
messageRoutes.post(
  '/:messageId/status',
  requireAuth,
  validateRequest({
    body: [
      validators.requiredString('scope', 'scope'),
      validators.requiredString('targetId', 'targetId'),
      validators.enum('scope', ['direct', 'circle'], 'scope'),
      validators.enum('status', ['delivered', 'read'], 'status'),
    ],
  }),
  updateMessageStatusById,
);

messageRoutes.get('/:circleId', requireAuth, listMessages);
messageRoutes.post('/', requireAuth, messageLimiter, createMessage);
