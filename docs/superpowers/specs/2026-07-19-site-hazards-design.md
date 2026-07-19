# Site Hazards — Design

**Date:** 2026-07-19
**Status:** Approved by user (challenge type, penalty model, hazard count, hearts scope all confirmed via Q&A)

## Problem

Collecting samples in the three sites (lake / forest / ocean) has no challenge: the player
walks to each item and presses interact with zero risk. The user wants item collection to
be harder via **moving patrol hazards** the player must dodge.

## Decisions (user-confirmed)

- **Challenge type:** moving patrol hazards (pigeon-patrol pattern from the sibling
  Pigeon Garden project), not timers, puzzles, or precision changes.
- **Hit penalty:** lose 1 heart + ~0.8s invincibility flash. At 0 hearts the player is
  sent back to the site's entrance spawn with hearts refilled; **collected items are
  kept** — the penalty is position/time only, never progress.
- **Hazard count:** 2 per site (lake, forest, ocean). Datacenter corridor stays
  hazard-free — it is the finale and its tension comes from the gate sequence.
- **Hearts scope:** reset to full 3 on every site entry; hearts are per-visit, not
  global. Hearts do not apply on the map/title/datacenter/ending scenes.

## Architecture

### New pure-logic modules (unit-testable under Node --test)

**`src/hazard.js`**
- `createHazard({x1, y1, x2, y2, speed, w, h, kind})` → hazard object at `(x1, y1)`
  moving toward `(x2, y2)`.
- `updateHazard(hazard, dt)` — linear ping-pong between the two endpoints (same math
  as Pigeon Garden's `updatePigeon`): move toward current target at `speed` px/s,
  flip target on arrival. Sets `facingLeft` for rendering.
- `kind` is a render hint (`'litter'`, `'swan'`, `'fox'`, `'possum'`, `'wave'`,
  `'gull'` — final set chosen at implementation, one distinct pair per site).

**`src/collision.js`**
- `rectsOverlap(a, b)` — AABB overlap on `{x, y, w, h}` (ported from Pigeon Garden).

### Extended module: `src/player.js`

Add (mirroring Pigeon Garden's player):
- `MAX_HEARTS = 3`, `INVINCIBLE_SECONDS = 0.8`
- `player.hearts` (init 3) and `player.invincibleTimer` (init 0) on `createPlayer`
- `damagePlayer(player)` — no-op while invincible; else decrement hearts, start timer
- `updateInvincibility(player, dt)`, `isInvincible(player)`
- `resetHearts(player)` — hearts back to `MAX_HEARTS`, timer cleared

Existing movement functions are untouched.

### Extended module: `src/scenes/site-common.js`

`createSiteScene(config)` gains an optional `hazards` array of hazard defs. Scene
behavior:
- `enter(game)`: (re)create hazard instances from defs; `resetHearts(game.player)`.
- `update(dt, game)`: after movement/pickup logic — update each hazard, tick
  invincibility, then if any hazard overlaps the player rect and the player is not
  invincible: `damagePlayer`. If hearts hit 0: teleport player to the site's entrance
  spawn, `resetHearts`, show a short toast (reuse the existing `game.toast`
  mechanism, e.g. "Too risky — back to the trailhead. Samples are safe.").
  Collected state is untouched.
- `render(ctx, game)`: draw hazards between background and player; draw the player
  blinking while invincible (skip draw on alternating ~0.1s intervals, same as
  Pigeon Garden); draw a 3-heart row via the extended HUD.

Sites without a `hazards` config (none after this change, but structurally) behave
exactly as today — the feature is opt-in per scene, so map/title/datacenter/ending
are untouched.

### Per-site hazard placement (2 each, inside each site's walkable band)

- **lake** (bounds y 114–180): two drifting hazards along the shoreline — e.g. a
  territorial black swan patrolling the jetty area and a drifting tangle of litter
  swept along the water's edge. Paths must not park on top of any item or the exit
  marker (items remain reachable through timing, never blocked permanently —
  guaranteed because hazards keep moving).
- **forest** (bounds y 88–180): two animals on the ground plane — e.g. a fox loping
  a long horizontal track and a possum on a shorter diagonal near the creek.
- **ocean** (bounds y 104–180): a wave-wash patch sweeping vertically up the beach
  and a swooping gull tracking horizontally near the tideline.

Exact endpoints/speeds are tuned at implementation so that each item is collectible
with reasonable timing (verified by the headless E2E and by manual play): speeds in
the 30–55 px/s range, slower than the player's 70 px/s so dodging is always possible.

### Rendering: `src/render.js`

- `drawHazard(ctx, hazard)` — small pixel sprites per `kind` (same code-drawn style
  as existing sprites, ≤16px, distinct silhouette + warning-ish accent color).
- `drawHearts(ctx, hearts)` — three 7px hearts top-right under the existing HUD line
  (filled `#e5484d`, empty outline). Called only from site scenes.
- `drawPlayer` untouched; blinking is handled by the caller skipping the draw.

### `src/main.js`

No changes required: hazard update/render live inside the site scenes, and the toast
plumbing already exists. (Verify during implementation; if invincibility ticking fits
more naturally in `main.js`'s update, keep it in site-common anyway for locality.)

## Error handling / edge cases

- Damage while a dialogue is open: impossible — `main.js` skips `scene.update` while
  a dialogue is open, so hazards freeze during dialogue. Acceptable and simplest.
- Double-hit same frame from both hazards: first hit starts invincibility; second is
  ignored by the `isInvincible` guard.
- Knock to 0 hearts while standing near an item: player teleports to entrance before
  any pickup this frame — pickup handling runs before hazard collision in `update`,
  so a same-frame pickup still counts; order is pickup → hazards.
- Re-entering a site always refills hearts (per the hearts-scope decision), including
  after a 0-heart reset (which also refills immediately).
- Touch devices: no new inputs needed; dodging uses the existing d-pad.

## Testing

- **Unit (Node --test):** `tests/hazard.test.js` (ping-pong reaches far endpoint,
  reverses, `facingLeft` flips, speed respected), `tests/collision.test.js`
  (overlap/no-overlap/edge-touch), extended `tests/player.test.js` (damage decrements,
  invincibility blocks damage, timer expiry re-enables damage, `resetHearts`).
- **Headless E2E (`yarra-e2e.mjs`):** extend to (1) place the player on a hazard and
  step frames → hearts drop exactly 1 during the invincibility window; (2) drain to 0
  → player back at entrance spawn, hearts 3, collected items intact; (3) full
  original happy-path still passes (teleport-style item collection must still work —
  if a hazard happens to sit on an item coordinate at that frame, the script routes
  around by stepping time first).
- **Browser check:** `node --check` on all touched files; visual screenshot pass on
  each site to confirm sprites read clearly at 4x scale.

## Out of scope

- Hazards on the map or in the datacenter.
- Global/persistent health, game-over screens, sound.
- Any change to sample counts, dialogue flow, or map layout.
