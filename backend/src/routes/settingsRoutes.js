import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

export const settingsRoutes = Router();

settingsRoutes.get('/', requireAuth, getSettings);
settingsRoutes.put('/', requireAuth, updateSettings);
