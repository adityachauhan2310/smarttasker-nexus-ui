import { Server as HttpServer } from 'http';
import WebSocket from 'ws';
import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import config from '../config/config';
import { User } from '../models/User';
import { supabase } from '../config/database';

interface AuthenticatedClient extends WebSocket {
  isAlive: boolean;
  userId?: string;
  teamIds?: string[];
  pingTimeout?: NodeJS.Timeout;
}

interface WebSocketMessage {
  type: string;
  payload: any;
}

/**
 * WebSocket Service for real-time communication
 */
class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, Set<AuthenticatedClient>> = new Map();
  private teamClients: Map<string, Set<AuthenticatedClient>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize the WebSocket server
   * @param server HTTP server instance
   */
  public initialize(server: HttpServer): void {
    // Create WebSocket server
    this.wss = new WebSocketServer({
      server,
      path: '/api/ws',
    });

    console.log('WebSocket server initialized');

    // Handle new connections
    this.wss.on('connection', (ws: WebSocket) => {
      const client = ws as AuthenticatedClient;
      
      // Set up client state
      client.isAlive = true;
      
      // Set up ping timeout for this client
      this.setupPingTimeout(client);
      
      // Handle pongs
      client.on('pong', () => {
        client.isAlive = true;
      });
      
      // Handle client messages
      client.on('message', (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString()) as WebSocketMessage;
          this.handleMessage(client, message);
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
        }
      });
      
      // Handle client disconnect
      client.on('close', () => {
        this.handleDisconnect(client);
      });
      
      // Handle errors
      client.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });

    // Start the heartbeat mechanism
    this.startHeartbeat();
  }

  /**
   * Stop the WebSocket server
   */
  public stop(): void {
    if (this.wss) {
      // Clear the heartbeat interval
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
      
      // Close all connections
      this.wss.clients.forEach(client => {
        try {
          client.terminate();
        } catch (error) {
          console.error('Error terminating WebSocket client:', error);
        }
      });
      
      // Close the server
      this.wss.close();
      this.wss = null;
      
      console.log('WebSocket server stopped');
    }
  }

  /**
   * Send a message to a specific user
   * @param userId User ID
   * @param type Message type
   * @param payload Message payload
   */
  public sendToUser(userId: string, type: string, payload: any): void {
    const userClients = this.clients.get(userId);
    if (userClients) {
      const message = JSON.stringify({ type, payload });
      userClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  }

  /**
   * Send a message to all members of a team
   * @param teamId Team ID
   * @param type Message type
   * @param payload Message payload
   */
  public sendToTeam(teamId: string, type: string, payload: any): void {
    const teamClients = this.teamClients.get(teamId);
    if (teamClients) {
      const message = JSON.stringify({ type, payload });
      teamClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  }

  /**
   * Send a message to all connected clients
   * @param type Message type
   * @param payload Message payload
   */
  public broadcast(type: string, payload: any): void {
    if (!this.wss) return;
    
    const message = JSON.stringify({ type, payload });
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  /**
   * Handle incoming WebSocket messages
   * @param client WebSocket client
   * @param message Message object
   */
  private async handleMessage(client: AuthenticatedClient, message: WebSocketMessage): Promise<void> {
    const { type, payload } = message;
    
    // Handle authentication
    if (type === 'authenticate') {
      await this.authenticateClient(client, payload);
    }
  }

  /**
   * Authenticate a client connection
   * @param client WebSocket client
   * @param payload Authentication payload
   */
  private async authenticateClient(client: AuthenticatedClient, payload: { token: string }): Promise<void> {
    try {
      // Verify the token
      const decoded = jwt.verify(payload.token, config.jwtSecret) as { id: string };
      
      // Get the user from Supabase
      const user = await User.findById(decoded.id);
      if (!user) {
        client.send(JSON.stringify({
          type: 'auth_error',
          payload: { message: 'Invalid user' },
        }));
        return;
      }
      
      // Store user ID in the client
      client.userId = user.id.toString();
      
      // Store team IDs in the client if user has a team
      client.teamIds = user.teamId ? [user.teamId.toString()] : [];
      
      // Add client to user clients map
      if (!this.clients.has(client.userId)) {
        this.clients.set(client.userId, new Set());
      }
      this.clients.get(client.userId)!.add(client);
      
      // Add client to team clients map for each team
      if (client.teamIds && client.teamIds.length > 0) {
        client.teamIds.forEach(teamId => {
          if (!this.teamClients.has(teamId)) {
            this.teamClients.set(teamId, new Set());
          }
          this.teamClients.get(teamId)!.add(client);
        });
      }
      
      // Send success message
      client.send(JSON.stringify({
        type: 'authenticated',
        payload: {
          userId: user.id.toString(),
          name: user.name,
        },
      }));
    } catch (error) {
      console.error('Authentication error:', error);
      
      // Send error message
      client.send(JSON.stringify({
        type: 'auth_error',
        payload: { message: 'Authentication failed' },
      }));
    }
  }

  /**
   * Handle client disconnect
   * @param client WebSocket client
   */
  private handleDisconnect(client: AuthenticatedClient): void {
    // Clear ping timeout
    if (client.pingTimeout) {
      clearTimeout(client.pingTimeout);
    }
    
    // Remove from user clients map
    if (client.userId) {
      const userClients = this.clients.get(client.userId);
      if (userClients) {
        userClients.delete(client);
        if (userClients.size === 0) {
          this.clients.delete(client.userId);
        }
      }
    }
    
    // Remove from team clients map
    if (client.teamIds) {
      client.teamIds.forEach(teamId => {
        const teamClients = this.teamClients.get(teamId);
        if (teamClients) {
          teamClients.delete(client);
          if (teamClients.size === 0) {
            this.teamClients.delete(teamId);
          }
        }
      });
    }
  }

  /**
   * Start the heartbeat mechanism
   * This helps detect and clean up disconnected clients
   */
  private startHeartbeat(): void {
    // Check for disconnected clients every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      if (this.wss) {
        this.wss.clients.forEach((ws) => {
          const client = ws as AuthenticatedClient;
          
          if (!client.isAlive) {
            // Client failed to respond to ping, terminate connection
            return client.terminate();
          }
          
          // Mark client as not alive, will be marked alive when pong is received
          client.isAlive = false;
          
          // Send ping
          try {
            client.ping();
          } catch (error) {
            console.error('Error sending ping:', error);
          }
        });
      }
    }, 30000);
  }

  /**
   * Set up ping timeout for a client
   * @param client WebSocket client
   */
  private setupPingTimeout(client: AuthenticatedClient): void {
    // Clear existing timeout if present
    if (client.pingTimeout) {
      clearTimeout(client.pingTimeout);
    }
    
    // Set new timeout - terminate connection if no pong received within 5 seconds
    client.pingTimeout = setTimeout(() => {
      client.terminate();
    }, 5000);
  }

  /**
   * Get the number of connected clients
   */
  public getConnectedClientsCount(): number {
    return this.wss ? this.wss.clients.size : 0;
  }
}

export default new WebSocketService(); 