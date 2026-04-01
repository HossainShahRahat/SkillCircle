import { logger } from './logger.js';

const typingRateLimits = new Map();

function canEmitTyping(socketId, targetId, isTyping) {
  const key = `${socketId}:${targetId}:${isTyping ? 'start' : 'stop'}`;
  const now = Date.now();
  const previous = typingRateLimits.get(key) || 0;
  const minInterval = isTyping ? 800 : 250;
  if (now - previous < minInterval) {
    return false;
  }
  typingRateLimits.set(key, now);
  return true;
}

function registerNamespaceHandlers(namespace, { scope, roomPrefix }) {
  namespace.on('connection', (socket) => {
    socket.join(`user:${socket.user.id}`);
    logger.info('Socket connected', { scope, userId: socket.user.id, socketId: socket.id });

    socket.on('join_room', (targetId) => {
      if (!targetId) return;
      socket.join(`${roomPrefix}:${targetId}`);
    });

    socket.on('leave_room', (targetId) => {
      if (!targetId) return;
      socket.leave(`${roomPrefix}:${targetId}`);
    });

    socket.on('typing', ({ targetId, isTyping }) => {
      if (!targetId) return;
      if (!canEmitTyping(socket.id, `${scope}:${targetId}`, Boolean(isTyping))) return;
      const payload = {
        scope,
        targetId,
        isTyping: Boolean(isTyping),
        user: socket.user,
      };
      socket.to(`${roomPrefix}:${targetId}`).emit(Boolean(isTyping) ? 'typing_start' : 'typing_stop', payload);
      socket.to(`${roomPrefix}:${targetId}`).emit('typing', payload);
    });

    socket.on('disconnect', () => {
      logger.info('Socket disconnected', { scope, userId: socket.user.id, socketId: socket.id });
    });
  });
}

export function registerRootSocketHandlers(io) {
  io.on('connection', (socket) => {
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
      if (!canEmitTyping(socket.id, `${scope}:${targetId}`, Boolean(isTyping))) return;
      const room = scope === 'direct' ? `direct:${targetId}` : `circle:${targetId}`;
      const payload = {
        scope,
        targetId,
        isTyping: Boolean(isTyping),
        user: socket.user,
      };
      socket.to(room).emit(Boolean(isTyping) ? 'typing_start' : 'typing_stop', payload);
      socket.to(room).emit('typing', payload);
    });
  });
}

export function registerChatNamespaces(io) {
  registerNamespaceHandlers(io.of('/direct'), { scope: 'direct', roomPrefix: 'direct' });
  registerNamespaceHandlers(io.of('/circle'), { scope: 'circle', roomPrefix: 'circle' });
}
