import { Router } from 'express';
import { uploadChatMedia } from '../controllers/messageController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { createRateLimiter } from '../middleware/rateLimitMiddleware.js';
import { validateRequest, validators } from '../middleware/validationMiddleware.js';

export const mediaRoutes = Router();

mediaRoutes.post(
  '/upload',
  requireAuth,
  createRateLimiter({
    windowMs: 60_000,
    max: 20,
    keyPrefix: 'media-upload',
    message: 'Too many media uploads. Please slow down.',
  }),
  validateRequest({
    body: [
      (body) => (!body.fileName && !body.sourceUrl ? 'fileName or sourceUrl is required.' : null),
      validators.optionalString('fileName', 255, 'fileName'),
    ],
  }),
  uploadChatMedia,
);
