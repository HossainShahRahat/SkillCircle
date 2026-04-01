import { Router } from 'express';
import { getCircleAnalytics, getUserAnalytics } from '../controllers/analyticsController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

export const analyticsRoutes = Router();

analyticsRoutes.get('/user', requireAuth, getUserAnalytics);
analyticsRoutes.get('/circles/:circleId', requireAuth, getCircleAnalytics);
