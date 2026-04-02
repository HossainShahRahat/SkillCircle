import { Router } from 'express';
import {
  createRetentionGoal,
  deleteRetentionGoal,
  getRetention,
  saveSkillProgress,
  updateRetentionGoal,
} from '../controllers/retentionController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

export const retentionRoutes = Router();

retentionRoutes.use(requireAuth);
retentionRoutes.get('/', getRetention);
retentionRoutes.post('/goals', createRetentionGoal);
retentionRoutes.patch('/goals/:goalId', updateRetentionGoal);
retentionRoutes.delete('/goals/:goalId', deleteRetentionGoal);
retentionRoutes.put('/skills', saveSkillProgress);
