import { io, Socket } from 'socket.io-client';

const RENDER_BACKEND_URL = 'https://codearena-cca4.onrender.com';

const WS_URL =
  import.meta.env.VITE_WS_URL ||
  (typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000'
    : RENDER_BACKEND_URL);

class SocketService {
  private socket: Socket | null = null;
  private currentToken: string = '';

  connect(token?: string): Socket {
    const currentToken = token || localStorage.getItem('token') || '';
    const tokenChanged = currentToken && currentToken !== this.currentToken;
    this.currentToken = currentToken;

    // If socket instance already exists, reuse it and update auth token if provided
    if (this.socket) {
      if (this.socket.auth && typeof this.socket.auth === 'object') {
        (this.socket.auth as any).token = currentToken;
      }
      if (tokenChanged && this.socket.connected) {
        // Explicitly notify server of authenticated identity
        this.socket.emit('authenticate', { token: currentToken });
      } else if (this.socket.disconnected) {
        this.socket.connect();
      }
      return this.socket;
    }

    this.socket = io(WS_URL, {
      auth: { token: currentToken },
      query: currentToken ? { token: currentToken } : {},
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('⚡ Connected to CodeArena Socket Server:', this.socket?.id);
      const activeToken = this.currentToken || localStorage.getItem('token') || '';
      if (activeToken) {
        this.socket?.emit('authenticate', { token: activeToken });
      }
    });

    this.socket.on('connect_error', (error) => {
      console.warn('⚠️ Socket connection error (server may be waking up):', error.message);
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
