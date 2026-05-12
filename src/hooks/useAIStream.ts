'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseAIStreamOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
}

interface StreamState {
  isStreaming: boolean;
  content: string;
  error: Error | null;
}

/**
 * Custom hook for SSE-based AI streaming
 * Handles Server-Sent Events for real-time AI responses
 */
export function useAIStream(options: UseAIStreamOptions = {}) {
  const [state, setState] = useState<StreamState>({
    isStreaming: false,
    content: '',
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const contentRef = useRef<string>('');

  // Start streaming from SSE endpoint
  const startStream = useCallback(async (
    requestId: string,
    baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  ) => {
    // Abort any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    contentRef.current = '';

    setState({ isStreaming: true, content: '', error: null });

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem("accessToken") : null;
      
      const response = await fetch(`${baseUrl}/ai/stream/${requestId}`, {
        signal: abortControllerRef.current.signal,
        credentials: 'include', // Gửi httpOnly cookie tự động
        headers: {
          'Accept': 'text/event-stream',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
      });

      if (!response.ok) {
        throw new Error(`Stream error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              setState((prev) => ({ ...prev, isStreaming: false }));
              options.onComplete?.(contentRef.current);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const chunk = parsed.content || parsed.text || data;
              
              contentRef.current += chunk;
              setState((prev) => ({ ...prev, content: contentRef.current }));
              options.onChunk?.(chunk);
            } catch {
              // Plain text chunk
              contentRef.current += data;
              setState((prev) => ({ ...prev, content: contentRef.current }));
              options.onChunk?.(data);
            }
          }
        }
      }

      setState((prev) => ({ ...prev, isStreaming: false }));
      options.onComplete?.(contentRef.current);
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        setState((prev) => ({ ...prev, isStreaming: false }));
        return;
      }

      const err = error instanceof Error ? error : new Error('Stream failed');
      setState({ isStreaming: false, content: contentRef.current, error: err });
      options.onError?.(err);
    }
  }, [options]);

  // Stop the stream
  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState((prev) => ({ ...prev, isStreaming: false }));
  }, []);

  // Reset state
  const reset = useCallback(() => {
    stopStream();
    contentRef.current = '';
    setState({ isStreaming: false, content: '', error: null });
  }, [stopStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    startStream,
    stopStream,
    reset,
  };
}
