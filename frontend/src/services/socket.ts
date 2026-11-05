import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || window.location.origin;

class SocketService {
  private socket: Socket | null = null;

  connect(token?: string): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    const currentToken = token || localStorage.getItem('token') || '';

    this.socket = io(WS_URL, {
      auth: { token: currentToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('⚡ Connected to CodeArena Socket Server:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from socket server:', reason);
    });

    return this.socket;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
