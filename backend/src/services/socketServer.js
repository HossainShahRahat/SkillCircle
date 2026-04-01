import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { repository } from '../models/repository.js';

let ioInstance = null;

function buildCorsOrigin(origin, callback) {
  if (!origin || config.clientUrls.includes(origin)) {
    callback(null, true);
    return;
  }
  callback(new Error('CORS origin not allowed.'));
}

export function initializeSocketServer(httpServer) {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: buildCorsOrigin,
      credentials: true,
    },
  });

  ioInstance.use(async (socket, next) => {
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
  });

  ioInstance.on('connection', (socket) => {
    socket.join(`user:${socket.user.id}`);

    socket.on('join_circle_room', (circleId) => {
      if (circleId) {
        socket.join(`circle:${circleId}`);
      }
    });

    socket.on('leave_circle_room', (circleId) => {
      if (circleId) {
        socket.leave(`circle:${circleId}`);
      }
    });

    socket.on('join_direct_room', (chatId) => {
      if (chatId) {
        socket.join(`direct:${chatId}`);
      }
    });

    socket.on('leave_direct_room', (chatId) => {
      if (chatId) {
        socket.leave(`direct:${chatId}`);
      }
    });

    socket.on('typing', ({ scope, targetId, isTyping }) => {
      if (!scope || !targetId) return;
      const room = scope === 'direct' ? `direct:${targetId}` : `circle:${targetId}`;
      socket.to(room).emit('typing', {
        scope,
        targetId,
        isTyping: Boolean(isTyping),
        user: socket.user,
      });
    });
  });

  return ioInstance;
}

export function getSocketServer() {
  return ioInstance;
}

export function emitToUser(userId, event, payload) {
  if (!ioInstance || !userId) return;
  ioInstance.to(`user:${userId}`).emit(event, payload);
}

export function emitToCircle(circleId, event, payload) {
  if (!ioInstance || !circleId) return;
  ioInstance.to(`circle:${circleId}`).emit(event, payload);
}

export function emitToDirectChat(chatId, event, payload) {
  if (!ioInstance || !chatId) return;
  ioInstance.to(`direct:${chatId}`).emit(event, payload);
}

export function emitGlobal(event, payload) {
  if (!ioInstance) return;
  ioInstance.emit(event, payload);
}
