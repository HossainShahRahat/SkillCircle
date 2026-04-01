import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/profileController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

export const profileRoutes = Router();

profileRoutes.get('/', requireAuth, getProfile);
profileRoutes.put('/', requireAuth, updateProfile);

