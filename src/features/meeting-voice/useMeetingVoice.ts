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
    const recorder = recorderRef.current;
    const credentials = credentialsRef.current;
    if (!recorder || !credentials) return;
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
        expiresAt: event.expiresAt,
      };
      credentialsRef.current = credentials;
      try {
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
  }, [cancelLocalResources, clearStartTimer, options.meetingSessionId, options.socket, options.userId, submitAudio]);

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
