# Site Hazards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 2 moving patrol hazards per collection site (lake/forest/ocean) with a 3-heart damage system, making item collection require dodging.

**Architecture:** Pure-logic modules `src/hazard.js` (ping-pong patrol) and `src/collision.js` (AABB) are unit-tested; `src/player.js` gains hearts/invincibility state. `src/scenes/site-common.js` wires hazards into site scenes via a new optional `hazards` config. Rendering additions (`drawHazard`, `drawHearts`) live in `src/render.js` (browser-only, verified via `node --check` + headless E2E render smoke).

**Tech Stack:** Vanilla JS ES modules, HTML5 Canvas 2D, Node built-in test runner (`npm test` → `node --test tests/*.test.js`). No dependencies, no build step.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-19-site-hazards-design.md`.
- Repo root: `/Users/zxc/Documents/projects/active/yarra` (branch `master`; do all work on a feature branch if the executing skill requires one).
- Hearts: `MAX_HEARTS = 3`, invincibility `0.8s`, hearts refill on every site entry AND on the 0-heart entrance reset. Collected items are NEVER lost.
- Exactly 2 hazards per site (lake, forest, ocean). NO hazards on map/title/datacenter/ending.
- Hazard speeds must stay in 30–55 px/s (player speed is 70).
- All logical drawing is 320×180; do not touch canvas resolution, `main.js`, `index.html`, or `styles.css`.
- Run `npm test` from the repo root after every implementation step; all pre-existing tests must keep passing.

---

### Task 1: AABB collision module

**Files:**
- Create: `src/collision.js`
- Test: `tests/collision.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `rectsOverlap(a, b)` — `a`/`b` are `{x, y, w, h}`; returns boolean; edge-touching rects do NOT overlap. Used by Task 5.

- [ ] **Step 1: Write the failing test**

Create `tests/collision.test.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/zxc/Documents/projects/active/yarra && node --test tests/collision.test.js`
Expected: FAIL — cannot find module `src/collision.js`.

- [ ] **Step 3: Write minimal implementation**

Create `src/collision.js`:

```js
export function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/zxc/Documents/projects/active/yarra && npm test`
Expected: all tests PASS (34 pre-existing + 4 new).

- [ ] **Step 5: Commit**

```bash
git add src/collision.js tests/collision.test.js
git commit -m "feat: add AABB collision module"
```

---

### Task 2: Hazard patrol module

**Files:**
- Create: `src/hazard.js`
- Test: `tests/hazard.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces (used by Tasks 4 and 5):
  - `createHazard({ x1, y1, x2, y2, speed, w, h, kind })` → `{ x, y, w, h, kind, speed, start: {x, y}, end: {x, y}, movingToEnd: true, facingLeft: boolean }` starting at `(x1, y1)`.
  - `updateHazard(hazard, dt)` — moves toward the current target at `speed` px/s; on arrival snaps to target and flips `movingToEnd`; sets `facingLeft = true` when moving left, `false` when moving right, unchanged on pure-vertical motion.

- [ ] **Step 1: Write the failing test**

Create `tests/hazard.test.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/zxc/Documents/projects/active/yarra && node --test tests/hazard.test.js`
Expected: FAIL — cannot find module `src/hazard.js`.

- [ ] **Step 3: Write minimal implementation**

Create `src/hazard.js`:

```js
export function createHazard({ x1, y1, x2, y2, speed, w, h, kind }) {
  return {
    x: x1,
    y: y1,
    w,
    h,
    kind,
    speed,
    start: { x: x1, y: y1 },
    end: { x: x2, y: y2 },
    movingToEnd: true,
    facingLeft: x2 < x1,
  };
}

