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

const { isMeetingVoiceEnabled } = require('./meetingVoiceFeature.ts');

test('meeting voice frontend flag defaults on locally and off in production', () => {
  assert.equal(isMeetingVoiceEnabled(undefined, 'development'), true);
  assert.equal(isMeetingVoiceEnabled(undefined, 'test'), true);
  assert.equal(isMeetingVoiceEnabled(undefined, 'production'), false);
});

test('meeting voice frontend flag accepts strict values and fails closed', () => {
  assert.equal(isMeetingVoiceEnabled('true', 'production'), true);
  assert.equal(isMeetingVoiceEnabled('1', 'production'), true);
  assert.equal(isMeetingVoiceEnabled('false', 'development'), false);
  assert.equal(isMeetingVoiceEnabled('0', 'development'), false);
  assert.equal(isMeetingVoiceEnabled('yes', 'development'), false);
});
