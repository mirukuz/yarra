import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keysToVector, createInteractLatch } from '../src/input.js';

test('no keys gives zero vector', () => {
  assert.deepEqual(keysToVector(new Set()), { dx: 0, dy: 0 });
});

test('arrows and WASD map to directions', () => {
  assert.deepEqual(keysToVector(new Set(['ArrowUp'])), { dx: 0, dy: -1 });
  assert.deepEqual(keysToVector(new Set(['KeyS'])), { dx: 0, dy: 1 });
  assert.deepEqual(keysToVector(new Set(['KeyA', 'ArrowUp'])), { dx: -1, dy: -1 });
});

test('opposite keys cancel; unrelated keys ignored', () => {
  assert.deepEqual(keysToVector(new Set(['ArrowLeft', 'ArrowRight'])), { dx: 0, dy: 0 });
  assert.deepEqual(keysToVector(new Set(['KeyQ', 'Space'])), { dx: 0, dy: 0 });
});

test('duplicate arrow+WASD same direction clamps to 1', () => {
  assert.deepEqual(keysToVector(new Set(['ArrowUp', 'KeyW'])), { dx: 0, dy: -1 });
});

test('interact latch fires once per press', () => {
  const latch = createInteractLatch();
  assert.equal(latch.consume(), false);
  latch.press();
  assert.equal(latch.consume(), true);
  assert.equal(latch.consume(), false);
});

test('two presses before a consume still yield one consume', () => {
  const latch = createInteractLatch();
  latch.press();
  latch.press();
  assert.equal(latch.consume(), true);
  assert.equal(latch.consume(), false);
});
