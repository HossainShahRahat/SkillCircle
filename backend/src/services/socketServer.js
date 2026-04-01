import { Server } from 'socket.io';
import { config } from '../config.js';
import { authenticateSocket } from './socketAuth.js';
import { registerChatNamespaces, registerRootSocketHandlers } from './socketHandlers.js';

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

  ioInstance.use(authenticateSocket);
  ioInstance.of('/direct').use(authenticateSocket);
  ioInstance.of('/circle').use(authenticateSocket);

  registerRootSocketHandlers(ioInstance);
  registerChatNamespaces(ioInstance);

  return ioInstance;
}

export function getSocketServer() {
  return ioInstance;
}

export function emitToUser(userId, event, payload) {
  if (!ioInstance || !userId) return;
  ioInstance.to(`user:${userId}`).emit(event, payload);
  ioInstance.of('/direct').to(`user:${userId}`).emit(event, payload);
  ioInstance.of('/circle').to(`user:${userId}`).emit(event, payload);
}

export function emitToCircle(circleId, event, payload) {
  if (!ioInstance || !circleId) return;
  ioInstance.to(`circle:${circleId}`).emit(event, payload);
  ioInstance.of('/circle').to(`circle:${circleId}`).emit(event, payload);
}

export function emitToDirectChat(chatId, event, payload) {
  if (!ioInstance || !chatId) return;
  ioInstance.to(`direct:${chatId}`).emit(event, payload);
  ioInstance.of('/direct').to(`direct:${chatId}`).emit(event, payload);
}

export function emitGlobal(event, payload) {
  if (!ioInstance) return;
  ioInstance.emit(event, payload);
}
