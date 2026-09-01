'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import { createMeetingRecorder, MeetingRecorderError, type MeetingRecorder } from './mediaRecorder';
import { initialMeetingVoiceState, meetingVoiceReducer } from './meetingVoiceReducer';
import type {
  VoiceErrorEvent,
  VoiceLockChangedEvent,
  VoiceMessageEvent,
  VoiceReadyEvent,
  VoiceSessionSyncResponse,
  VoiceStateEvent,
  VoiceTranscriptEvent,
  VoiceTurnAcceptedEvent,
  VoiceTurnCredentials,
} from './types';
import { uploadVoiceAudio, VoiceUploadError } from './uploadVoiceAudio';
import { createPcmAudioCapture, type PcmAudioCapture } from './pcmAudioWorklet';
import { chooseVoiceTransportMode } from './streamingCapability';
import {
  connectVoiceStream,
  VoiceStreamTransportError,
  type VoiceStreamTransport,
} from './voiceStreamTransport';

const RECORDER_MESSAGES: Record<string, string> = {
  MIC_PERMISSION_DENIED: 'Bạn chưa cấp quyền sử dụng micro.',
  MIC_NOT_FOUND: 'Không tìm thấy micro khả dụng.',
  MIC_BUSY: 'Micro đang được ứng dụng khác sử dụng.',
  RECORDER_UNSUPPORTED: 'Trình duyệt này chưa hỗ trợ ghi âm WebM/Opus.',
  RECORDER_FAILED: 'Không thể ghi âm câu hỏi.',
};

const UPLOAD_MESSAGES: Record<string, string> = {
  VOICE_AUDIO_EMPTY: 'Đoạn ghi âm không có dữ liệu.',
  VOICE_AUDIO_TOO_LARGE: 'Đoạn ghi âm vượt quá giới hạn cho phép.',
  VOICE_UPLOAD_TIMEOUT: 'Tải đoạn ghi âm lên quá thời gian chờ.',
  VOICE_UPLOAD_ABORTED: 'Đã dừng tải đoạn ghi âm.',
  VOICE_UPLOAD_NETWORK: 'Không thể tải đoạn ghi âm lên máy chủ.',
};

const STREAM_MESSAGES: Record<string, string> = {
  VOICE_STREAM_PROTOCOL_ERROR: 'Kết nối truyền âm thanh không tương thích.',
  VOICE_STREAM_AUTH_TIMEOUT: 'Xác thực truyền âm thanh quá thời gian chờ.',
  VOICE_STREAM_SEQUENCE_ERROR: 'Thứ tự dữ liệu âm thanh không hợp lệ.',
  VOICE_STREAM_BACKPRESSURE: 'Kết nối không xử lý kịp dữ liệu âm thanh.',
  VOICE_STREAM_DISCONNECTED: 'Mất kết nối truyền âm thanh tới AI Voice.',
  VOICE_STREAM_TIMEOUT: 'Phiên nói đã vượt quá thời gian cho phép.',
  VOICE_TOKEN_INVALID: 'Phiên hỏi AI Voice không còn hợp lệ.',
};

function localError(meetingSessionId: string, turnId: string | null, code: string, message: string): VoiceErrorEvent {
  return { meetingSessionId, turnId, code, message, retryable: true };
}

