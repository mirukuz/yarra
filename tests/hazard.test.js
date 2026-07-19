import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHazard, updateHazard } from '../src/hazard.js';

function make(over = {}) {
  return createHazard({ x1: 0, y1: 50, x2: 100, y2: 50, speed: 50, w: 12, h: 10, kind: 'fox', ...over });
}

test('createHazard starts at (x1, y1) with given size and kind', () => {
  const h = make();
  assert.equal(h.x, 0);
  assert.equal(h.y, 50);
  assert.equal(h.w, 12);
  assert.equal(h.h, 10);
  assert.equal(h.kind, 'fox');
  assert.equal(h.movingToEnd, true);
});

test('moves toward end at speed px/s', () => {
  const h = make();
  updateHazard(h, 1);
  assert.equal(h.x, 50);
  assert.equal(h.y, 50);
});

test('snaps to end and reverses when arriving', () => {
  const h = make();
  updateHazard(h, 2); // step 100 ≥ dist 100 → snap + flip
  assert.equal(h.x, 100);
  assert.equal(h.movingToEnd, false);
  updateHazard(h, 1); // now heading back
  assert.equal(h.x, 50);
});

test('ping-pongs back to start and reverses again', () => {
  const h = make();
  updateHazard(h, 2); // at end
  updateHazard(h, 2); // back at start
  assert.equal(h.x, 0);
  assert.equal(h.movingToEnd, true);
});

test('facingLeft follows horizontal direction, persists on vertical legs', () => {
  const h = make();
  updateHazard(h, 0.1);
  assert.equal(h.facingLeft, false);
  updateHazard(h, 2); // reaches end, flips target
  updateHazard(h, 0.1); // now moving left
  assert.equal(h.facingLeft, true);
  const v = make({ x2: 0, y2: 150 }); // pure vertical
  v.facingLeft = true;
  updateHazard(v, 0.1);
  assert.equal(v.facingLeft, true);
});

test('diagonal patrol moves along the straight line between endpoints', () => {
  const h = createHazard({ x1: 0, y1: 0, x2: 30, y2: 40, speed: 25, w: 12, h: 10, kind: 'possum' });
  updateHazard(h, 1); // 25px along a 50px diagonal → (15, 20)
  assert.ok(Math.abs(h.x - 15) < 0.001);
  assert.ok(Math.abs(h.y - 20) < 0.001);
});
