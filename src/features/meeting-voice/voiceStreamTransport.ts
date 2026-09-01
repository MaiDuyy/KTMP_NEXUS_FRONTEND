import type { VoiceStreamDescriptor } from './types';
import type { VoicePcmChunk } from './pcmAudioWorklet';

export type VoiceStreamTransportErrorCode =
  | 'VOICE_STREAM_PROTOCOL_ERROR'
  | 'VOICE_STREAM_AUTH_TIMEOUT'
  | 'VOICE_STREAM_SEQUENCE_ERROR'
  | 'VOICE_STREAM_BACKPRESSURE'
  | 'VOICE_STREAM_DISCONNECTED'
  | 'VOICE_STREAM_TIMEOUT'
  | 'VOICE_TOKEN_INVALID'
  | 'VOICE_INTERNAL_ERROR';

export class VoiceStreamTransportError extends Error {
  public constructor(
    public readonly code: VoiceStreamTransportErrorCode,
    message: string,
    public readonly retryable = true,
  ) {
    super(message);
  }
}

export interface VoiceStreamTransport {
  sendChunk(chunk: VoicePcmChunk): void;
  end(): Promise<void>;
  cancel(reason?: string): void;
}

export interface VoiceStreamTransportOptions {
  url: string;
  turnId: string;
  turnToken: string;
  descriptor: VoiceStreamDescriptor;
  onError?: (error: VoiceStreamTransportError) => void;
}

export interface BrowserWebSocket {
  readonly readyState: number;
  readonly bufferedAmount: number;
  binaryType: BinaryType;
  onopen: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onclose: ((event: CloseEvent) => void) | null;
  send(data: string | ArrayBuffer): void;
  close(code?: number, reason?: string): void;
}

export interface VoiceStreamTransportDependencies {
  createSocket(url: string): BrowserWebSocket;
  setTimer(callback: () => void, timeoutMs: number): ReturnType<typeof setTimeout>;
  clearTimer(timer: ReturnType<typeof setTimeout>): void;
}

const HEADER_BYTES = 6;
const PCM_BYTES = 640;
const OPEN = 1;

function defaultDependencies(): VoiceStreamTransportDependencies {
  return {
    createSocket: (url) => new WebSocket(url),
    setTimer: (callback, timeoutMs) => setTimeout(callback, timeoutMs),
    clearTimer: (timer) => clearTimeout(timer),
  };
}

