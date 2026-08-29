const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

export type VoiceUploadErrorCode =
  | 'VOICE_AUDIO_TOO_LARGE'
  | 'VOICE_AUDIO_EMPTY'
  | 'VOICE_UPLOAD_TIMEOUT'
  | 'VOICE_UPLOAD_ABORTED'
  | 'VOICE_UPLOAD_NETWORK'
  | string;

export class VoiceUploadError extends Error {
  public constructor(public readonly code: VoiceUploadErrorCode) {
    super(code);
  }
}

export function uploadVoiceAudio(options: {
  url: string;
  token: string;
  audio: Blob;
  timeoutMs?: number;
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
}): Promise<void> {
  if (options.audio.size === 0) return Promise.reject(new VoiceUploadError('VOICE_AUDIO_EMPTY'));
  if (options.audio.size > MAX_AUDIO_BYTES) return Promise.reject(new VoiceUploadError('VOICE_AUDIO_TOO_LARGE'));

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      options.signal?.removeEventListener('abort', onAbort);
      callback();
    };
    const onAbort = () => {
      request.abort();
      finish(() => reject(new VoiceUploadError('VOICE_UPLOAD_ABORTED')));
    };

    request.open('POST', options.url);
    request.timeout = options.timeoutMs ?? 30_000;
    request.setRequestHeader('Authorization', `Bearer ${options.token}`);
    request.setRequestHeader('Content-Type', options.audio.type || 'audio/webm');
    request.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) options.onProgress?.(Math.round((event.loaded / event.total) * 100));
    });
    request.addEventListener('load', () => {
      if (request.status >= 200 && request.status < 300) {
        finish(resolve);
        return;
      }
      let code = 'VOICE_UPLOAD_NETWORK';
      try {
        const payload = JSON.parse(request.responseText) as { code?: string };
        if (payload.code) code = payload.code;
      } catch {
        // Keep the bounded client-side error code.
      }
      finish(() => reject(new VoiceUploadError(code)));
    });
    request.addEventListener('error', () => finish(() => reject(new VoiceUploadError('VOICE_UPLOAD_NETWORK'))));
    request.addEventListener('timeout', () => finish(() => reject(new VoiceUploadError('VOICE_UPLOAD_TIMEOUT'))));
    request.addEventListener('abort', () => finish(() => reject(new VoiceUploadError('VOICE_UPLOAD_ABORTED'))));

    if (options.signal?.aborted) {
      onAbort();
      return;
    }
    options.signal?.addEventListener('abort', onAbort, { once: true });
    request.send(options.audio);
  });
}
