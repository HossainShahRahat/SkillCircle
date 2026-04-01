import { Router } from 'express';
import { getProfile, getPublicProfile, updateProfile } from '../controllers/profileController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

export const profileRoutes = Router();

profileRoutes.get('/:userId', getPublicProfile);
profileRoutes.get('/', requireAuth, getProfile);
profileRoutes.put('/', requireAuth, updateProfile);
