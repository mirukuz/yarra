import { movePlayer } from '../player.js';
import { rectsOverlap } from '../collision.js';
import {
  isSiteComplete, isDatacenterUnlocked, totalProgress, TOTAL_SAMPLES,
} from '../game-state.js';
import { LINES, createDialogue } from '../dialogue.js';
import { drawPlayer, drawHud } from '../render.js';

const BOUNDS = { x: 0, y: 0, w: 320, h: 180 };
const NODE_RADIUS = 18;
const SPAWN = { x: 156, y: 88 };

const NODES = [
  { id: 'lake', label: 'ALBERT PARK', x: 90, y: 95, color: '#3a7ca5' },
  { id: 'forest', label: 'DANDENONG', x: 250, y: 40, color: '#2e5231' },
  { id: 'ocean', label: 'ST KILDA', x: 122, y: 128, color: '#2f6f95' },
  { id: 'datacenter', label: 'DATA CENTRE', x: 255, y: 110, color: '#5a5a66' },
];

// Single source of truth for every water tile on the map — used both to draw
// the river/bay/pond and to block player movement, so visuals and collision
// can never diverge.
const WATER = [
  // Yarra river — winds from top-right to bottom-left
  { x: 200, y: 0, w: 16, h: 50 },
  { x: 160, y: 44, w: 56, h: 14 },
  { x: 120, y: 52, w: 48, h: 14 },
  { x: 60, y: 60, w: 68, h: 14 },
  { x: 20, y: 68, w: 48, h: 60 },
  { x: 0, y: 120, w: 40, h: 14 },
  // Port Phillip Bay — fills the bottom-left corner, fed by the river mouth
  { x: 0, y: 128, w: 100, h: 52 },
  { x: 0, y: 112, w: 46, h: 20 },
  { x: 100, y: 150, w: 30, h: 30 },
  // small pond by Albert Park
  { x: 38, y: 118, w: 14, h: 9 },
];

function isInWater(rect) {
  return WATER.some((w) => rectsOverlap(rect, w));
}

// deterministic pseudo-scatter (no per-frame randomness, so nothing flickers)
function scatterDots(ctx, x0, y0, x1, y1, step, mod, threshold, size) {
  for (let gx = x0; gx < x1; gx += step) {
    for (let gy = y0; gy < y1; gy += step + 3) {
      if ((gx * 7 + gy * 13) % mod < threshold) {
        ctx.fillRect(gx, gy, size, size);
      }
    }
  }
}

function drawDashedPath(ctx, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.floor(dist / 7));
  ctx.fillStyle = '#8a6a43';
  for (let i = 0; i <= steps; i += 2) {
    const t = i / steps;
    ctx.fillRect(Math.round(x0 + dx * t), Math.round(y0 + dy * t), 2, 2);
  }
}

function drawTree(ctx, x, y, scale = 1) {
  const s = scale;
  ctx.fillStyle = '#5a3d23';
  ctx.fillRect(x - 1, y + 2 * s, 2, 3 * s);
  ctx.fillStyle = '#3d7a3a';
  ctx.fillRect(x - 4 * s, y, 8 * s, 3 * s);
  ctx.fillStyle = '#4a8a47';
  ctx.fillRect(x - 3 * s, y - 3 * s, 6 * s, 3 * s);
  ctx.fillStyle = '#5a9a57';
  ctx.fillRect(x - 2 * s, y - 5 * s, 4 * s, 3 * s);
}

function drawBackground(ctx) {
  // land base
  ctx.fillStyle = '#4a7a47';
  ctx.fillRect(0, 0, 320, 180);
  ctx.fillStyle = '#548a51';
  ctx.fillRect(0, 0, 320, 40);
  ctx.fillRect(180, 120, 140, 60);
  // range/forest backdrop tint around the Dandenong ranges
  ctx.fillStyle = '#3d6b3a';
  ctx.fillRect(205, 6, 100, 62);

  // sparse grass tufts across the open land
  ctx.fillStyle = '#3f6b3d';
  scatterDots(ctx, 4, 4, 316, 176, 11, 29, 6, 1);

  // dashed dirt paths from the spawn area to each node (drawn under water/city
  // so they read as leading up to the shoreline / disappearing into town)
  for (const node of NODES) drawDashedPath(ctx, SPAWN.x, SPAWN.y, node.x, node.y);

  // all water — river, bay and pond — drawn from the single WATER source of
  // truth so the art can never drift out of sync with movement blocking
  ctx.fillStyle = '#3a7ca5';
  for (const w of WATER) ctx.fillRect(w.x, w.y, w.w, w.h);

  // sandy shoreline — each strip hugs an actual land/water edge from WATER
  ctx.fillStyle = '#d8c48a';
  ctx.fillRect(0, 110, 46, 2);    // land side of the upper bay arm's top edge (0,112,46,20)
  ctx.fillRect(100, 128, 2, 22);  // land side of the bay's right edge (0,128,100,52), y 128-150
  ctx.fillRect(102, 146, 28, 4);  // beach patch on land side of the water pocket's top edge (100,150,30,30)
  ctx.fillRect(130, 150, 2, 30);  // land side of the water pocket's right edge, y 150-180
  // wave highlights
  ctx.fillStyle = '#4a8cb5';
  for (const [wx, wy] of [[14, 140], [40, 152], [66, 146], [20, 165], [60, 168], [82, 158]]) {
    ctx.fillRect(wx, wy, 4, 1);
  }

  // pond ripple highlight
  ctx.fillStyle = '#4a8cb5';
  ctx.fillRect(40, 121, 4, 1);

  // Dandenong forest cluster
  for (const [tx, ty, ts] of [
    [232, 24, 1], [244, 16, 1.2], [258, 26, 1], [268, 14, 1],
    [238, 40, 1], [262, 42, 1.1], [278, 30, 1],
  ]) drawTree(ctx, tx, ty, ts);
  // a few lone trees scattered on the open grass
  for (const [tx, ty] of [[24, 24], [110, 150], [190, 34], [130, 100]]) drawTree(ctx, tx, ty, 0.8);

  // CBD tower cluster near the river bend
  const towers = [
    [138, 62, 8, 20], [150, 56, 8, 26], [162, 64, 8, 18], [172, 58, 7, 24],
  ];
  ctx.fillStyle = '#7a95a8';
  for (const [bx, by, bw, bh] of towers) ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = '#5f7a8c';
  for (const [bx, by, bw] of towers) ctx.fillRect(bx, by, bw, 2);
  // lit windows
  ctx.fillStyle = '#ffe97a';
  for (const [bx, by, bw, bh] of towers) {
    for (let wy = by + 4; wy < by + bh - 2; wy += 5) {
      for (let wx = bx + 1; wx < bx + bw - 1; wx += 3) {
        if ((wx + wy) % 5 < 3) ctx.fillRect(wx, wy, 1, 1);
      }
    }
  }
}

