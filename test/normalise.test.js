// test() registers one test. assert checks a value and throws if it is wrong.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { normalise } from '../src/normalise.js';

test('expands contractions and lowercases', () => {
  const { text } = normalise("I've LOST my job!");
  // strictEqual: the two values must be exactly the same.
  assert.equal(text, 'i have lost my job');
});

test('every tidied character points back into the original email', () => {
  const original = "I can't pay.";
  const { text, map } = normalise(original);
  // One map entry per tidied character, plus one extra at the end.
  assert.equal(map.length, text.length + 1);
  for (const i of map) assert.ok(i >= 0 && i <= original.length);
});
