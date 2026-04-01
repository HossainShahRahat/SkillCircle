import { Router } from 'express';
import {
  createCircle,
  getCircle,
  joinCircle,
  listCircles,
} from '../controllers/circleController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

export const circleRoutes = Router();

circleRoutes.get('/', listCircles);
circleRoutes.get('/:circleId', getCircle);
circleRoutes.post('/', requireAuth, createCircle);
circleRoutes.post('/:circleId/join', requireAuth, joinCircle);
