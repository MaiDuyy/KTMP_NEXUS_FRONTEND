export type RecorderErrorCode =
  | 'MIC_PERMISSION_DENIED'
  | 'MIC_NOT_FOUND'
  | 'MIC_BUSY'
  | 'RECORDER_UNSUPPORTED'
  | 'RECORDER_FAILED';

export class MeetingRecorderError extends Error {
  public constructor(public readonly code: RecorderErrorCode) {
    super(code);
  }
}

export interface MeetingRecorder {
  readonly mimeType: string;
  stop(): Promise<Blob>;
  cancel(): void;
}

const MIME_TYPES = ['audio/webm;codecs=opus', 'audio/webm'];

function mapMediaError(error: unknown): MeetingRecorderError {
  const name = error instanceof DOMException ? error.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return new MeetingRecorderError('MIC_PERMISSION_DENIED');
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return new MeetingRecorderError('MIC_NOT_FOUND');
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return new MeetingRecorderError('MIC_BUSY');
  }
  return new MeetingRecorderError('RECORDER_FAILED');
}

export async function createMeetingRecorder(options: {
  maxDurationMs?: number;
  onLimitReached?: (audio: Blob) => void | Promise<void>;
} = {}): Promise<MeetingRecorder> {
  if (
    typeof navigator === 'undefined' ||
    !navigator.mediaDevices?.getUserMedia ||
    typeof MediaRecorder === 'undefined'
  ) {
    throw new MeetingRecorderError('RECORDER_UNSUPPORTED');
  }

  const mimeType = MIME_TYPES.find((candidate) => MediaRecorder.isTypeSupported(candidate));
  if (!mimeType) throw new MeetingRecorderError('RECORDER_UNSUPPORTED');

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
  } catch (error) {
    throw mapMediaError(error);
  }

  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: BlobPart[] = [];
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopRequested = false;
  let resolveAudio!: (audio: Blob) => void;
  let rejectAudio!: (error: MeetingRecorderError) => void;
  const audio = new Promise<Blob>((resolve, reject) => {
    resolveAudio = resolve;
    rejectAudio = reject;
  });
  void audio.catch(() => undefined);

  const cleanup = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    for (const track of stream.getTracks()) track.stop();
  };

  recorder.addEventListener('dataavailable', (event) => {
    if (!cancelled && event.data.size > 0) chunks.push(event.data);
  });
  recorder.addEventListener('stop', () => {
    cleanup();
    resolveAudio(new Blob(cancelled ? [] : chunks, { type: mimeType }));
  }, { once: true });
  recorder.addEventListener('error', () => {
    cleanup();
    rejectAudio(new MeetingRecorderError('RECORDER_FAILED'));
  }, { once: true });

  const stop = (): Promise<Blob> => {
    if (!stopRequested) {
      stopRequested = true;
      if (timer) clearTimeout(timer);
      if (recorder.state !== 'inactive') recorder.stop();
    }
    return audio;
  };

  try {
    recorder.start(250);
  } catch (error) {
    cleanup();
    throw mapMediaError(error);
  }

  const maxDurationMs = options.maxDurationMs ?? 60_000;
  timer = setTimeout(() => {
    void stop().then((blob) => options.onLimitReached?.(blob));
  }, maxDurationMs);

  return {
    mimeType,
    stop,
    cancel: () => {
      cancelled = true;
      void stop();
    },
  };
}
