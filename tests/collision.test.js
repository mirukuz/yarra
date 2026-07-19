import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rectsOverlap } from '../src/collision.js';

test('overlapping rects overlap', () => {
  assert.equal(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 }), true);
});

test('separated rects do not overlap', () => {
  assert.equal(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 20, y: 0, w: 10, h: 10 }), false);
  assert.equal(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 0, y: 20, w: 10, h: 10 }), false);
});

test('edge-touching rects do not overlap', () => {
  assert.equal(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 }), false);
  assert.equal(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 0, y: 10, w: 10, h: 10 }), false);
});

test('containment counts as overlap', () => {
  assert.equal(rectsOverlap({ x: 0, y: 0, w: 20, h: 20 }, { x: 5, y: 5, w: 4, h: 4 }), true);
});
