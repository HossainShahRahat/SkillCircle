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
  searchCircleMessages,
  searchDirectMessages,
  uploadChatMedia,
} from '../controllers/messageController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

export const messageRoutes = Router();

messageRoutes.get('/direct-chats', requireAuth, listDirectChats);
messageRoutes.post('/direct-chats', requireAuth, createOrFetchDirectChat);
messageRoutes.post('/direct-chats/with/:userId', requireAuth, createOrFetchDirectChat);
messageRoutes.get('/direct-chats/:chatId/messages', requireAuth, listDirectMessages);
messageRoutes.post('/direct-chats/:chatId/messages', requireAuth, createDirectMessage);
messageRoutes.patch('/direct-chats/:chatId/status', requireAuth, markDirectMessages);
messageRoutes.get('/direct-chats/:chatId/search', requireAuth, searchDirectMessages);
messageRoutes.post('/direct-messages/:messageId/reactions', requireAuth, reactToDirectMessage);

messageRoutes.get('/circles/:circleId', requireAuth, listCircleMessages);
messageRoutes.post('/circles/:circleId', requireAuth, createCircleMessage);
messageRoutes.patch('/circles/:circleId/status', requireAuth, markCircleMessages);
messageRoutes.get('/circles/:circleId/search', requireAuth, searchCircleMessages);
messageRoutes.post('/circle-messages/:messageId/reactions', requireAuth, reactToCircleMessage);

messageRoutes.post('/media', requireAuth, uploadChatMedia);

messageRoutes.get('/:circleId', requireAuth, listMessages);
messageRoutes.post('/', requireAuth, createMessage);
