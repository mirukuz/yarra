import { movePlayer } from '../player.js';
import { nearestItemInRange, PICKUP_RADIUS } from '../items.js';
import {
  collectItem, isItemCollected, siteProgress, isSiteComplete, SAMPLES_PER_SITE,
} from '../game-state.js';
import { LINES, createDialogue } from '../dialogue.js';
import { drawPlayer, drawItem, drawExitMarker, drawHud } from '../render.js';

export const SCENE_BOUNDS = { x: 0, y: 0, w: 320, h: 180 };
export const EXIT_POS = { x: 152, y: 162 }; // marker top-left; interact radius from its center
const EXIT_CENTER = { x: EXIT_POS.x + 8, y: EXIT_POS.y + 6 };
const EXIT_RADIUS = 20;
const SPAWN = { x: 152, y: 132 };

export function createSiteScene({ siteId, label, items, drawBackground }) {
  const scene = {
    id: siteId,
    nearItem: null,
    nearExit: false,

    enter(game) {
      game.player.x = SPAWN.x;
      game.player.y = SPAWN.y;
      if (!game.visited[siteId]) {
        game.visited[siteId] = true;
        game.dialogue = createDialogue(LINES[siteId + 'Enter']);
      }
    },

    update(dt, game) {
      const { dx, dy } = game.input.getVector();
      movePlayer(game.player, dx, dy, dt, SCENE_BOUNDS);

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
          const wasComplete = isSiteComplete(game.state, siteId);
          collectItem(game.state, siteId, scene.nearItem.id);
          if (!wasComplete && isSiteComplete(game.state, siteId)) {
            game.dialogue = createDialogue(LINES[siteId + 'Done']);
          }
        } else if (scene.nearExit) {
          game.switchScene('map');
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
      drawPlayer(ctx, game.player);
      drawHud(ctx, label, `${siteProgress(game.state, siteId)}/${SAMPLES_PER_SITE}`);
    },
  };
  return scene;
}
