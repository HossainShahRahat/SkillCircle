import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { repository } from '../models/repository.js';

export async function authenticateSocket(socket, next) {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required.'));
    }

    const payload = jwt.verify(token, config.jwtSecret);
    const user = await repository.findUserById(payload.userId);
    if (!user) {
      return next(new Error('Invalid user.'));
    }

    socket.user = user;
    return next();
  } catch (_error) {
    return next(new Error('Authentication required.'));
  }
}
