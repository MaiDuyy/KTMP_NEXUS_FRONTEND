/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
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

const { Pcm16Resampler } = require(path.resolve(__dirname, '../../../public/worklets/meeting-voice-pcm-processor.js'));
const { chooseVoiceTransportMode } = require('./streamingCapability.ts');
const { createPcmAudioCapture } = require('./pcmAudioWorklet.ts');

test('PCM conversion emits signed little-endian 20 ms chunks at 16 kHz', () => {
  const chunks = [];
  const converter = new Pcm16Resampler(16000, (chunk) => chunks.push(chunk));
  const samples = new Float32Array(320);
  samples[0] = -1;
  samples[1] = 1;
  converter.push(samples);
  converter.flush();

  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].sequence, 0);
  assert.equal(chunks[0].pcm.byteLength, 640);
  const view = new DataView(chunks[0].pcm);
  assert.equal(view.getInt16(0, true), -32768);
  assert.equal(view.getInt16(2, true), 32767);
});

test('48 kHz input is downsampled to the expected 16 kHz duration', () => {
  const chunks = [];
  const converter = new Pcm16Resampler(48000, (chunk) => chunks.push(chunk));
  converter.push(new Float32Array(48000).fill(0.25));
  converter.flush();

  assert.equal(chunks.length, 50);
  assert.deepEqual(chunks.map((chunk) => chunk.sequence), Array.from({ length: 50 }, (_, index) => index));
  assert.ok(chunks.every((chunk) => chunk.pcm.byteLength === 640));
});

test('44.1 kHz resampling does not add a drift-padding chunk after one second', () => {
  const chunks = [];
  const converter = new Pcm16Resampler(44100, (chunk) => chunks.push(chunk));
  converter.push(new Float32Array(44100).fill(0.25));
  converter.flush();

  assert.equal(chunks.length, 50);
  assert.equal(chunks.at(-1).sequence, 49);
});

test('flush pads one partial chunk while cancel emits no partial audio', () => {
  const flushed = [];
  const flushConverter = new Pcm16Resampler(16000, (chunk) => flushed.push(chunk));
  flushConverter.push(new Float32Array(100).fill(0.5));
  flushConverter.flush();
  assert.equal(flushed.length, 1);
  assert.equal(new DataView(flushed[0].pcm).getInt16(638, true), 0);

  const cancelled = [];
  const cancelConverter = new Pcm16Resampler(16000, (chunk) => cancelled.push(chunk));
  cancelConverter.push(new Float32Array(100).fill(0.5));
  cancelConverter.cancel();
  cancelConverter.flush();
  assert.equal(cancelled.length, 0);
});

test('streaming capability selection fails over to batch when one requirement is missing', () => {
  const supported = {
    secureContext: true,
    webSocket: true,
    audioContext: true,
    audioWorkletNode: true,
    getUserMedia: true,
  };
  assert.equal(chooseVoiceTransportMode(supported), 'streaming');
  for (const key of Object.keys(supported)) {
    assert.equal(chooseVoiceTransportMode({ ...supported, [key]: false }), 'batch');
  }
});

function createCaptureHarness() {
  const counts = { trackStop: 0, sourceDisconnect: 0, nodeDisconnect: 0, gainDisconnect: 0, close: 0, cancel: 0 };
  const port = {
    onmessage: null,
    postMessage(message) {
      if (message.type === 'flush') this.onmessage?.({ data: { type: 'flushed' } });
      if (message.type === 'cancel') counts.cancel += 1;
    },
  };
  const node = {
    port,
    connect() {},
    disconnect() { counts.nodeDisconnect += 1; },
  };
  const source = {
    connect() {},
    disconnect() { counts.sourceDisconnect += 1; },
  };
  const gain = {
    gain: { value: 1 },
    connect() {},
    disconnect() { counts.gainDisconnect += 1; },
  };
  class FakeAudioContext {
    constructor() {
      this.state = 'running';
      this.destination = {};
      this.audioWorklet = { addModule: async () => undefined };
    }
    createMediaStreamSource() { return source; }
    createGain() { return gain; }
    async resume() {}
    async close() { this.state = 'closed'; counts.close += 1; }
  }
  const dependencies = {
    getUserMedia: async () => ({ getTracks: () => [{ stop: () => { counts.trackStop += 1; } }] }),
    AudioContext: FakeAudioContext,
    createWorkletNode: () => node,
  };
  return { counts, dependencies, port };
}

test('capture stop forwards PCM, flushes, and releases owned resources once', async () => {
  global.window = { setTimeout, clearTimeout };
  const harness = createCaptureHarness();
  const chunks = [];
  const capture = await createPcmAudioCapture({ onChunk: (chunk) => chunks.push(chunk) }, harness.dependencies);
  harness.port.onmessage({ data: { type: 'pcm', sequence: 0, pcm: new ArrayBuffer(640) } });
  await capture.stop();
  await capture.stop();

  assert.equal(chunks.length, 1);
  assert.deepEqual(harness.counts, {
    trackStop: 1,
    sourceDisconnect: 1,
    nodeDisconnect: 1,
    gainDisconnect: 1,
    close: 1,
    cancel: 0,
  });
});

test('capture cancel does not flush and releases owned resources once', async () => {
  global.window = { setTimeout, clearTimeout };
  const harness = createCaptureHarness();
  const capture = await createPcmAudioCapture({ onChunk: () => assert.fail('unexpected chunk') }, harness.dependencies);
  await capture.cancel();
  await capture.cancel();

  assert.equal(harness.counts.cancel, 1);
  assert.equal(harness.counts.trackStop, 1);
  assert.equal(harness.counts.close, 1);
});
