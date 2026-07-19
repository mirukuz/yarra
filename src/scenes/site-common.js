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
