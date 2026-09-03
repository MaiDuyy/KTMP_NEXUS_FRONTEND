export type VoiceTurnState =
  | 'IDLE'
  | 'LISTENING'
  | 'FINALIZING_STT'
  | 'THINKING'
  | 'RESPONDING'
  | 'COMPLETED'
  | 'CANCELLING'
  | 'FAILED'
  | 'CANCELLED';

export interface VoiceTurnAcceptedEvent {
  meetingSessionId: string;
  turnId: string;
  turnToken: string;
  uploadUrl: string;
  streamUrl: string;
  stream?: VoiceStreamDescriptor;
  expiresAt: string;
}

export interface VoiceLockChangedEvent {
  meetingSessionId: string;
  locked: boolean;
  turnId: string | null;
  completedTurnId?: string;
  ownerUserId: string | null;
  ownerName: string | null;
  state: VoiceTurnState;
}

export interface VoiceStateEvent {
  meetingSessionId: string;
  turnId: string;
  state: VoiceTurnState;
  timestamp: string;
}

export interface VoiceTranscriptEvent {
  meetingSessionId: string;
  turnId: string;
  speakerUserId: string;
  speakerName: string;
  text: string;
  isFinal: boolean;
  stability?: number;
  revision?: number;
}

export interface VoiceMessageEvent {
  meetingSessionId: string;
  turnId: string;
  role: 'assistant';
  displayText: string;
  isFinal: boolean;
  revision?: number;
  sources?: Array<{ documentId: string | number; title: string; chunkId: string }>;
}

export interface VoiceReadyEvent {
  meetingSessionId: string;
  completedTurnId: string;
}

export interface VoiceErrorEvent {
  meetingSessionId: string;
  turnId: string | null;
  code: string;
  message: string;
  retryable: boolean;
}

export interface VoiceHistoryMessage {
  id: string;
  turnId: string;
  role: 'user' | 'assistant';
  speakerUserId: string | null;
  speakerName: string | null;
  displayText: string;
  createdAt: string;
  status: 'STREAMING' | 'COMPLETED' | 'FAILED';
}

export interface VoiceSessionSyncResponse {
  meetingSessionId: string;
  sessionState: 'INACTIVE' | 'READY' | 'ENDING' | 'ENDED';
  activeTurn: {
    turnId: string;
    ownerUserId: string;
    ownerName: string;
    state: VoiceTurnState;
  } | null;
  messages: VoiceHistoryMessage[];
}

export interface VoiceTurnCredentials {
  turnId: string;
  turnToken: string;
  uploadUrl: string;
  streamUrl: string;
  stream?: VoiceStreamDescriptor;
  expiresAt: string;
}

export type VoiceTransportMode = 'streaming' | 'batch';

export interface VoiceStreamDescriptor {
  protocolVersion: 1;
  audioFormat: {
    encoding: 'LINEAR16';
    sampleRateHz: 16000;
    channelCount: 1;
    chunkDurationMs: 20;
  };
  authTimeoutMs: number;
  maxQueuedBytes: number;
}
