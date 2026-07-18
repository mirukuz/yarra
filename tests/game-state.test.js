import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SITE_IDS,
  SAMPLES_PER_SITE,
  TOTAL_SAMPLES,
  createGameState,
  collectItem,
  isItemCollected,
  siteProgress,
  isSiteComplete,
  totalProgress,
  isDatacenterUnlocked,
} from '../src/game-state.js';

test('constants: 3 sites, 4 samples each, 12 total', () => {
  assert.deepEqual(SITE_IDS, ['lake', 'forest', 'ocean']);
  assert.equal(SAMPLES_PER_SITE, 4);
  assert.equal(TOTAL_SAMPLES, 12);
});

test('new state starts empty and locked', () => {
  const s = createGameState();
  assert.equal(totalProgress(s), 0);
  assert.equal(s.gateOpened, false);
  for (const id of SITE_IDS) {
    assert.equal(siteProgress(s, id), 0);
    assert.equal(isSiteComplete(s, id), false);
  }
  assert.equal(isDatacenterUnlocked(s), false);
});

test('collectItem records an item once', () => {
  const s = createGameState();
  assert.equal(collectItem(s, 'lake', 'line-1'), true);
  assert.equal(isItemCollected(s, 'lake', 'line-1'), true);
  assert.equal(siteProgress(s, 'lake'), 1);
});

test('collecting the same item twice is rejected', () => {
  const s = createGameState();
  collectItem(s, 'lake', 'line-1');
  assert.equal(collectItem(s, 'lake', 'line-1'), false);
  assert.equal(siteProgress(s, 'lake'), 1);
});

test('collectItem on unknown site is rejected', () => {
  const s = createGameState();
  assert.equal(collectItem(s, 'volcano', 'x'), false);
  assert.equal(totalProgress(s), 0);
});

test('site completes at 4 items', () => {
  const s = createGameState();
  for (let i = 1; i <= 4; i++) collectItem(s, 'forest', `bottle-${i}`);
  assert.equal(isSiteComplete(s, 'forest'), true);
  assert.equal(siteProgress(s, 'forest'), 4);
});

test('totalProgress sums across sites', () => {
  const s = createGameState();
  collectItem(s, 'lake', 'a');
  collectItem(s, 'forest', 'b');
  collectItem(s, 'ocean', 'c');
  assert.equal(totalProgress(s), 3);
});

test('datacenter unlocks only when all three sites are complete', () => {
  const s = createGameState();
  for (const id of SITE_IDS) {
    for (let i = 1; i <= 4; i++) collectItem(s, id, `item-${i}`);
  }
  assert.equal(isDatacenterUnlocked(s), true);
  assert.equal(totalProgress(s), TOTAL_SAMPLES);
});

test('two sites complete is not enough to unlock', () => {
  const s = createGameState();
  for (const id of ['lake', 'forest']) {
    for (let i = 1; i <= 4; i++) collectItem(s, id, `item-${i}`);
  }
  assert.equal(isDatacenterUnlocked(s), false);
});
