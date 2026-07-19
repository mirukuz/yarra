import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createPlayer, movePlayer,
  MAX_HEARTS, INVINCIBLE_SECONDS,
  damagePlayer, updateInvincibility, isInvincible, resetHearts,
} from '../src/player.js';

const BOUNDS = { x: 0, y: 0, w: 320, h: 180 };

test('createPlayer starts at given position facing right', () => {
  const p = createPlayer(10, 20);
  assert.equal(p.x, 10);
  assert.equal(p.y, 20);
  assert.equal(p.facingLeft, false);
});

test('moves right at full speed on one axis', () => {
  const p = createPlayer(50, 50);
  movePlayer(p, 1, 0, 1, BOUNDS);
  assert.equal(p.x, 50 + p.speed);
  assert.equal(p.y, 50);
});

test('diagonal movement is normalized to the same speed', () => {
  const p = createPlayer(50, 50);
  movePlayer(p, 1, 1, 1, BOUNDS);
  const dist = Math.hypot(p.x - 50, p.y - 50);
  assert.ok(Math.abs(dist - p.speed) < 0.001);
});

test('clamps to top-left and bottom-right bounds', () => {
  const p = createPlayer(0, 0);
  movePlayer(p, -1, -1, 10, BOUNDS);
  assert.equal(p.x, 0);
  assert.equal(p.y, 0);
  movePlayer(p, 1, 1, 100, BOUNDS);
  assert.equal(p.x, BOUNDS.w - p.w);
  assert.equal(p.y, BOUNDS.h - p.h);
});

test('facingLeft follows horizontal movement and persists when idle', () => {
  const p = createPlayer(50, 50);
  movePlayer(p, -1, 0, 0.1, BOUNDS);
  assert.equal(p.facingLeft, true);
  movePlayer(p, 0, 1, 0.1, BOUNDS);
  assert.equal(p.facingLeft, true);
  movePlayer(p, 1, 0, 0.1, BOUNDS);
  assert.equal(p.facingLeft, false);
});

test('createPlayer starts with full hearts and no invincibility', () => {
  const p = createPlayer(0, 0);
  assert.equal(p.hearts, MAX_HEARTS);
  assert.equal(p.invincibleTimer, 0);
  assert.equal(isInvincible(p), false);
});

test('damagePlayer removes one heart and grants invincibility', () => {
  const p = createPlayer(0, 0);
  damagePlayer(p);
  assert.equal(p.hearts, MAX_HEARTS - 1);
  assert.equal(p.invincibleTimer, INVINCIBLE_SECONDS);
  assert.equal(isInvincible(p), true);
});

test('damage is ignored while invincible', () => {
  const p = createPlayer(0, 0);
  damagePlayer(p);
  damagePlayer(p);
  assert.equal(p.hearts, MAX_HEARTS - 1);
});

test('damage lands again after invincibility expires', () => {
  const p = createPlayer(0, 0);
  damagePlayer(p);
  updateInvincibility(p, INVINCIBLE_SECONDS + 0.01);
  assert.equal(isInvincible(p), false);
  damagePlayer(p);
  assert.equal(p.hearts, MAX_HEARTS - 2);
});

test('updateInvincibility never goes below zero', () => {
  const p = createPlayer(0, 0);
  updateInvincibility(p, 5);
  assert.equal(p.invincibleTimer, 0);
});

test('resetHearts refills hearts and clears invincibility', () => {
  const p = createPlayer(0, 0);
  damagePlayer(p);
  damagePlayer(p);
  resetHearts(p);
  assert.equal(p.hearts, MAX_HEARTS);
  assert.equal(p.invincibleTimer, 0);
});
