'use client';

/**
 * useAIAssistant — Phase 1 + Phase 2 AI Chat Integration
 *
 * Listens to ws-gateway Socket.IO events for both:
 *   - Phase 1: RAG streaming (chat:ai_query)
 *   - Phase 2: Agent tool-calling (chat:agent_query)
 *
 * Both modes share the same streaming event protocol:
 *   ai:thinking  → show loading bubble
 *   ai:token     → append text token
 *   ai:done      → finalize (includes mode: 'agent' | undefined)
 *   ai:error     → show error in bubble
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { socketService } from '@/src/services/socket.service';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  timestamp: string;
  sessionId?: string;
  error?: string;
  /** 'agent' = Phase 2 tool-calling response */
  mode?: 'agent' | 'rag';
}

export function useAIAssistant(chatId: string | undefined) {
  const [aiMessages, setAIMessages] = useState<AIMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const conversationIdRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!chatId) return;

    const socket = socketService.getSocket();
    if (!socket) return;

    // Gateway created a new conversation — persist the id for subsequent queries
    const onConversationId = (data: { chatId: string; conversationId: number }) => {
      if (data.chatId !== chatId) return;
      conversationIdRef.current = data.conversationId;
    };

    // AI started processing — insert empty streaming bubble
    const onThinking = (data: { chatId: string; sessionId: string; mode?: string }) => {
      if (data.chatId !== chatId) return;
      setIsStreaming(true);
      setAIMessages(prev => [...prev, {
        id: data.sessionId,
        role: 'assistant',
        content: '',
        isStreaming: true,
        timestamp: new Date().toISOString(),
        sessionId: data.sessionId,
        mode: data.mode === 'agent' ? 'agent' : 'rag',
      }]);
    };

    // Incremental token — append to streaming bubble
    const onToken = (data: { chatId: string; token: string; sessionId: string }) => {
      if (data.chatId !== chatId) return;
      setAIMessages(prev => prev.map(m =>
        m.sessionId === data.sessionId
          ? { ...m, content: m.content + data.token }
          : m
      ));
    };

    // Stream complete
    const onDone = (data: { chatId: string; response: string; sessionId: string; conversationId?: number; mode?: string }) => {
      if (data.chatId !== chatId) return;
      if (data.conversationId) conversationIdRef.current = data.conversationId;
      setIsStreaming(false);
      setAIMessages(prev => prev.map(m =>
        m.sessionId === data.sessionId
          ? { ...m, content: data.response, isStreaming: false, mode: data.mode === 'agent' ? 'agent' : 'rag' }
          : m
      ));
    };

    // Error from gateway or AI service
    const onError = (data: { chatId: string; sessionId: string; error: string }) => {
      if (data.chatId !== chatId) return;
      setIsStreaming(false);
      setAIMessages(prev => prev.map(m =>
        m.sessionId === data.sessionId
          ? { ...m, content: data.error, isStreaming: false, error: data.error }
          : m
      ));
    };

    socket.on('ai:conversation_id', onConversationId);
    socket.on('ai:thinking', onThinking);
    socket.on('ai:token', onToken);
    socket.on('ai:done', onDone);
    socket.on('ai:error', onError);

    return () => {
      socket.off('ai:conversation_id', onConversationId);
      socket.off('ai:thinking', onThinking);
      socket.off('ai:token', onToken);
      socket.off('ai:done', onDone);
      socket.off('ai:error', onError);
    };
  }, [chatId]);

  /** Phase 1: RAG query — uses existing conversation or creates one via ws-gateway */
  const sendAIQuery = useCallback((message: string) => {
    if (!chatId || !message.trim() || isStreaming) return;
    setAIMessages(prev => [...prev, {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString(),
      mode: 'rag',
    }]);
    socketService.sendAIQuery(chatId, message.trim(), conversationIdRef.current);
  }, [chatId, isStreaming]);

  /** Phase 2: Agent query — Gemini autonomously calls tools */
  const sendAgentQuery = useCallback((message: string, workspaceId?: string) => {
    if (!chatId || !message.trim() || isStreaming) return;
    setAIMessages(prev => [...prev, {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString(),
      mode: 'agent',
    }]);
    socketService.sendAgentQuery(chatId, message.trim(), conversationIdRef.current, workspaceId);
  }, [chatId, isStreaming]);

  /** Reset the AI conversation panel */
  const clearAI = useCallback(() => {
    setAIMessages([]);
    conversationIdRef.current = undefined;
    setIsStreaming(false);
  }, []);

  return { aiMessages, isStreaming, sendAIQuery, sendAgentQuery, clearAI };
}