export function useMeetingVoice(options: {
  socket: Socket | null;
  meetingSessionId: string;
  chatId: string;
  workspaceId: string | null | undefined;
  userId: string;
  userName: string;
}) {
  const [state, dispatch] = useReducer(meetingVoiceReducer, initialMeetingVoiceState);
  const stateRef = useRef(state);
  const mountedRef = useRef(true);
  const credentialsRef = useRef<VoiceTurnCredentials | null>(null);
  const recorderRef = useRef<MeetingRecorder | null>(null);
  const pcmCaptureRef = useRef<PcmAudioCapture | null>(null);
  const streamTransportRef = useRef<VoiceStreamTransport | null>(null);
  const streamTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uploadControllerRef = useRef<AbortController | null>(null);
  const startTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { stateRef.current = state; }, [state]);

  const clearStartTimer = useCallback(() => {
    if (startTimerRef.current) clearTimeout(startTimerRef.current);
    startTimerRef.current = null;
  }, []);

  const cancelLocalResources = useCallback(() => {
    recorderRef.current?.cancel();
    recorderRef.current = null;
    if (streamTimerRef.current) clearTimeout(streamTimerRef.current);
    streamTimerRef.current = null;
    void pcmCaptureRef.current?.cancel().catch(() => undefined);
    pcmCaptureRef.current = null;
    streamTransportRef.current?.cancel('user_cancelled');
    streamTransportRef.current = null;
    uploadControllerRef.current?.abort();
    uploadControllerRef.current = null;
    credentialsRef.current = null;
    clearStartTimer();
  }, [clearStartTimer]);

  const submitAudio = useCallback(async (audio: Blob, credentials: VoiceTurnCredentials) => {
    if (!options.socket || !mountedRef.current) return;
    dispatch({ type: 'RECORDING', value: false });
    dispatch({ type: 'UPLOAD_PROGRESS', value: 0 });
    options.socket.emit('voice:turn:end', {
      meetingSessionId: options.meetingSessionId,
      turnId: credentials.turnId,
    });

    const controller = new AbortController();
    uploadControllerRef.current = controller;
    try {
      await uploadVoiceAudio({
        url: credentials.uploadUrl,
        token: credentials.turnToken,
        audio,
        signal: controller.signal,
        onProgress: (progress) => mountedRef.current && dispatch({ type: 'UPLOAD_PROGRESS', value: progress }),
      });
      if (mountedRef.current) dispatch({ type: 'UPLOAD_PROGRESS', value: null });
      credentialsRef.current = null;
    } catch (error) {
      if (controller.signal.aborted || !mountedRef.current) return;
      const code = error instanceof VoiceUploadError ? error.code : 'VOICE_UPLOAD_NETWORK';
      options.socket.emit('voice:turn:cancel', {
        meetingSessionId: options.meetingSessionId,
        turnId: credentials.turnId,
        reason: 'provider_error',
      });
      credentialsRef.current = null;
      dispatch({
        type: 'ERROR',
        value: localError(
          options.meetingSessionId,
          credentials.turnId,
          code,
          UPLOAD_MESSAGES[code] ?? 'Không thể gửi đoạn ghi âm.',
        ),
      });
    } finally {
      if (uploadControllerRef.current === controller) uploadControllerRef.current = null;
    }
  }, [options.meetingSessionId, options.socket]);

  const stop = useCallback(async () => {
    const credentials = credentialsRef.current;
    if (!credentials) return;

    const pcmCapture = pcmCaptureRef.current;
    const streamTransport = streamTransportRef.current;
    if (pcmCapture && streamTransport) {
      pcmCaptureRef.current = null;
      if (streamTimerRef.current) clearTimeout(streamTimerRef.current);
      streamTimerRef.current = null;
      dispatch({ type: 'RECORDING', value: false });
      try {
        await pcmCapture.stop();
        options.socket?.emit('voice:turn:end', {
          meetingSessionId: options.meetingSessionId,
          turnId: credentials.turnId,
        });
        await streamTransport.end();
        if (streamTransportRef.current === streamTransport) streamTransportRef.current = null;
        credentialsRef.current = null;
      } catch (error) {
        streamTransport.cancel('provider_error');
        options.socket?.emit('voice:turn:cancel', {
          meetingSessionId: options.meetingSessionId,
          turnId: credentials.turnId,
          reason: 'provider_error',
        });
        credentialsRef.current = null;
        if (mountedRef.current) {
          const code = error instanceof VoiceStreamTransportError ? error.code : 'VOICE_STREAM_DISCONNECTED';
          dispatch({
            type: 'ERROR',
            value: localError(options.meetingSessionId, credentials.turnId, code, STREAM_MESSAGES[code] ?? 'Không thể hoàn tất truyền âm thanh.'),
          });
        }
      }
      return;
    }

    const recorder = recorderRef.current;
    if (!recorder) return;
    recorderRef.current = null;
    try {
      const audio = await recorder.stop();
      await submitAudio(audio, credentials);
    } catch {
      options.socket?.emit('voice:turn:cancel', {
        meetingSessionId: options.meetingSessionId,
        turnId: credentials.turnId,
        reason: 'provider_error',
      });
      credentialsRef.current = null;
      if (mountedRef.current) {
        dispatch({
          type: 'ERROR',
          value: localError(options.meetingSessionId, credentials.turnId, 'RECORDER_FAILED', RECORDER_MESSAGES.RECORDER_FAILED),
        });
      }
    }
  }, [options.meetingSessionId, options.socket, submitAudio]);

  const start = useCallback(() => {
    if (!options.socket || stateRef.current.locked || stateRef.current.starting) return;
    if (!options.workspaceId) {
      dispatch({
        type: 'ERROR',
        value: localError(options.meetingSessionId, null, 'VOICE_WORKSPACE_REQUIRED', 'Cuộc họp chưa có ngữ cảnh workspace hợp lệ.'),
      });
      return;
    }
    dispatch({ type: 'STARTING', value: true });
    options.socket.emit('voice:turn:start', {
      meetingSessionId: options.meetingSessionId,
      chatId: options.chatId,
      workspaceId: options.workspaceId,
      clientRequestId: crypto.randomUUID(),
      mode: 'rag',
    });
    clearStartTimer();
    startTimerRef.current = setTimeout(() => {
      if (!mountedRef.current || !stateRef.current.starting) return;
      dispatch({
        type: 'ERROR',
        value: localError(options.meetingSessionId, null, 'VOICE_START_TIMEOUT', 'Không nhận được phản hồi khi bắt đầu AI Voice.'),
      });
    }, 10_000);
  }, [clearStartTimer, options.chatId, options.meetingSessionId, options.socket, options.workspaceId]);

  useEffect(() => {
    const socket = options.socket;
    if (!socket) return;

    const belongsToMeeting = (event: { meetingSessionId: string }) => event.meetingSessionId === options.meetingSessionId;
    const synchronize = () => {
      dispatch({ type: 'SYNCING', value: true });
      socket.timeout(5_000).emit(
        'voice:session:sync',
        { meetingSessionId: options.meetingSessionId },
        (error: Error | null, response?: VoiceSessionSyncResponse) => {
          if (!mountedRef.current) return;
          if (error || !response) {
            dispatch({ type: 'SYNCING', value: false });
            return;
          }
          dispatch({ type: 'SYNC', value: response });
          if (
            response.activeTurn?.ownerUserId === options.userId &&
            response.activeTurn.state === 'LISTENING' &&
            !credentialsRef.current
          ) {
            socket.emit('voice:turn:cancel', {
              meetingSessionId: options.meetingSessionId,
              turnId: response.activeTurn.turnId,
              reason: 'owner_disconnected',
            });
          }
        },
      );
    };

    const onAccepted = async (event: VoiceTurnAcceptedEvent) => {
      if (!belongsToMeeting(event)) return;
      clearStartTimer();
      const credentials: VoiceTurnCredentials = {
        turnId: event.turnId,
        turnToken: event.turnToken,
        uploadUrl: event.uploadUrl,
        streamUrl: event.streamUrl,
        stream: event.stream,
        expiresAt: event.expiresAt,
      };
      credentialsRef.current = credentials;
      try {
        const useStreaming = Boolean(event.stream && event.streamUrl)
          && chooseVoiceTransportMode() === 'streaming';
        if (useStreaming && event.stream) {
          let failed = false;
          const failStreaming = (error: VoiceStreamTransportError) => {
            if (failed || !mountedRef.current || credentialsRef.current?.turnId !== event.turnId) return;
            failed = true;
            socket.emit('voice:turn:cancel', {
              meetingSessionId: options.meetingSessionId,
              turnId: event.turnId,
              reason: 'provider_error',
            });
            cancelLocalResources();
            dispatch({
              type: 'ERROR',
              value: localError(
                options.meetingSessionId,
                event.turnId,
                error.code,
                STREAM_MESSAGES[error.code] ?? 'Không thể truyền âm thanh tới AI Voice.',
              ),
            });
          };
          const transport = await connectVoiceStream({
            url: event.streamUrl,
            turnId: event.turnId,
            turnToken: event.turnToken,
            descriptor: event.stream,
            onError: failStreaming,
          });
          if (!mountedRef.current || credentialsRef.current?.turnId !== event.turnId || failed) {
            transport.cancel('user_cancelled');
            return;
          }
          streamTransportRef.current = transport;
          const capture = await createPcmAudioCapture({
            onChunk: (chunk) => {
              try {
                transport.sendChunk(chunk);
              } catch (error) {
                failStreaming(error instanceof VoiceStreamTransportError
                  ? error
                  : new VoiceStreamTransportError('VOICE_STREAM_DISCONNECTED', 'Streaming failed.'));
              }
            },
          });
          if (!mountedRef.current || credentialsRef.current?.turnId !== event.turnId || failed) {
            await capture.cancel();
            transport.cancel('user_cancelled');
            return;
          }
          pcmCaptureRef.current = capture;
          streamTimerRef.current = setTimeout(() => void stop(), 60_000);
          dispatch({ type: 'RECORDING', value: true });
          return;
        }

        const recorder = await createMeetingRecorder({
          maxDurationMs: 60_000,
          onLimitReached: async (audio) => {
            if (recorderRef.current === recorder) recorderRef.current = null;
            await submitAudio(audio, credentials);
          },
        });
        if (!mountedRef.current || credentialsRef.current?.turnId !== event.turnId) {
          recorder.cancel();
          return;
        }
        recorderRef.current = recorder;
        dispatch({ type: 'RECORDING', value: true });
      } catch (error) {
        const code = error instanceof MeetingRecorderError ? error.code : 'RECORDER_FAILED';
        socket.emit('voice:turn:cancel', {
          meetingSessionId: options.meetingSessionId,
          turnId: event.turnId,
          reason: 'user_cancelled',
        });
        credentialsRef.current = null;
        if (mountedRef.current) {
          dispatch({
            type: 'ERROR',
            value: localError(options.meetingSessionId, event.turnId, code, RECORDER_MESSAGES[code] ?? RECORDER_MESSAGES.RECORDER_FAILED),
          });
        }
      }
    };
    const onLock = (event: VoiceLockChangedEvent) => belongsToMeeting(event) && dispatch({ type: 'LOCK', value: event });
    const onState = (event: VoiceStateEvent) => belongsToMeeting(event) && dispatch({ type: 'STATE', value: event });
    const onTranscript = (event: VoiceTranscriptEvent) => belongsToMeeting(event) && dispatch({ type: 'TRANSCRIPT', value: event });
    const onMessage = (event: VoiceMessageEvent) => belongsToMeeting(event) && dispatch({ type: 'MESSAGE', value: event });
    const onReady = (event: VoiceReadyEvent) => {
      if (!belongsToMeeting(event)) return;
      cancelLocalResources();
      dispatch({ type: 'READY', turnId: event.completedTurnId });
    };
    const onError = (event: VoiceErrorEvent) => {
      if (!belongsToMeeting(event)) return;
      clearStartTimer();
      if (!event.turnId || event.turnId === credentialsRef.current?.turnId) cancelLocalResources();
      dispatch({ type: 'ERROR', value: event });
    };
    const onDisconnect = () => {
      cancelLocalResources();
      if (mountedRef.current) {
        dispatch({
          type: 'ERROR',
          value: localError(options.meetingSessionId, stateRef.current.turnId, 'VOICE_SOCKET_DISCONNECTED', 'Mất kết nối với phiên AI Voice.'),
        });
      }
    };

    socket.on('connect', synchronize);
    socket.on('disconnect', onDisconnect);
    socket.on('voice:turn:accepted', onAccepted);
    socket.on('voice:lock:changed', onLock);
    socket.on('voice:state', onState);
    socket.on('voice:transcript', onTranscript);
    socket.on('voice:message', onMessage);
    socket.on('voice:ready', onReady);
    socket.on('voice:error', onError);
    synchronize();

    return () => {
      socket.off('connect', synchronize);
      socket.off('disconnect', onDisconnect);
      socket.off('voice:turn:accepted', onAccepted);
      socket.off('voice:lock:changed', onLock);
      socket.off('voice:state', onState);
      socket.off('voice:transcript', onTranscript);
      socket.off('voice:message', onMessage);
      socket.off('voice:ready', onReady);
      socket.off('voice:error', onError);
    };
  }, [cancelLocalResources, clearStartTimer, options.meetingSessionId, options.socket, options.userId, stop, submitAudio]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const active = stateRef.current;
      if (active.locked && active.ownerUserId === options.userId && active.turnId) {
        options.socket?.emit('voice:turn:cancel', {
          meetingSessionId: options.meetingSessionId,
          turnId: active.turnId,
          reason: 'call_ended',
        });
      }
      cancelLocalResources();
    };
  }, [cancelLocalResources, options.meetingSessionId, options.socket, options.userId]);

  return {
    state,
    isOwner: state.ownerUserId === options.userId,
    canStart: !state.locked && !state.starting && !state.syncing,
    canStop: state.ownerUserId === options.userId && state.turnState === 'LISTENING' && state.recording,
    start,
    stop,
    clearError: () => dispatch({ type: 'CLEAR_ERROR' }),
  };
}
