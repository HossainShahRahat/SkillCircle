import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { listNotifications, markNotificationRead } from '../controllers/notificationController.js';

export const notificationRoutes = Router();

notificationRoutes.get('/', requireAuth, listNotifications);
notificationRoutes.patch('/:notificationId/read', requireAuth, markNotificationRead);