function parseServerFrame(data: unknown): Record<string, unknown> | null {
  if (typeof data !== 'string') return null;
  try {
    const parsed = JSON.parse(data);
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

export function connectVoiceStream(
  options: VoiceStreamTransportOptions,
  dependencies: VoiceStreamTransportDependencies = defaultDependencies(),
): Promise<VoiceStreamTransport> {
  return new Promise((resolve, reject) => {
    if (!/^wss?:\/\//.test(options.url) || options.descriptor.protocolVersion !== 1) {
      reject(new VoiceStreamTransportError('VOICE_STREAM_PROTOCOL_ERROR', 'Invalid streaming configuration.', false));
      return;
    }

    const socket = dependencies.createSocket(options.url);
    socket.binaryType = 'arraybuffer';
    let nextSequence = 0;
    let lastSequence: number | null = null;
    let ready = false;
    let terminal = false;
    let ending = false;
    let endResolve: (() => void) | null = null;
    let endReject: ((error: Error) => void) | null = null;

    const notifyError = (error: VoiceStreamTransportError) => {
      if (terminal) return;
      terminal = true;
      dependencies.clearTimer(authTimer);
      endReject?.(error);
      options.onError?.(error);
      reject(error);
    };

    const authTimer = dependencies.setTimer(() => {
      const error = new VoiceStreamTransportError('VOICE_STREAM_AUTH_TIMEOUT', 'Streaming authentication timed out.', false);
      notifyError(error);
      socket.close(4408, error.code);
    }, options.descriptor.authTimeoutMs + 1_000);

    const transport: VoiceStreamTransport = {
      sendChunk: (chunk) => {
        if (!ready || terminal || ending || socket.readyState !== OPEN) {
          throw new VoiceStreamTransportError('VOICE_STREAM_DISCONNECTED', 'Streaming connection is not ready.');
        }
        if (chunk.sequence !== nextSequence || chunk.pcm.byteLength !== PCM_BYTES) {
          throw new VoiceStreamTransportError('VOICE_STREAM_SEQUENCE_ERROR', 'Invalid PCM chunk sequence or size.', false);
        }
        if (socket.bufferedAmount + HEADER_BYTES + chunk.pcm.byteLength > options.descriptor.maxQueuedBytes) {
          throw new VoiceStreamTransportError('VOICE_STREAM_BACKPRESSURE', 'Browser streaming queue is full.');
        }
        const frame = new ArrayBuffer(HEADER_BYTES + chunk.pcm.byteLength);
        const view = new DataView(frame);
        view.setUint8(0, 1);
        view.setUint8(1, 1);
        view.setUint32(2, chunk.sequence, false);
        new Uint8Array(frame, HEADER_BYTES).set(new Uint8Array(chunk.pcm));
        socket.send(frame);
        lastSequence = chunk.sequence;
        nextSequence += 1;
      },
      end: () => {
        if (!ready || terminal || ending || socket.readyState !== OPEN) {
          return Promise.reject(new VoiceStreamTransportError('VOICE_STREAM_DISCONNECTED', 'Streaming connection is not ready.'));
        }
        ending = true;
        socket.send(JSON.stringify({ type: 'end', finalSequence: lastSequence }));
        return new Promise<void>((resolveEnd, rejectEnd) => {
          endResolve = resolveEnd;
          endReject = rejectEnd;
        });
      },
      cancel: (reason = 'user_cancelled') => {
        if (terminal) return;
        terminal = true;
        dependencies.clearTimer(authTimer);
        if (socket.readyState === OPEN) {
          socket.send(JSON.stringify({ type: 'cancel', reason }));
          socket.close(1000, 'cancelled');
        }
      },
    };

    socket.onopen = () => {
      socket.send(JSON.stringify({
        type: 'auth',
        protocolVersion: 1,
        turnId: options.turnId,
        turnToken: options.turnToken,
      }));
    };
    socket.onmessage = (event) => {
      const frame = parseServerFrame(event.data);
      if (!frame) {
        notifyError(new VoiceStreamTransportError('VOICE_STREAM_PROTOCOL_ERROR', 'Invalid streaming response.', false));
        return;
      }
      if (frame.type === 'ready' && !ready && frame.protocolVersion === 1) {
        ready = true;
        dependencies.clearTimer(authTimer);
        resolve(transport);
        return;
      }
      if (frame.type === 'ack' && ready) return;
      if (frame.type === 'finalized' && ready && frame.finalSequence === lastSequence) {
        terminal = true;
        endResolve?.();
        socket.close(1000, 'finalized');
        return;
      }
      if (frame.type === 'error' && typeof frame.code === 'string') {
        notifyError(new VoiceStreamTransportError(
          frame.code as VoiceStreamTransportErrorCode,
          typeof frame.message === 'string' ? frame.message : 'Streaming failed.',
          frame.retryable !== false,
        ));
        return;
      }
      notifyError(new VoiceStreamTransportError('VOICE_STREAM_PROTOCOL_ERROR', 'Unexpected streaming response.', false));
    };
    socket.onerror = () => notifyError(new VoiceStreamTransportError('VOICE_STREAM_DISCONNECTED', 'Streaming connection failed.'));
    socket.onclose = () => {
      if (!terminal) notifyError(new VoiceStreamTransportError('VOICE_STREAM_DISCONNECTED', 'Streaming connection closed.'));
    };
  });
}