export function updateHazard(hazard, dt) {
  const target = hazard.movingToEnd ? hazard.end : hazard.start;
  const dx = target.x - hazard.x;
  const dy = target.y - hazard.y;
  if (dx < 0) hazard.facingLeft = true;
  else if (dx > 0) hazard.facingLeft = false;
  const dist = Math.hypot(dx, dy);
  const step = hazard.speed * dt;

  if (dist === 0 || dist <= step) {
    hazard.x = target.x;
    hazard.y = target.y;
    hazard.movingToEnd = !hazard.movingToEnd;
  } else {
    hazard.x += (dx / dist) * step;
    hazard.y += (dy / dist) * step;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/zxc/Documents/projects/active/yarra && npm test`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hazard.js tests/hazard.test.js
git commit -m "feat: add ping-pong patrol hazard module"
```

---

### Task 3: Player hearts and invincibility

**Files:**
- Modify: `src/player.js` (add constants + 4 functions; existing `createPlayer`/`movePlayer` movement logic unchanged except two new fields on the created object)
- Test: `tests/player.test.js` (append new tests; existing 5 tests unchanged)

**Interfaces:**
- Consumes: existing `createPlayer(startX, startY)`.
- Produces (used by Task 5):
  - `MAX_HEARTS = 3`, `INVINCIBLE_SECONDS = 0.8` (exported consts)
  - `createPlayer` now also sets `hearts: 3, invincibleTimer: 0`
  - `damagePlayer(player)` — no-op if `isInvincible(player)`; else `hearts -= 1`, `invincibleTimer = INVINCIBLE_SECONDS`
  - `updateInvincibility(player, dt)` — `invincibleTimer = Math.max(0, invincibleTimer - dt)`
  - `isInvincible(player)` — `invincibleTimer > 0`
  - `resetHearts(player)` — `hearts = MAX_HEARTS`, `invincibleTimer = 0`

- [ ] **Step 1: Write the failing tests**

Append to `tests/player.test.js` (update the import line to the version shown):

```js
import {
  createPlayer, movePlayer,
  MAX_HEARTS, INVINCIBLE_SECONDS,
  damagePlayer, updateInvincibility, isInvincible, resetHearts,
} from '../src/player.js';
```

```js
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/zxc/Documents/projects/active/yarra && node --test tests/player.test.js`
Expected: FAIL — `MAX_HEARTS` (etc.) not exported.

- [ ] **Step 3: Write minimal implementation**

In `src/player.js`, add at the top with the other constants:

```js
export const MAX_HEARTS = 3;
export const INVINCIBLE_SECONDS = 0.8;
```

In `createPlayer`'s returned object, add two fields:

```js
    hearts: MAX_HEARTS,
    invincibleTimer: 0,
```

Append at the end of the file:

```js
export function isInvincible(player) {
  return player.invincibleTimer > 0;
}

export function damagePlayer(player) {
  if (isInvincible(player)) return;
  player.hearts -= 1;
  player.invincibleTimer = INVINCIBLE_SECONDS;
}

export function updateInvincibility(player, dt) {
  player.invincibleTimer = Math.max(0, player.invincibleTimer - dt);
}

export function resetHearts(player) {
  player.hearts = MAX_HEARTS;
  player.invincibleTimer = 0;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/zxc/Documents/projects/active/yarra && npm test`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/player.js tests/player.test.js
git commit -m "feat: add hearts, damage, and invincibility to player"
```

---

### Task 4: Hazard and heart rendering

**Files:**
- Modify: `src/render.js` (append two exported functions; nothing existing changes)

**Interfaces:**
- Consumes: hazard objects from Task 2 (`{x, y, w, h, kind, facingLeft}`).
- Produces (used by Task 5):
  - `drawHazard(ctx, hazard)` — draws a small pixel sprite at `hazard.x/y` per `hazard.kind`; kinds: `'swan'`, `'litter'`, `'fox'`, `'possum'`, `'wave'`, `'gull'`.
  - `drawHearts(ctx, hearts)` — draws 3 heart slots at the top-right (filled up to `hearts`, hollow after).

This module is browser-only (Canvas 2D); there is no unit test — verification is `node --check` plus the headless E2E render smoke in Task 5.

- [ ] **Step 1: Implement**

Append to `src/render.js`:

```js
export function drawHazard(ctx, hazard) {
  const x = Math.round(hazard.x);
  const y = Math.round(hazard.y);
  const flip = hazard.facingLeft;
  // helper: mirror an x-offset within the hazard's width when facing left
  const fx = (ox, w) => (flip ? x + hazard.w - ox - w : x + ox);
  switch (hazard.kind) {
    case 'swan': // territorial black swan — body, S-neck, red bill
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(fx(1, 9), y + 4, 9, 5);
      ctx.fillRect(fx(9, 2), y, 2, 6);
      ctx.fillStyle = '#cc3311';
      ctx.fillRect(fx(11, 2), y, 2, 2);
      ctx.fillStyle = '#e8f0f2'; // wake ripple
      ctx.fillRect(fx(0, 4), y + 9, 4, 1);
      break;
    case 'litter': // drifting tangle of rubbish
      ctx.fillStyle = '#8a8a7a';
      ctx.fillRect(x, y + 2, 14, 5);
      ctx.fillStyle = '#cfd8dc';
      ctx.fillRect(x + 2, y, 4, 3);
      ctx.fillStyle = '#ff5533';
      ctx.fillRect(x + 8, y + 1, 3, 3);
      ctx.fillStyle = '#4a8cb5';
      ctx.fillRect(x + 1, y + 6, 12, 1);
      break;
    case 'fox': // rust body, dark legs, white tail tip
      ctx.fillStyle = '#c8622d';
      ctx.fillRect(fx(2, 11), y + 2, 11, 5);
      ctx.fillRect(fx(12, 4), y, 4, 4); // head + ears
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(fx(0, 3), y + 3, 3, 3); // tail tip
      ctx.fillStyle = '#2b2118';
      ctx.fillRect(fx(3, 2), y + 7, 2, 3);
      ctx.fillRect(fx(10, 2), y + 7, 2, 3);
      break;
    case 'possum': // grey hunched body, curled tail
      ctx.fillStyle = '#6e6a63';
      ctx.fillRect(fx(2, 8), y + 2, 8, 5);
      ctx.fillRect(fx(8, 3), y, 3, 4); // head
      ctx.fillStyle = '#4a463f';
      ctx.fillRect(fx(0, 3), y + 1, 3, 2); // tail curl
      ctx.fillStyle = '#f5b5c5';
      ctx.fillRect(fx(10, 1), y + 1, 1, 1); // nose
      break;
    case 'wave': // foamy wash sweeping the sand
      ctx.fillStyle = '#4a8cb5';
      ctx.fillRect(x, y + 2, 24, 5);
      ctx.fillStyle = '#e8f0f2';
      ctx.fillRect(x + 1, y, 8, 3);
      ctx.fillRect(x + 12, y + 1, 9, 2);
      break;
    case 'gull': // white body, grey wing, yellow beak
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(fx(2, 8), y + 2, 8, 4);
      ctx.fillStyle = '#9aa5ab';
      ctx.fillRect(fx(3, 6), y, 6, 3); // raised wing
      ctx.fillStyle = '#ffe97a';
      ctx.fillRect(fx(10, 2), y + 3, 2, 1);
      break;
    default:
      ctx.fillStyle = '#ff5533';
      ctx.fillRect(x, y, hazard.w, hazard.h);
  }
}

export function drawHearts(ctx, hearts) {
  for (let i = 0; i < 3; i++) {
    const hx = 282 + i * 12;
    const hy = 6;
    const filled = i < hearts;
    ctx.fillStyle = filled ? '#e5484d' : 'rgba(10, 14, 18, 0.55)';
    // 7px-wide pixel heart: two bumps, tapering point
    ctx.fillRect(hx + 1, hy, 2, 2);
    ctx.fillRect(hx + 4, hy, 2, 2);
    ctx.fillRect(hx, hy + 1, 7, 3);
    ctx.fillRect(hx + 1, hy + 4, 5, 1);
    ctx.fillRect(hx + 2, hy + 5, 3, 1);
    ctx.fillRect(hx + 3, hy + 6, 1, 1);
    if (!filled) {
      ctx.strokeStyle = '#e5484d';
      ctx.strokeRect(hx + 0.5, hy + 1.5, 6, 2);
    }
  }
}
```

- [ ] **Step 2: Verify syntax and existing suite**

Run: `cd /Users/zxc/Documents/projects/active/yarra && node --check src/render.js && npm test`
Expected: `node --check` silent success; all tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/render.js
git commit -m "feat: add hazard sprites and heart HUD rendering"
```

---

### Task 5: Wire hazards into site scenes + per-site hazard definitions + E2E

**Files:**
- Modify: `src/scenes/site-common.js`
- Modify: `src/scenes/lake.js`, `src/scenes/forest.js`, `src/scenes/ocean.js` (add a `hazards` array to each config; nothing else changes)
- Modify: `/private/tmp/claude-501/-Users-zxc-Documents-projects-active-pixel-game-sonnet/04a3510e-9e02-4fe0-8211-8637076054e1/scratchpad/yarra-e2e.mjs` (headless regression script — lives OUTSIDE the repo, do not commit it)

**Interfaces:**
- Consumes: `createHazard`/`updateHazard` (Task 2), `rectsOverlap` (Task 1), `damagePlayer`/`updateInvincibility`/`isInvincible`/`resetHearts` (Task 3), `drawHazard`/`drawHearts` (Task 4).
- Produces: `createSiteScene` accepts optional `hazards: [{x1,y1,x2,y2,speed,w,h,kind}, ...]`; scene exposes `scene.hazards` (live hazard instances, recreated on every `enter`).

- [ ] **Step 1: Extend `site-common.js`**

Replace the import block and `createSiteScene` in `src/scenes/site-common.js` with:

```js
import {
  movePlayer, damagePlayer, updateInvincibility, isInvincible, resetHearts,
} from '../player.js';
import { createHazard, updateHazard } from '../hazard.js';
import { rectsOverlap } from '../collision.js';
import { nearestItemInRange, PICKUP_RADIUS } from '../items.js';
import {
  collectItem, isItemCollected, siteProgress, isSiteComplete, SAMPLES_PER_SITE,
} from '../game-state.js';
import { LINES, PICKUP_LINES, createDialogue } from '../dialogue.js';
import { drawPlayer, drawItem, drawExitMarker, drawHud, drawHazard, drawHearts } from '../render.js';

export const SCENE_BOUNDS = { x: 0, y: 0, w: 320, h: 180 };
export const EXIT_POS = { x: 152, y: 162 }; // marker top-left; interact radius from its center
const EXIT_CENTER = { x: EXIT_POS.x + 8, y: EXIT_POS.y + 6 };
const EXIT_RADIUS = 20;
const SPAWN = { x: 152, y: 132 };
const KNOCKOUT_TOAST = 'Too risky — back to the trailhead. Samples are safe.';

export function createSiteScene({
  siteId, label, items, drawBackground, bounds = SCENE_BOUNDS, hazards = [],
}) {
  const scene = {
    id: siteId,
    nearItem: null,
    nearExit: false,
    hazards: [],

    enter(game) {
      game.player.x = SPAWN.x;
      game.player.y = SPAWN.y;
      resetHearts(game.player);
      scene.hazards = hazards.map(createHazard);
      if (!game.visited[siteId]) {
        game.visited[siteId] = true;
        game.dialogue = createDialogue(LINES[siteId + 'Enter']);
      }
    },

    update(dt, game) {
      const { dx, dy } = game.input.getVector();
      movePlayer(game.player, dx, dy, dt, bounds);

      scene.nearItem = nearestItemInRange(
        game.player, items,
        (id) => isItemCollected(game.state, siteId, id),
        PICKUP_RADIUS
      );
      const px = game.player.x + game.player.w / 2;
      const py = game.player.y + game.player.h / 2;
      scene.nearExit = Math.hypot(EXIT_CENTER.x - px, EXIT_CENTER.y - py) <= EXIT_RADIUS;

      if (game.input.consumeInteract()) {
        if (scene.nearItem) {
          const item = scene.nearItem;
          const wasComplete = isSiteComplete(game.state, siteId);
          collectItem(game.state, siteId, item.id);
          const nowComplete = isSiteComplete(game.state, siteId);
          if (!wasComplete && nowComplete) {
            game.dialogue = createDialogue(LINES[siteId + 'Done']);
          } else {
            game.toast = {
              text: `${PICKUP_LINES[item.kind]} (${siteProgress(game.state, siteId)}/${SAMPLES_PER_SITE})`,
              timer: 2.2,
            };
          }
        } else if (scene.nearExit) {
          game.switchScene('map');
          return;
        }
      }

      // hazards move and hurt AFTER pickup handling, so a same-frame pickup counts
      for (const hz of scene.hazards) updateHazard(hz, dt);
      updateInvincibility(game.player, dt);
      if (!isInvincible(game.player)) {
        for (const hz of scene.hazards) {
          if (rectsOverlap(game.player, hz)) {
            damagePlayer(game.player);
            if (game.player.hearts <= 0) {
              game.player.x = SPAWN.x;
              game.player.y = SPAWN.y;
              resetHearts(game.player);
              game.toast = { text: KNOCKOUT_TOAST, timer: 2.2 };
            }
            break;
          }
        }
      }
    },

    render(ctx, game) {
      drawBackground(ctx);
      for (const item of items) {
        if (!isItemCollected(game.state, siteId, item.id)) {
          drawItem(ctx, item, item === scene.nearItem);
        }
      }
      drawExitMarker(ctx, EXIT_POS.x, EXIT_POS.y);
      for (const hz of scene.hazards) drawHazard(ctx, hz);
      // blink while invincible: skip the draw on alternating 0.1s slices
      if (!isInvincible(game.player) || Math.floor(game.player.invincibleTimer * 10) % 2 === 0) {
        drawPlayer(ctx, game.player);
      }
      drawHud(ctx, label, `${siteProgress(game.state, siteId)}/${SAMPLES_PER_SITE}`);
      if (scene.hazards.length > 0) drawHearts(ctx, game.player.hearts);
    },
  };
  return scene;
}
```

Notes for the implementer:
- The `return` after `game.switchScene('map')` is REQUIRED: without it, hazards from the site the player just left could damage them on the exit frame.
- `resetHearts` in `enter` implements the "hearts refill on every site entry" rule; the datacenter scene does not use `createSiteScene`, so nothing changes there.

- [ ] **Step 2: Add hazard definitions to the three site configs**

In `src/scenes/lake.js`, add to the `createSiteScene({...})` config object (after `bounds`):

```js
  hazards: [
    // territorial black swan patrolling the waterline past the jetty
    { x1: 60, y1: 116, x2: 250, y2: 116, speed: 48, w: 13, h: 10, kind: 'swan' },
    // tangle of litter drifting along the shore path
    { x1: 290, y1: 146, x2: 20, y2: 146, speed: 34, w: 14, h: 8, kind: 'litter' },
  ],
```

In `src/scenes/forest.js`:

```js
  hazards: [
    // fox loping the length of the trail
    { x1: 10, y1: 118, x2: 296, y2: 118, speed: 55, w: 16, h: 10, kind: 'fox' },
    // possum shuffling a short diagonal by the creek
    { x1: 24, y1: 158, x2: 96, y2: 168, speed: 30, w: 12, h: 8, kind: 'possum' },
  ],
```

In `src/scenes/ocean.js`:

```js
  hazards: [
    // wave-wash sweeping up and down the beach
    { x1: 118, y1: 106, x2: 118, y2: 168, speed: 40, w: 24, h: 8, kind: 'wave' },
    // gull tracking the tideline
    { x1: 296, y1: 110, x2: 16, y2: 110, speed: 52, w: 12, h: 8, kind: 'gull' },
  ],
```

Placement rationale (do not change endpoints without checking): all paths sit inside each site's `bounds`; none of the patrol lines passes within 6px of the exit marker center (160, 168) except transiently; all hazards keep moving, so no item is ever permanently blocked; speeds ≤ 55 < player 70.

- [ ] **Step 3: Syntax-check and run the unit suite**

Run: `cd /Users/zxc/Documents/projects/active/yarra && node --check src/scenes/site-common.js && node --check src/scenes/lake.js && node --check src/scenes/forest.js && node --check src/scenes/ocean.js && npm test`
Expected: silent checks; all tests PASS.

- [ ] **Step 4: Update the headless E2E script**

The script at `/private/tmp/claude-501/-Users-zxc-Documents-projects-active-pixel-game-sonnet/04a3510e-9e02-4fe0-8211-8637076054e1/scratchpad/yarra-e2e.mjs` drives the real scene modules. Two changes:

**(a) Make the happy path robust to hazards.** The current pattern is `walkTo(x, y)` (teleport + 1 frame) followed by `pressInteract()` (1 frame). A hazard hit in the first frame could, at 0 hearts, teleport the player to spawn before the interact frame. Replace every `walkTo(...)` + `pressInteract()` item/node/exit pair with a single-frame helper — add:

```js
function interactAt(x, y) {
  // set position and press interact in the SAME frame: pickup handling runs
  // before hazard collision in site-common.update, so the pickup always lands.
  game.player.x = x;
  game.player.y = y;
  interactQueued = true;
  frame();
}
```

and change the site-visit loop bodies from `walkTo(a, b); pressInteract();` to `interactAt(a, b);` (item pickups, exit-marker exits, and map-node entries alike; map has no hazards but the same helper works there).

**(b) Add a hazard/hearts section** after the existing section 3 (all sites complete) and before section 4, using the lake:

```js
// ---- 3b. Hazards: damage, invincibility, knockout reset ----
{
  // re-enter lake (site complete, but hazards still patrol)
  interactAt(55 - 8, 105 - 8); // lake node on map
  assert.equal(game.currentScene.id, 'lake', 'back in lake for hazard checks');
  assert.equal(game.player.hearts, 3, 'hearts refilled on site entry');
  const scene = game.currentScene;
  assert.equal(scene.hazards.length, 2, 'lake has two hazards');

  // stand on the first hazard for one frame → exactly one heart lost
  const hz = scene.hazards[0];
  game.player.x = hz.x; game.player.y = hz.y;
  frame();
  assert.equal(game.player.hearts, 2, 'contact costs one heart');

  // stay on it: invincibility must block further damage until it expires
  game.player.x = hz.x; game.player.y = hz.y;
  frame();
  assert.equal(game.player.hearts, 2, 'invincibility blocks the next frame');

  // ride the hazard until knocked out (keep snapping onto it each frame);
  // break ONLY on the exact spawn position — checking x alone would false-exit
  // when the patrol path happens to cross x=152.
  let guard = 0;
  while (guard++ < 600) {
    game.player.x = scene.hazards[0].x;
    game.player.y = scene.hazards[0].y;
    frame();
    if (game.player.x === 152 && game.player.y === 132) break; // knocked back to spawn
  }
  assert.equal(game.player.x, 152, 'knockout returns player to spawn x');
  assert.equal(game.player.y, 132, 'knockout returns player to spawn y');
  assert.equal(game.player.hearts, 3, 'hearts refill after knockout');
  assert.equal(totalProgress(game.state), TOTAL_SAMPLES, 'collected samples survive knockout');

  // leave via exit
  interactAt(152, 156);
  assert.equal(game.currentScene.id, 'map', 'exited lake after hazard checks');
  console.log('3b. Hazard damage / invincibility / knockout reset: OK');
}
```

Note: the E2E `game` object needs no new fields — hearts live on the player, hazards on the scene. The e2e `frame()` does not tick toasts; that is fine (toasts are render-only).

- [ ] **Step 5: Run the E2E**

Run: `node /private/tmp/claude-501/-Users-zxc-Documents-projects-active-pixel-game-sonnet/04a3510e-9e02-4fe0-8211-8637076054e1/scratchpad/yarra-e2e.mjs`
Expected: all sections print OK, including the new `3b`, ending with "All E2E flow checks passed against the real scene modules."

If a happy-path pickup fails because a hazard knocked the player out mid-flow: that means `interactAt` was not applied somewhere — fix the script, not the game.

- [ ] **Step 6: Full unit suite once more, then commit**

Run: `cd /Users/zxc/Documents/projects/active/yarra && npm test`
Expected: all PASS.

```bash
git add src/scenes/site-common.js src/scenes/lake.js src/scenes/forest.js src/scenes/ocean.js
git commit -m "feat: add patrol hazards and heart system to collection sites"
```

(The E2E script is scratchpad-only — do not add it to the repo.)

---

### Task 6: Visual verification and push

**Files:**
- None modified (verification only; fix-forward commits allowed if a visual defect is found).

**Interfaces:** none.

- [ ] **Step 1: Serve and screenshot each site**

```bash
cd /Users/zxc/Documents/projects/active/yarra && python3 -m http.server 8080 &
```

Load `http://localhost:8080/index.html?v=<timestamp>` in the automation browser. Because live gameplay is rAF-throttled in automation tabs, use the established debug-overlay technique instead of playing: via browser JS, import a site scene module with a cache-busting query, build a fake `game` object (`{state: createGameState(), player: createPlayer(152,132), ...}`), call `scene.enter(fake)` then `scene.render(octx, fake)` on an overlay canvas scaled 4×, and screenshot. Verify for each of lake/forest/ocean:
- both hazard sprites visible and readable at 4× (swan/litter, fox/possum, wave/gull)
- 3 filled hearts visible top-right
- with `fake.player.hearts = 1` re-rendered: 1 filled + 2 hollow hearts

- [ ] **Step 2: Kill the server, push**

```bash
kill %1
cd /Users/zxc/Documents/projects/active/yarra && git push origin master
```

Expected: push succeeds; GitHub Actions Pages deploy runs automatically. Confirm with `curl -sI https://mirukuz.github.io/yarra/ | head -3` returning HTTP 200 (deploy takes ~1 min).
