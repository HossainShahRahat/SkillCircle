import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { repository } from '../models/repository.js';

export async function attachCurrentUser(req, _res, next) {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  try {
    const token = header.replace('Bearer ', '');
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = await repository.findUserById(payload.userId);
    return next();
  } catch (_error) {
    req.user = null;
    return next();
  }
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  return next();
}

