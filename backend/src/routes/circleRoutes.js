import { Router } from 'express';
import {
  createCircle,
  getCircle,
  joinCircle,
  joinCircleByCode,
  leaveCircle,
  listCircles,
  searchCircle,
  updateCircleMemberRole,
} from '../controllers/circleController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requireCircleRole } from '../middleware/rbacMiddleware.js';
import { validateRequest, validators } from '../middleware/validationMiddleware.js';

export const circleRoutes = Router();

circleRoutes.get('/', listCircles);
circleRoutes.get('/:circleId/search', searchCircle);
circleRoutes.get('/:circleId', getCircle);
circleRoutes.post(
  '/',
  requireAuth,
  validateRequest({
    body: [
      validators.requiredString('name', 'Circle name'),
      validators.requiredString('description', 'Circle description'),
    ],
  }),
  createCircle,
);
circleRoutes.post(
  '/join-by-code',
  requireAuth,
  validateRequest({ body: [validators.requiredString('code', 'Invite code')] }),
  joinCircleByCode,
);
circleRoutes.post('/:circleId/join', requireAuth, joinCircle);
circleRoutes.patch(
  '/:circleId/members/:userId/role',
  requireAuth,
  requireCircleRole(['admin']),
  validateRequest({ body: [validators.enum('role', ['admin', 'moderator', 'member'], 'role')] }),
  updateCircleMemberRole,
);
circleRoutes.delete('/:circleId/leave', requireAuth, leaveCircle);
