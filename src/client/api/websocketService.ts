
import { io, Socket } from 'socket.io-client';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: Date;
}

export interface TaskUpdate {
  taskId: string;
  updates: {
    status?: string;
    priority?: string;
    assignee?: string;
    dueDate?: string;
  };
  updatedBy: string;
}

export interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  userId: string;
  data?: any;
}

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private messageHandlers: Map<string, ((data: any) => void)[]> = new Map();
  private authToken: string | null = null;

  constructor() {
    this.initializeConnection();
  }

  private initializeConnection() {
    if (this.isConnecting || this.socket?.connected) {
      return;
    }

    this.isConnecting = true;

    try {
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';
      
      this.socket = io(wsUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
        auth: {
          token: this.authToken
        }
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to initialize WebSocket connection:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      
      // Join user's personal room
      if (this.authToken) {
        this.socket?.emit('join-user-room');
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnecting = false;
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        this.scheduleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    });

    // Handle incoming messages
    this.socket.on('task-update', (data: TaskUpdate) => {
      this.handleMessage('task-update', data);
    });

    this.socket.on('notification', (data: NotificationData) => {
      this.handleMessage('notification', data);
    });

    this.socket.on('team-update', (data: any) => {
      this.handleMessage('team-update', data);
    });

    this.socket.on('user-status', (data: any) => {
      this.handleMessage('user-status', data);
    });
  }

  private handleMessage(type: string, data: any) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error handling ${type} message:`, error);
        }
      });
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.initializeConnection();
    }, delay);
  }

  public setAuthToken(token: string) {
    this.authToken = token;
    if (this.socket?.connected) {
      this.socket.emit('authenticate', { token });
    }
  }

  public connect() {
    if (!this.socket || this.socket.disconnected) {
      this.initializeConnection();
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
  }

  public subscribe(eventType: string, handler: (data: any) => void) {
    if (!this.messageHandlers.has(eventType)) {
      this.messageHandlers.set(eventType, []);
    }
    this.messageHandlers.get(eventType)!.push(handler);
  }

  public unsubscribe(eventType: string, handler?: (data: any) => void) {
    if (!this.messageHandlers.has(eventType)) return;

    if (handler) {
      const handlers = this.messageHandlers.get(eventType)!;
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    } else {
      this.messageHandlers.delete(eventType);
    }
  }

  public emit(eventType: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(eventType, data);
    } else {
      console.warn('WebSocket not connected, cannot emit event:', eventType);
    }
  }

  public joinRoom(roomId: string) {
    this.emit('join-room', { roomId });
  }

  public leaveRoom(roomId: string) {
    this.emit('leave-room', { roomId });
  }

  public sendTaskUpdate(taskUpdate: TaskUpdate) {
    this.emit('task-update', taskUpdate);
  }

  public sendNotification(notification: NotificationData) {
    this.emit('notification', notification);
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;
