import type {
  VoiceErrorEvent,
  VoiceHistoryMessage,
  VoiceLockChangedEvent,
  VoiceMessageEvent,
  VoiceSessionSyncResponse,
  VoiceStateEvent,
  VoiceTranscriptEvent,
  VoiceTurnState,
} from './types';

export interface MeetingVoiceState {
  locked: boolean;
  turnId: string | null;
  ownerUserId: string | null;
  ownerName: string | null;
  turnState: VoiceTurnState;
  messages: VoiceHistoryMessage[];
  starting: boolean;
  recording: boolean;
  uploadProgress: number | null;
  error: VoiceErrorEvent | null;
  syncing: boolean;
  transcriptRevisions: Record<string, number>;
}

export const initialMeetingVoiceState: MeetingVoiceState = {
  locked: false,
  turnId: null,
  ownerUserId: null,
  ownerName: null,
  turnState: 'IDLE',
  messages: [],
  starting: false,
  recording: false,
  uploadProgress: null,
  error: null,
  syncing: true,
  transcriptRevisions: {},
};

export type MeetingVoiceAction =
  | { type: 'STARTING'; value: boolean }
  | { type: 'RECORDING'; value: boolean }
  | { type: 'UPLOAD_PROGRESS'; value: number | null }
  | { type: 'SYNCING'; value: boolean }
  | { type: 'SYNC'; value: VoiceSessionSyncResponse }
  | { type: 'LOCK'; value: VoiceLockChangedEvent }
  | { type: 'STATE'; value: VoiceStateEvent }
  | { type: 'TRANSCRIPT'; value: VoiceTranscriptEvent }
  | { type: 'MESSAGE'; value: VoiceMessageEvent }
  | { type: 'READY'; turnId: string }
  | { type: 'ERROR'; value: VoiceErrorEvent }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET' };

function upsert(messages: VoiceHistoryMessage[], message: VoiceHistoryMessage): VoiceHistoryMessage[] {
  const index = messages.findIndex(({ id }) => id === message.id);
  const next = index === -1
    ? [...messages, message]
    : messages.map((current, currentIndex) => currentIndex === index ? message : current);
  return next.slice(-100);
}

export function meetingVoiceReducer(
  state: MeetingVoiceState,
  action: MeetingVoiceAction,
): MeetingVoiceState {
  switch (action.type) {
    case 'STARTING':
      return { ...state, starting: action.value, error: action.value ? null : state.error };
    case 'RECORDING':
      return { ...state, recording: action.value };
    case 'UPLOAD_PROGRESS':
      return { ...state, uploadProgress: action.value };
    case 'SYNCING':
      return { ...state, syncing: action.value };
    case 'SYNC':
      return {
        ...state,
        locked: action.value.activeTurn !== null,
        turnId: action.value.activeTurn?.turnId ?? null,
        ownerUserId: action.value.activeTurn?.ownerUserId ?? null,
        ownerName: action.value.activeTurn?.ownerName ?? null,
        turnState: action.value.activeTurn?.state ?? 'IDLE',
        messages: action.value.messages.slice(-100),
        syncing: false,
        starting: false,
        transcriptRevisions: {},
      };
    case 'LOCK':
      return {
        ...state,
        locked: action.value.locked,
        turnId: action.value.turnId,
        ownerUserId: action.value.ownerUserId,
        ownerName: action.value.ownerName,
        turnState: action.value.state,
        starting: false,
        error: action.value.locked ? null : state.error,
      };
    case 'STATE':
      if (state.turnId && action.value.turnId !== state.turnId) return state;
      return { ...state, turnId: action.value.turnId, turnState: action.value.state };
    case 'TRANSCRIPT':
      if (
        action.value.revision !== undefined
        && action.value.revision < (state.transcriptRevisions[action.value.turnId] ?? -1)
      ) return state;
      return {
        ...state,
        transcriptRevisions: {
          ...state.transcriptRevisions,
          [action.value.turnId]: action.value.revision ?? (state.transcriptRevisions[action.value.turnId] ?? 0),
        },
        messages: upsert(state.messages, {
          id: `${action.value.turnId}:user`,
          turnId: action.value.turnId,
          role: 'user',
          speakerUserId: action.value.speakerUserId,
          speakerName: action.value.speakerName,
          displayText: action.value.text,
          createdAt: new Date().toISOString(),
          status: action.value.isFinal ? 'COMPLETED' : 'STREAMING',
        }),
      };
    case 'MESSAGE':
      return {
        ...state,
        messages: upsert(state.messages, {
          id: `${action.value.turnId}:assistant`,
          turnId: action.value.turnId,
          role: 'assistant',
          speakerUserId: null,
          speakerName: 'Nexus AI',
          displayText: action.value.displayText,
          createdAt: new Date().toISOString(),
          status: action.value.isFinal ? 'COMPLETED' : 'STREAMING',
        }),
      };
    case 'READY':
      if (state.turnId && state.turnId !== action.turnId) return state;
      return {
        ...state,
        locked: false,
        turnId: null,
        ownerUserId: null,
        ownerName: null,
        turnState: 'IDLE',
        recording: false,
        starting: false,
        uploadProgress: null,
      };
    case 'ERROR':
      return { ...state, error: action.value, starting: false, recording: false, uploadProgress: null };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'RESET':
      return initialMeetingVoiceState;
    default:
      return state;
  }
}
