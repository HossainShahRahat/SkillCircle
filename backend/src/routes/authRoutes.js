import { Router } from 'express';
import { login, me, signup } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { createRateLimiter } from '../middleware/rateLimitMiddleware.js';
import { validateRequest, validators } from '../middleware/validationMiddleware.js';

export const authRoutes = Router();

const authLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 15,
  keyPrefix: 'auth',
  message: 'Too many authentication attempts. Please wait a minute.',
});

authRoutes.post(
  '/register',
  authLimiter,
  validateRequest({
    body: [
      validators.requiredString('name', 'Name'),
      validators.requiredString('email', 'Email'),
      validators.email('email'),
      validators.requiredString('password', 'Password'),
      validators.minLength('password', 8, 'Password'),
    ],
  }),
  signup,
);
authRoutes.post(
  '/signup',
  authLimiter,
  validateRequest({
    body: [
      validators.requiredString('name', 'Name'),
      validators.requiredString('email', 'Email'),
      validators.email('email'),
      validators.requiredString('password', 'Password'),
      validators.minLength('password', 8, 'Password'),
    ],
  }),
  signup,
);
authRoutes.post(
  '/login',
  authLimiter,
  validateRequest({
    body: [
      validators.requiredString('email', 'Email'),
      validators.email('email'),
      validators.requiredString('password', 'Password'),
    ],
  }),
  login,
);
authRoutes.get('/me', requireAuth, me);
