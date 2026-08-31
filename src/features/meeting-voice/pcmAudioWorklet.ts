export interface VoicePcmChunk {
  sequence: number;
  pcm: ArrayBuffer;
}

export interface PcmAudioCapture {
  stop(): Promise<void>;
  cancel(): Promise<void>;
}

export interface PcmAudioCaptureOptions {
  onChunk: (chunk: VoicePcmChunk) => void;
  workletUrl?: string;
  flushTimeoutMs?: number;
}

type AudioContextConstructor = new (options?: AudioContextOptions) => AudioContext;

export interface PcmAudioCaptureDependencies {
  getUserMedia: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
  AudioContext: AudioContextConstructor;
  createWorkletNode: (context: AudioContext) => AudioWorkletNode;
}

function defaultDependencies(): PcmAudioCaptureDependencies {
  const browserWindow = window as typeof window & { webkitAudioContext?: AudioContextConstructor };
  const AudioContextImpl = browserWindow.AudioContext || browserWindow.webkitAudioContext;
  if (!AudioContextImpl || typeof AudioWorkletNode === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('VOICE_STREAM_CAPTURE_UNSUPPORTED');
  }
  return {
    getUserMedia: (constraints) => navigator.mediaDevices.getUserMedia(constraints),
    AudioContext: AudioContextImpl,
    createWorkletNode: (context) => new AudioWorkletNode(context, 'meeting-voice-pcm-processor', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      channelCount: 1,
      channelCountMode: 'explicit',
    }),
  };
}

export async function createPcmAudioCapture(
  options: PcmAudioCaptureOptions,
  dependencies: PcmAudioCaptureDependencies = defaultDependencies(),
): Promise<PcmAudioCapture> {
  const stream = await dependencies.getUserMedia({
    video: false,
    audio: {
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });

  let context: AudioContext | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  let node: AudioWorkletNode | null = null;
  let mutedOutput: GainNode | null = null;
  let closed = false;

  const cleanup = async () => {
    if (closed) return;
    closed = true;
    node?.disconnect();
    source?.disconnect();
    mutedOutput?.disconnect();
    for (const track of stream.getTracks()) track.stop();
    if (context && context.state !== 'closed') await context.close();
    node = null;
    source = null;
    mutedOutput = null;
    context = null;
  };

  try {
    context = new dependencies.AudioContext({ latencyHint: 'interactive' });
    await context.audioWorklet.addModule(options.workletUrl ?? '/worklets/meeting-voice-pcm-processor.js');
    source = context.createMediaStreamSource(stream);
    node = dependencies.createWorkletNode(context);
    mutedOutput = context.createGain();
    mutedOutput.gain.value = 0;
    node.port.onmessage = (event: MessageEvent<{ type?: string; sequence?: number; pcm?: ArrayBuffer }>) => {
      if (closed || event.data.type !== 'pcm' || !Number.isSafeInteger(event.data.sequence) || !(event.data.pcm instanceof ArrayBuffer)) return;
      options.onChunk({ sequence: event.data.sequence as number, pcm: event.data.pcm });
    };
    source.connect(node);
    node.connect(mutedOutput);
    mutedOutput.connect(context.destination);
    await context.resume();
  } catch (error) {
    await cleanup();
    throw error;
  }

  return {
    stop: async () => {
      if (closed || !node) return;
      const activeNode = node;
      await new Promise<void>((resolve) => {
        const timeout = window.setTimeout(resolve, options.flushTimeoutMs ?? 500);
        const previous = activeNode.port.onmessage;
        activeNode.port.onmessage = (event: MessageEvent<{ type?: string; sequence?: number; pcm?: ArrayBuffer }>) => {
          previous?.call(activeNode.port, event);
          if (event.data.type === 'flushed') {
            window.clearTimeout(timeout);
            resolve();
          }
        };
        activeNode.port.postMessage({ type: 'flush' });
      });
      await cleanup();
    },
    cancel: async () => {
      if (!closed) node?.port.postMessage({ type: 'cancel' });
      await cleanup();
    },
  };
}
