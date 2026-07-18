import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nearestItemInRange, PICKUP_RADIUS } from '../src/items.js';

const player = { x: 92, y: 92, w: 16, h: 16 }; // center (100, 100)
const none = () => false;

test('returns null when no item is in range', () => {
  const items = [{ id: 'a', x: 200, y: 200 }];
  assert.equal(nearestItemInRange(player, items, none, PICKUP_RADIUS), null);
});

test('returns an item within range', () => {
  const items = [{ id: 'a', x: 110, y: 100 }];
  assert.equal(nearestItemInRange(player, items, none, PICKUP_RADIUS).id, 'a');
});

test('returns the closest of several in-range items', () => {
  const items = [
    { id: 'far', x: 115, y: 100 },
    { id: 'close', x: 104, y: 100 },
  ];
  assert.equal(nearestItemInRange(player, items, none, PICKUP_RADIUS).id, 'close');
});

test('skips already-collected items', () => {
  const items = [
    { id: 'taken', x: 104, y: 100 },
    { id: 'left', x: 112, y: 100 },
  ];
  const isCollected = (id) => id === 'taken';
  assert.equal(nearestItemInRange(player, items, isCollected, PICKUP_RADIUS).id, 'left');
});

test('item exactly at radius distance counts as in range', () => {
  const items = [{ id: 'edge', x: 100 + PICKUP_RADIUS, y: 100 }];
  assert.equal(nearestItemInRange(player, items, none, PICKUP_RADIUS).id, 'edge');
});
