import { chatRepository } from '../models/chatRepository.js';
import { repository } from '../models/repository.js';
import { logger } from './logger.js';

const typingRateLimits = new Map();

async function canJoinRoom(scope, targetId, userId) {
  if (scope === 'circle') {
    const circle = await repository.getCircle(targetId, userId);
    return Boolean(circle?.joined);
  }

  if (scope === 'direct') {
    return Boolean(await chatRepository.canAccessDirectChat(targetId, userId));
  }

  return false;
}

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

    socket.on('join_room', async (targetId) => {
      if (!targetId) return;
      const allowed = await canJoinRoom(scope, targetId, socket.user.id).catch(() => false);
      if (!allowed) {
        logger.warn('Socket room join denied', { scope, targetId, userId: socket.user.id, socketId: socket.id });
        return;
      }
      socket.join(`${roomPrefix}:${targetId}`);
    });

    socket.on('leave_room', (targetId) => {
      if (!targetId) return;
      socket.leave(`${roomPrefix}:${targetId}`);
    });

    socket.on('typing', async ({ targetId, isTyping }) => {
      if (!targetId) return;
      const allowed = await canJoinRoom(scope, targetId, socket.user.id).catch(() => false);
      if (!allowed) return;
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

    socket.on('join_circle_room', async (circleId) => {
      if (!circleId) return;
      const allowed = await canJoinRoom('circle', circleId, socket.user.id).catch(() => false);
      if (!allowed) {
        logger.warn('Socket room join denied', { scope: 'circle', targetId: circleId, userId: socket.user.id, socketId: socket.id });
        return;
      }
      socket.join(`circle:${circleId}`);
    });

    socket.on('leave_circle_room', (circleId) => {
      if (circleId) {
        socket.leave(`circle:${circleId}`);
      }
    });

    socket.on('join_direct_room', async (chatId) => {
      if (!chatId) return;
      const allowed = await canJoinRoom('direct', chatId, socket.user.id).catch(() => false);
      if (!allowed) {
        logger.warn('Socket room join denied', { scope: 'direct', targetId: chatId, userId: socket.user.id, socketId: socket.id });
        return;
      }
      socket.join(`direct:${chatId}`);
    });

    socket.on('leave_direct_room', (chatId) => {
      if (chatId) {
        socket.leave(`direct:${chatId}`);
      }
    });

    socket.on('typing', async ({ scope, targetId, isTyping }) => {
      if (!scope || !targetId) return;
      const allowed = await canJoinRoom(scope, targetId, socket.user.id).catch(() => false);
      if (!allowed) return;
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
