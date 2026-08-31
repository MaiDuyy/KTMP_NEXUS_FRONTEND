import type { VoiceTransportMode } from './types';

export interface VoiceStreamingCapabilities {
  secureContext: boolean;
  webSocket: boolean;
  audioContext: boolean;
  audioWorkletNode: boolean;
  getUserMedia: boolean;
}

export function readVoiceStreamingCapabilities(): VoiceStreamingCapabilities {
  const browserWindow = typeof window === 'undefined' ? undefined : window;
  const audioContext = browserWindow
    ? browserWindow.AudioContext || (browserWindow as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    : undefined;

  return {
    secureContext: browserWindow?.isSecureContext === true,
    webSocket: typeof WebSocket !== 'undefined',
    audioContext: typeof audioContext === 'function',
    audioWorkletNode: typeof AudioWorkletNode !== 'undefined',
    getUserMedia: typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getUserMedia === 'function',
  };
}

export function chooseVoiceTransportMode(
  capabilities: VoiceStreamingCapabilities = readVoiceStreamingCapabilities(),
): VoiceTransportMode {
  return Object.values(capabilities).every(Boolean) ? 'streaming' : 'batch';
}
