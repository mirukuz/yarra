import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LINES,
  PICKUP_LINES,
  createDialogue,
  currentLine,
  advanceDialogue,
  isDialogueDone,
} from '../src/dialogue.js';

test('all narrative beats exist and are non-empty', () => {
  const keys = ['intro', 'lakeEnter', 'lakeDone', 'forestEnter', 'forestDone',
    'oceanEnter', 'oceanDone', 'locked', 'datacenterEnter', 'gateOpen', 'ending'];
  for (const key of keys) {
    assert.ok(Array.isArray(LINES[key]), `${key} missing`);
    assert.ok(LINES[key].length > 0, `${key} empty`);
    for (const line of LINES[key]) assert.equal(typeof line, 'string');
  }
});

test('every item kind has a pickup line', () => {
  for (const kind of ['line', 'bottle', 'cap', 'bag']) {
    assert.equal(typeof PICKUP_LINES[kind], 'string');
    assert.ok(PICKUP_LINES[kind].length > 0);
  }
});

test('dialogue starts at the first line', () => {
  const d = createDialogue(['one', 'two']);
  assert.equal(currentLine(d), 'one');
  assert.equal(isDialogueDone(d), false);
});

test('advance walks through all lines then finishes', () => {
  const d = createDialogue(['one', 'two']);
  advanceDialogue(d);
  assert.equal(currentLine(d), 'two');
  assert.equal(isDialogueDone(d), false);
  advanceDialogue(d);
  assert.equal(currentLine(d), null);
  assert.equal(isDialogueDone(d), true);
});

test('advancing a finished dialogue stays finished', () => {
  const d = createDialogue(['only']);
  advanceDialogue(d);
  advanceDialogue(d);
  assert.equal(isDialogueDone(d), true);
  assert.equal(currentLine(d), null);
});
