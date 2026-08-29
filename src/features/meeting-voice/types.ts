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
  expiresAt: string;
}

export interface VoiceLockChangedEvent {
  meetingSessionId: string;
  locked: boolean;
  turnId: string | null;
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
}

export interface VoiceMessageEvent {
  meetingSessionId: string;
  turnId: string;
  role: 'assistant';
  displayText: string;
  isFinal: boolean;
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
  expiresAt: string;
}
