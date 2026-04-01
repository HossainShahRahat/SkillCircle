import { io } from 'socket.io-client';

let socketInstance = null;

export function getSocket(token) {
  if (!token) return null;

  if (!socketInstance) {
    socketInstance = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000', {
      autoConnect: false,
      transports: ['websocket'],
    });
  }

  socketInstance.auth = { token };
  if (!socketInstance.connected) {
    socketInstance.connect();
  }

  return socketInstance;
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
