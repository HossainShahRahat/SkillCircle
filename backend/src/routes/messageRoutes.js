import { Router } from 'express';
import { createMessage, listMessages } from '../controllers/messageController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

export const messageRoutes = Router();

messageRoutes.get('/:circleId', requireAuth, listMessages);
messageRoutes.post('/', requireAuth, createMessage);

