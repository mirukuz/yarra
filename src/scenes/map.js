import { movePlayer } from '../player.js';
import {
  isSiteComplete, isDatacenterUnlocked, totalProgress, TOTAL_SAMPLES,
} from '../game-state.js';
import { LINES, createDialogue } from '../dialogue.js';
import { drawPlayer, drawHud } from '../render.js';

const BOUNDS = { x: 0, y: 0, w: 320, h: 180 };
const NODE_RADIUS = 18;

const NODES = [
  { id: 'lake', label: 'LAKE', x: 55, y: 105, color: '#3a7ca5' },
  { id: 'forest', label: 'FOREST', x: 250, y: 40, color: '#2e5231' },
  { id: 'ocean', label: 'BEACH', x: 75, y: 155, color: '#2f6f95' },
  { id: 'datacenter', label: 'DATA CENTRE', x: 255, y: 110, color: '#5a5a66' },
];

function drawBackground(ctx) {
  // land
  ctx.fillStyle = '#4a7a47';
  ctx.fillRect(0, 0, 320, 180);
  ctx.fillStyle = '#548a51';
  ctx.fillRect(0, 0, 320, 40);
  ctx.fillRect(180, 120, 140, 60);
  // Yarra river — winds from top-right to bottom-left
  ctx.fillStyle = '#3a7ca5';
  ctx.fillRect(200, 0, 16, 50);
  ctx.fillRect(160, 44, 56, 14);
  ctx.fillRect(120, 52, 48, 14);
  ctx.fillRect(60, 60, 68, 14);
  ctx.fillRect(20, 68, 48, 60);
  ctx.fillRect(0, 120, 40, 14);
  // city block cluster near the river mouth
  ctx.fillStyle = '#7a95a8';
  for (const [bx, by, bw, bh] of [[140, 70, 8, 14], [152, 66, 8, 18], [164, 72, 8, 12]]) {
    ctx.fillRect(bx, by, bw, bh);
  }
}

function drawNode(ctx, node, game) {
  ctx.fillStyle = node.color;
  ctx.fillRect(node.x - 8, node.y - 8, 16, 16);
  ctx.strokeStyle = '#e8f0f2';
  ctx.strokeRect(node.x - 8.5, node.y - 8.5, 17, 17);
  ctx.fillStyle = '#e8f0f2';
  ctx.font = '6px monospace';
  ctx.textBaseline = 'top';
  ctx.fillText(node.label, node.x - node.label.length * 1.8, node.y + 12);

  if (node.id === 'datacenter') {
    if (!isDatacenterUnlocked(game.state)) {
      // lock icon
      ctx.fillStyle = '#ffe97a';
      ctx.fillRect(node.x - 3, node.y - 2, 6, 5);
      ctx.strokeStyle = '#ffe97a';
      ctx.strokeRect(node.x - 2.5, node.y - 5.5, 5, 4);
    }
  } else if (isSiteComplete(game.state, node.id)) {
    // check mark
    ctx.fillStyle = '#7adfc8';
    ctx.fillRect(node.x - 3, node.y, 2, 3);
    ctx.fillRect(node.x - 1, node.y + 2, 2, 2);
    ctx.fillRect(node.x + 1, node.y - 2, 2, 4);
  }
}

const scene = {
  id: 'map',
  nearNode: null,

  enter(game) {
    game.player.x = 152;
    game.player.y = 84;
  },

  update(dt, game) {
    const { dx, dy } = game.input.getVector();
    movePlayer(game.player, dx, dy, dt, BOUNDS);

    const px = game.player.x + game.player.w / 2;
    const py = game.player.y + game.player.h / 2;
    scene.nearNode = null;
    for (const node of NODES) {
      if (Math.hypot(node.x - px, node.y - py) <= NODE_RADIUS) {
        scene.nearNode = node;
        break;
      }
    }

    if (game.input.consumeInteract() && scene.nearNode) {
      if (scene.nearNode.id === 'datacenter' && !isDatacenterUnlocked(game.state)) {
        game.dialogue = createDialogue(LINES.locked);
      } else {
        game.switchScene(scene.nearNode.id);
      }
    }
  },

  render(ctx, game) {
    drawBackground(ctx);
    for (const node of NODES) drawNode(ctx, node, game);
    if (scene.nearNode) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '6px monospace';
      ctx.fillText('[E]', scene.nearNode.x - 5, scene.nearNode.y - 20);
    }
    drawPlayer(ctx, game.player);
    drawHud(ctx, 'Melbourne', `${totalProgress(game.state)}/${TOTAL_SAMPLES}`);
  },
};

export default scene;