function drawNodeTile(ctx, node, game) {
  const { x: cx, y: cy } = node;
  switch (node.id) {
    case 'lake': {
      ctx.fillStyle = '#3a7ca5';
      ctx.fillRect(cx - 8, cy - 8, 16, 16);
      ctx.fillStyle = '#4a8cb5';
      ctx.fillRect(cx - 6, cy - 3, 4, 1);
      ctx.fillRect(cx + 2, cy + 3, 4, 1);
      // tiny black swan
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(cx - 3, cy + 1, 5, 3);
      ctx.fillRect(cx + 1, cy - 3, 1, 4);
      ctx.fillRect(cx + 1, cy - 4, 2, 1);
      ctx.fillStyle = '#cc3311';
      ctx.fillRect(cx + 3, cy - 4, 1, 1);
      break;
    }
    case 'forest': {
      ctx.fillStyle = '#2e5231';
      ctx.fillRect(cx - 8, cy - 8, 16, 16);
      ctx.fillStyle = '#5a3d23';
      ctx.fillRect(cx - 1, cy + 3, 2, 4);
      ctx.fillStyle = '#3d7a3a';
      ctx.fillRect(cx - 4, cy + 1, 8, 3);
      ctx.fillStyle = '#4a8a47';
      ctx.fillRect(cx - 3, cy - 2, 6, 3);
      ctx.fillStyle = '#5a9a57';
      ctx.fillRect(cx - 2, cy - 5, 4, 3);
      break;
    }
    case 'ocean': {
      ctx.fillStyle = '#2f6f95';
      ctx.fillRect(cx - 8, cy - 8, 16, 10);
      ctx.fillStyle = '#d8c48a';
      ctx.fillRect(cx - 8, cy + 2, 16, 6);
      ctx.fillStyle = '#e8f0f2';
      ctx.fillRect(cx - 6, cy - 2, 3, 1);
      ctx.fillRect(cx - 2, cy - 4, 3, 1);
      ctx.fillRect(cx + 2, cy - 1, 3, 1);
      break;
    }
    case 'datacenter': {
      const unlocked = isDatacenterUnlocked(game.state);
      ctx.fillStyle = '#2a2a33';
      ctx.fillRect(cx - 8, cy - 8, 16, 16);
      ctx.fillStyle = '#5a5a66';
      ctx.fillRect(cx - 5, cy - 5, 10, 10);
      ctx.fillStyle = '#3a3a45';
      ctx.fillRect(cx - 5, cy - 2, 10, 1);
      ctx.fillRect(cx - 5, cy + 1, 10, 1);
      ctx.fillStyle = unlocked ? '#7adfc8' : '#ff5533';
      ctx.fillRect(cx - 3, cy - 4, 1, 1);
      ctx.fillRect(cx - 3, cy - 1, 1, 1);
      break;
    }
    default: {
      ctx.fillStyle = node.color;
      ctx.fillRect(cx - 8, cy - 8, 16, 16);
    }
  }
}

function drawNode(ctx, node, game) {
  drawNodeTile(ctx, node, game);
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

    // Resolve movement per axis so the player can slide along shorelines
    // instead of sticking when moving diagonally into water.
    const beforeX = game.player.x;
    movePlayer(game.player, dx, 0, dt, BOUNDS);
    if (isInWater(game.player)) game.player.x = beforeX;

    const beforeY = game.player.y;
    movePlayer(game.player, 0, dy, dt, BOUNDS);
    if (isInWater(game.player)) game.player.y = beforeY;

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
