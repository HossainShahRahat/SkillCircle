import { Router } from 'express';
import {
  createCircle,
  getCircle,
  joinCircle,
  joinCircleByCode,
  leaveCircle,
  listCircles,
} from '../controllers/circleController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

export const circleRoutes = Router();

circleRoutes.get('/', listCircles);
circleRoutes.get('/:circleId', getCircle);
circleRoutes.post('/', requireAuth, createCircle);
circleRoutes.post('/join-by-code', requireAuth, joinCircleByCode);
circleRoutes.post('/:circleId/join', requireAuth, joinCircle);
circleRoutes.delete('/:circleId/leave', requireAuth, leaveCircle);
