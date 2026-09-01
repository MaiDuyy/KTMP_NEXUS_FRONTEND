/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  }).outputText;
  module._compile(output, filename);
};

const { connectVoiceStream, VoiceStreamTransportError } = require('./voiceStreamTransport.ts');

const descriptor = {
  protocolVersion: 1,
  audioFormat: { encoding: 'LINEAR16', sampleRateHz: 16000, channelCount: 1, chunkDurationMs: 20 },
  authTimeoutMs: 100,
  maxQueuedBytes: 1280,
};

class FakeSocket {
  constructor() {
    this.readyState = 0;
    this.bufferedAmount = 0;
    this.sent = [];
    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;
    this.onclose = null;
  }
  send(data) { this.sent.push(data); }
  close() { this.readyState = 3; }
  open() { this.readyState = 1; this.onopen?.({}); }
  message(value) { this.onmessage?.({ data: JSON.stringify(value) }); }
  disconnect() { this.readyState = 3; this.onclose?.({}); }
}

function harness() {
  const socket = new FakeSocket();
  const dependencies = {
    createSocket: () => socket,
    setTimer: (callback, timeoutMs) => setTimeout(callback, timeoutMs),
    clearTimer: (timer) => clearTimeout(timer),
  };
  const promise = connectVoiceStream({ url: 'ws://voice.test/v1/voice/turns/turn-1/stream', turnId: 'turn-1', turnToken: 'token', descriptor }, dependencies);
  return { socket, promise };
}

test('authenticates before sending PCM and finalizes with the last sequence', async () => {
  const { socket, promise } = harness();
  socket.open();
  assert.deepEqual(JSON.parse(socket.sent[0]), { type: 'auth', protocolVersion: 1, turnId: 'turn-1', turnToken: 'token' });
  socket.message({ type: 'ready', protocolVersion: 1 });
  const transport = await promise;

  transport.sendChunk({ sequence: 0, pcm: new ArrayBuffer(640) });
  const binary = socket.sent[1];
  assert.equal(binary.byteLength, 646);
  assert.equal(new DataView(binary).getUint32(2, false), 0);

  const ending = transport.end();
  assert.deepEqual(JSON.parse(socket.sent[2]), { type: 'end', finalSequence: 0 });
  socket.message({ type: 'finalized', finalSequence: 0 });
  await ending;
});

test('rejects local sequence, chunk size and browser backpressure violations', async () => {
  const { socket, promise } = harness();
  socket.open();
  socket.message({ type: 'ready', protocolVersion: 1 });
  const transport = await promise;

  assert.throws(() => transport.sendChunk({ sequence: 1, pcm: new ArrayBuffer(640) }), (error) => error instanceof VoiceStreamTransportError && error.code === 'VOICE_STREAM_SEQUENCE_ERROR');
  assert.throws(() => transport.sendChunk({ sequence: 0, pcm: new ArrayBuffer(100) }), /sequence or size/);
  socket.bufferedAmount = 1000;
  assert.throws(() => transport.sendChunk({ sequence: 0, pcm: new ArrayBuffer(640) }), (error) => error.code === 'VOICE_STREAM_BACKPRESSURE');
});

test('maps server errors and unexpected disconnects', async () => {
  const serverError = harness();
  serverError.socket.open();
  serverError.socket.message({ type: 'error', code: 'VOICE_TOKEN_INVALID', message: 'invalid', retryable: false });
  await assert.rejects(serverError.promise, (error) => error.code === 'VOICE_TOKEN_INVALID' && error.retryable === false);

  const disconnected = harness();
  disconnected.socket.open();
  disconnected.socket.disconnect();
  await assert.rejects(disconnected.promise, (error) => error.code === 'VOICE_STREAM_DISCONNECTED');
});
