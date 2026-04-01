import { Router } from 'express';
import { toggleReaction } from '../controllers/reactionController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

export const reactionRoutes = Router();

reactionRoutes.post('/', requireAuth, toggleReaction);

