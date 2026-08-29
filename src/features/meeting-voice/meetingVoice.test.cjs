/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: filename,
  }).outputText;
  module._compile(output, filename);
};

const { initialMeetingVoiceState, meetingVoiceReducer } = require('./meetingVoiceReducer.ts');
const { createMeetingRecorder } = require('./mediaRecorder.ts');
const { uploadVoiceAudio, VoiceUploadError } = require('./uploadVoiceAudio.ts');

test('meeting voice reducer restores a locked session, appends transcript, then unlocks on ready', () => {
  let state = meetingVoiceReducer(initialMeetingVoiceState, {
    type: 'SYNC',
    value: {
      meetingSessionId: 'call-1',
      sessionState: 'READY',
      activeTurn: { turnId: 'turn-1', ownerUserId: 'user-1', ownerName: 'User One', state: 'THINKING' },
      messages: [],
    },
  });
  assert.equal(state.locked, true);
  assert.equal(state.ownerName, 'User One');

  state = meetingVoiceReducer(state, {
    type: 'TRANSCRIPT',
    value: {
      meetingSessionId: 'call-1',
      turnId: 'turn-1',
      speakerUserId: 'user-1',
      speakerName: 'User One',
      text: 'Câu hỏi',
      isFinal: true,
    },
  });
  assert.deepEqual(state.messages.map(({ role, displayText }) => ({ role, displayText })), [
    { role: 'user', displayText: 'Câu hỏi' },
  ]);

  state = meetingVoiceReducer(state, { type: 'READY', turnId: 'turn-1' });
  assert.equal(state.locked, false);
  assert.equal(state.messages.length, 1);
});

test('meeting recorder emits WebM audio and stops every media track', async () => {
  let trackStops = 0;
  const track = { stop: () => { trackStops += 1; } };
  Object.defineProperty(global, 'navigator', {
    configurable: true,
    value: { mediaDevices: { getUserMedia: async () => ({ getTracks: () => [track] }) } },
  });
  global.MediaRecorder = class FakeMediaRecorder {
    static isTypeSupported(type) { return type.startsWith('audio/webm'); }
    constructor() { this.state = 'inactive'; this.listeners = new Map(); }
    addEventListener(name, listener) { this.listeners.set(name, listener); }
    start() { this.state = 'recording'; }
    stop() {
      this.state = 'inactive';
      this.listeners.get('dataavailable')?.({ data: new Blob(['voice'], { type: 'audio/webm' }) });
      this.listeners.get('stop')?.();
    }
  };

  const recorder = await createMeetingRecorder({ maxDurationMs: 5_000 });
  const audio = await recorder.stop();
  assert.equal(audio.type, 'audio/webm;codecs=opus');
  assert.equal(audio.size, 5);
  assert.equal(trackStops, 1);
});

test('voice uploader rejects oversized audio before opening a network request', async () => {
  await assert.rejects(
    uploadVoiceAudio({
      url: 'http://example.test/upload',
      token: 'secret-token',
      audio: new Blob([new Uint8Array(10 * 1024 * 1024 + 1)], { type: 'audio/webm' }),
    }),
    (error) => error instanceof VoiceUploadError && error.code === 'VOICE_AUDIO_TOO_LARGE',
  );
});
