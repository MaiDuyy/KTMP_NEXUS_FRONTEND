const TARGET_SAMPLE_RATE = 16000;
const CHUNK_SAMPLES = 320;

class Pcm16Resampler {
  constructor(sourceSampleRate, onChunk, targetSampleRate = TARGET_SAMPLE_RATE, chunkSamples = CHUNK_SAMPLES) {
    if (!Number.isFinite(sourceSampleRate) || sourceSampleRate <= 0) throw new Error('invalid source sample rate');
    this.sourceSampleRate = Math.round(sourceSampleRate);
    this.targetSampleRate = targetSampleRate;
    this.chunkSamples = chunkSamples;
    this.onChunk = onChunk;
    this.source = [];
    this.sourceStartIndex = 0;
    this.nextOutputNumerator = 0;
    this.output = [];
    this.sequence = 0;
    this.closed = false;
  }

  push(input) {
    if (this.closed || !input || input.length === 0) return;
    for (let index = 0; index < input.length; index += 1) this.source.push(input[index]);
    this.processAvailable();
  }

  processAvailable() {
    const lastSourceIndex = this.sourceStartIndex + this.source.length - 1;
    let leftSourceIndex = Math.floor(this.nextOutputNumerator / this.targetSampleRate);
    while (leftSourceIndex + 1 <= lastSourceIndex) {
      const localLeftIndex = leftSourceIndex - this.sourceStartIndex;
      const fraction = (this.nextOutputNumerator % this.targetSampleRate) / this.targetSampleRate;
      const sample = this.source[localLeftIndex]
        + ((this.source[localLeftIndex + 1] - this.source[localLeftIndex]) * fraction);
      this.output.push(sample);
      this.nextOutputNumerator += this.sourceSampleRate;
      if (this.output.length === this.chunkSamples) this.emitChunk();
      leftSourceIndex = Math.floor(this.nextOutputNumerator / this.targetSampleRate);
    }

    const keepFromIndex = Math.min(leftSourceIndex, lastSourceIndex);
    const consumed = Math.max(0, keepFromIndex - this.sourceStartIndex);
    if (consumed > 0) {
      this.source = this.source.slice(consumed);
      this.sourceStartIndex += consumed;
    }
  }

  flush() {
    if (this.closed) return;
    if (this.source.length > 0) {
      this.source.push(this.source[this.source.length - 1]);
      this.processAvailable();
    }
    if (this.output.length > 0) {
      while (this.output.length < this.chunkSamples) this.output.push(0);
      this.emitChunk();
    }
    this.close();
  }

  cancel() {
    if (this.closed) return;
    this.output = [];
    this.close();
  }

  close() {
    this.closed = true;
    this.source = [];
    this.sourceStartIndex = 0;
  }

  emitChunk() {
    const pcm = new ArrayBuffer(this.chunkSamples * 2);
    const view = new DataView(pcm);
    for (let index = 0; index < this.chunkSamples; index += 1) {
      const clamped = Math.max(-1, Math.min(1, this.output[index]));
      const quantized = Math.round(clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff);
      view.setInt16(index * 2, quantized, true);
    }
    this.output = [];
    this.onChunk({ sequence: this.sequence, pcm });
    this.sequence += 1;
  }
}

const WorkletBase = typeof AudioWorkletProcessor === 'undefined' ? class {} : AudioWorkletProcessor;

class MeetingVoicePcmProcessor extends WorkletBase {
  constructor() {
    super();
    this.resampler = new Pcm16Resampler(sampleRate, ({ sequence, pcm }) => {
      this.port.postMessage({ type: 'pcm', sequence, pcm }, [pcm]);
    });
    this.port.onmessage = (event) => {
      if (event.data?.type === 'flush') {
        this.resampler.flush();
        this.port.postMessage({ type: 'flushed' });
      } else if (event.data?.type === 'cancel') {
        this.resampler.cancel();
      }
    };
  }

  process(inputs) {
    const channel = inputs[0]?.[0];
    if (channel) this.resampler.push(channel);
    return !this.resampler.closed;
  }
}

if (typeof registerProcessor === 'function') {
  registerProcessor('meeting-voice-pcm-processor', MeetingVoicePcmProcessor);
}

if (typeof module !== 'undefined') {
  module.exports = { Pcm16Resampler, TARGET_SAMPLE_RATE, CHUNK_SAMPLES };
}
