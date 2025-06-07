import apiClient from './apiClient';

type MessageHandler = (data: any) => void;
type ErrorHandler = (error: any) => void;
type ConnectionHandler = () => void;

interface WebSocketMessage {
  type: string;
  payload: any;
}

/**
 * WebSocket Service for real-time updates
 */
class WebSocketService {
  private socket: WebSocket | null = null;
  private isConnected = false;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: any = null;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private connectHandlers: Set<ConnectionHandler> = new Set();
  private disconnectHandlers: Set<ConnectionHandler> = new Set();

  /**
   * Connect to the WebSocket server
   */
  public connect(): Promise<void> {
    if (this.isConnected || this.isConnecting) {
      return Promise.resolve();
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = process.env.NODE_ENV === 'production'
        ? 'api.smarttasker.app'
        : window.location.host;
      
      // Create a new WebSocket connection
      this.socket = new WebSocket(`${protocol}//${host}/api/ws`);

      // Set up event listeners
      this.socket.onopen = () => {
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Authenticate with token
        this.authenticate();
        
        // Notify connect handlers
        this.connectHandlers.forEach(handler => handler());
        
        resolve();
      };

      this.socket.onclose = (event) => {
        this.isConnected = false;
        this.isConnecting = false;
        
        // Notify disconnect handlers
        this.disconnectHandlers.forEach(handler => handler());
        
        // Try to reconnect
        if (!event.wasClean) {
          this.reconnect();
        }
      };

      this.socket.onerror = (error) => {
        this.isConnecting = false;
        
        // Notify error handlers
        this.errorHandlers.forEach(handler => handler(error));
        
        reject(error);
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          
          // Find handlers for this message type
          const handlers = this.messageHandlers.get(message.type);
          if (handlers) {
            handlers.forEach(handler => handler(message.payload));
          }
          
          // Also notify handlers registered for 'all' messages
          const allHandlers = this.messageHandlers.get('all');
          if (allHandlers) {
            allHandlers.forEach(handler => handler(message));
          }
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
        }
      };
    });
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
      this.isConnecting = false;
      
      // Clear reconnect timeout
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
    }
  }

  /**
   * Add a message handler for a specific type
   * @param type Message type to listen for, or 'all' for all messages
   * @param handler Handler function
   * @returns Unsubscribe function
   */
  public addMessageHandler(type: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    
    const handlers = this.messageHandlers.get(type)!;
    handlers.add(handler);
    
    // Return unsubscribe function
    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.messageHandlers.delete(type);
      }
    };
  }

  /**
   * Add an error handler
   * @param handler Error handler function
   * @returns Unsubscribe function
   */
  public addErrorHandler(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  /**
   * Add a connection handler
   * @param handler Connection handler function
   * @returns Unsubscribe function
   */
  public addConnectHandler(handler: ConnectionHandler): () => void {
    this.connectHandlers.add(handler);
    return () => this.connectHandlers.delete(handler);
  }

  /**
   * Add a disconnection handler
   * @param handler Disconnection handler function
   * @returns Unsubscribe function
   */
  public addDisconnectHandler(handler: ConnectionHandler): () => void {
    this.disconnectHandlers.add(handler);
    return () => this.disconnectHandlers.delete(handler);
  }

  /**
   * Send a message through the WebSocket
   * @param type Message type
   * @param payload Message payload
   * @returns Promise that resolves when the message is sent
   */
  public send(type: string, payload?: any): Promise<void> {
    if (!this.isConnected || !this.socket) {
      return Promise.reject(new Error('WebSocket is not connected'));
    }
    
    const message: WebSocketMessage = {
      type,
      payload: payload || {},
    };
    
    return new Promise((resolve, reject) => {
      try {
        this.socket!.send(JSON.stringify(message));
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Authenticate with the WebSocket server
   */
  private async authenticate(): Promise<void> {
    try {
      // Get the stored auth token
      const token = localStorage.getItem('authToken');
      
      if (token) {
        // Send the token to the WebSocket server
        await this.send('authenticate', { token });
      } else {
        // Try to get a new token
        const tokenResponse = await apiClient.get('/auth/token');
        if (tokenResponse.data?.token) {
          apiClient.setAuthToken(tokenResponse.data.token);
          await this.send('authenticate', { token: tokenResponse.data.token });
        }
      }
    } catch (error) {
      console.error('WebSocket authentication failed:', error);
    }
  }

  /**
   * Try to reconnect to the WebSocket server
   */
  private reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Maximum WebSocket reconnect attempts reached');
      return;
    }
    
    const delay = Math.pow(2, this.reconnectAttempts) * 1000;
    this.reconnectAttempts++;
    
    console.log(`Reconnecting WebSocket in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch(console.error);
    }, delay);
  }

  /**
   * Check if the WebSocket is connected
   */
  public isWebSocketConnected(): boolean {
    return this.isConnected;
  }
}

// Create a singleton instance
const websocketService = new WebSocketService();

export default websocketService; 