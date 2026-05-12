/**
 * Socket.io Connection Manager
 * Handles realtime events for chat, typing, presence
 */

import { io, Socket } from 'socket.io-client';
import { store } from '@/src/redux/store';

// Event types
export interface MessageEvent {
  id: string;
  chatId: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE';
  senderId: string;
  time: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface TypingEvent {
  chatId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface PresenceEvent {
  userId: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
}

export interface ReactionEvent {
  messageId: string;
  chatId: string;
  emoji: string;
  userId: string;
  added: boolean;
}

type SocketEventHandler<T> = (data: T) => void;

class SocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Event handlers registry
  private messageHandlers: SocketEventHandler<MessageEvent>[] = [];
  private typingHandlers: SocketEventHandler<TypingEvent>[] = [];
  private presenceHandlers: SocketEventHandler<PresenceEvent>[] = [];
  private reactionHandlers: SocketEventHandler<ReactionEvent>[] = [];
  private auditLogHandlers: SocketEventHandler<any>[] = [];

  /**
   * Connect to socket server
   */
  connect(): void {
    if (this.socket?.connected) return;

    const state = store.getState();

    if (!state.auth.isAuthenticated) {
      console.warn('[Socket] Not authenticated, skipping connection');
      return;
    }

    const url = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
    
    this.socket = io(url, {
      auth: {
        token: state.auth.token || (typeof window !== 'undefined' ? localStorage.getItem("accessToken") : null)
      },
      withCredentials: true, // Gửi httpOnly cookie trong handshake đồng thời
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.setupListeners();
  }

  /**
   * Setup socket event listeners
   */
  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
      this.reconnectAttempts++;
    });

    // Message events
    this.socket.on('message:created', (data: MessageEvent) => {
      this.messageHandlers.forEach((handler) => handler(data));
    });

    this.socket.on('message:updated', (data: MessageEvent) => {
      this.messageHandlers.forEach((handler) => handler(data));
    });

    this.socket.on('message:deleted', (data: { messageId: string; chatId: string }) => {
      this.messageHandlers.forEach((handler) => handler(data as any));
    });

    // Typing events
    this.socket.on('user:typing', (data: TypingEvent) => {
      this.typingHandlers.forEach((handler) => handler(data));
    });

    // Presence events
    this.socket.on('user:presence', (data: PresenceEvent) => {
      this.presenceHandlers.forEach((handler) => handler(data));
    });

    // Reaction events
    this.socket.on('message:reaction', (data: ReactionEvent) => {
      this.reactionHandlers.forEach((handler) => handler(data));
    });
    
    // Audit Log events (Admin only)
    this.socket.on('admin:audit_log:new', (data: any) => {
      this.auditLogHandlers.forEach((handler) => handler(data));
    });
  }

  /**
   * Disconnect from socket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Join a chat room
   */
  joinChat(chatId: string): void {
    this.socket?.emit('join:chat', { chatId });
  }

  /**
   * Leave a chat room
   */
  leaveChat(chatId: string): void {
    this.socket?.emit('leave:chat', { chatId });
  }

  /**
   * Send typing indicator
   */
  sendTyping(chatId: string, isTyping: boolean): void {
    this.socket?.emit('typing', { chatId, isTyping });
  }

  /**
   * Register message event handler
   */
  onMessage(handler: SocketEventHandler<MessageEvent>): () => void {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
    };
  }

  /**
   * Register typing event handler
   */
  onTyping(handler: SocketEventHandler<TypingEvent>): () => void {
    this.typingHandlers.push(handler);
    return () => {
      this.typingHandlers = this.typingHandlers.filter((h) => h !== handler);
    };
  }

  /**
   * Register presence event handler
   */
  onPresence(handler: SocketEventHandler<PresenceEvent>): () => void {
    this.presenceHandlers.push(handler);
    return () => {
      this.presenceHandlers = this.presenceHandlers.filter((h) => h !== handler);
    };
  }

  /**
   * Register reaction event handler
   */
  onReaction(handler: SocketEventHandler<ReactionEvent>): () => void {
    this.reactionHandlers.push(handler);
    return () => {
      this.reactionHandlers = this.reactionHandlers.filter((h) => h !== handler);
    };
  }

  /**
   * Register audit log event handler
   */
  onAuditLog(handler: SocketEventHandler<any>): () => void {
    this.auditLogHandlers.push(handler);
    return () => {
      this.auditLogHandlers = this.auditLogHandlers.filter((h) => h !== handler);
    };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get socket instance (for advanced use)
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Singleton instance
export const socketManager = new SocketManager();

// React hook for socket connection
import { useEffect } from 'react';

export function useSocket() {
  useEffect(() => {
    socketManager.connect();
    return () => {
      // Don't disconnect on unmount, keep connection alive
    };
  }, []);

  return socketManager;
}

// Hook for chat room subscription
export function useChatRoom(chatId: string | undefined) {
  useEffect(() => {
    if (!chatId) return;

    socketManager.joinChat(chatId);
    return () => {
      socketManager.leaveChat(chatId);
    };
  }, [chatId]);
}
