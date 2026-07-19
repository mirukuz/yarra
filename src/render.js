const PIXEL = 2;

const PLAYER_SPRITE = [
  [null, '#1a1a1a', '#1a1a1a', '#1a1a1a', '#1a1a1a', '#2ee6c8', '#2ee6c8', null],
  ['#1a1a1a', '#1a1a1a', '#f0c8a0', '#f0c8a0', '#f0c8a0', '#f0c8a0', '#2ee6c8', null],
  ['#1a1a1a', '#f0c8a0', '#2b2b2b', '#f0c8a0', '#2b2b2b', '#f0c8a0', '#1a1a1a', null],
  [null, '#f0c8a0', '#f0c8a0', '#f0c8a0', '#f0c8a0', '#f0c8a0', null, null],
  [null, '#c8622d', '#3b5f8a', '#3b5f8a', '#3b5f8a', '#c8622d', null, null],
  ['#8a5a33', '#3b5f8a', '#5a7fae', '#5a7fae', '#5a7fae', '#3b5f8a', '#8a5a33', null],
  [null, '#3b5f8a', '#3b5f8a', '#3b5f8a', '#3b5f8a', '#3b5f8a', null, null],
  [null, null, '#333333', '#333333', null, '#333333', '#333333', null],
];

export const ITEM_SPRITES = {
  line: [
    [null, '#e0e0e0', '#e0e0e0', null],
    ['#e0e0e0', null, null, '#e0e0e0'],
    ['#e0e0e0', null, null, '#e0e0e0'],
    [null, '#e0e0e0', '#e0e0e0', null],
  ],
  bottle: [
    [null, '#9adfff', null],
    ['#9adfff', '#d2f2ff', '#9adfff'],
    ['#9adfff', '#d2f2ff', '#9adfff'],
    ['#9adfff', '#9adfff', '#9adfff'],
  ],
  cap: [
    ['#ff5533', '#ff5533'],
    ['#cc3311', '#cc3311'],
  ],
  bag: [
    ['#f0f0f0', null, '#f0f0f0'],
    ['#f0f0f0', '#f0f0f0', '#f0f0f0'],
    [null, '#d8d8d8', '#d8d8d8'],
  ],
};

export function drawSprite(ctx, sprite, x, y, pixelSize, flipX = false) {
  const cols = sprite[0].length;
  sprite.forEach((row, rowIndex) => {
    row.forEach((color, colIndex) => {
      if (color === null) return;
      const drawCol = flipX ? cols - 1 - colIndex : colIndex;
      ctx.fillStyle = color;
      ctx.fillRect(x + drawCol * pixelSize, y + rowIndex * pixelSize, pixelSize, pixelSize);
    });
  });
}

export function drawPlayer(ctx, player) {
  drawSprite(ctx, PLAYER_SPRITE, Math.round(player.x), Math.round(player.y), PIXEL, player.facingLeft);
}

export function drawItem(ctx, item, highlighted) {
  const sprite = ITEM_SPRITES[item.kind];
  const w = sprite[0].length * PIXEL;
  const h = sprite.length * PIXEL;
  const x = Math.round(item.x - w / 2);
  const y = Math.round(item.y - h / 2);
  if (highlighted) {
    const pulse = Math.floor(Date.now() / 250) % 2 === 0;
    ctx.strokeStyle = pulse ? '#ffffff' : '#ffe97a';
    ctx.strokeRect(x - 3, y - 3, w + 6, h + 6);
  }
  drawSprite(ctx, sprite, x, y, PIXEL);
}

export function drawExitMarker(ctx, x, y) {
  ctx.fillStyle = '#8a5a33';
  ctx.fillRect(x + 6, y + 4, 3, 8);
  ctx.fillStyle = '#ffe97a';
  ctx.fillRect(x, y, 15, 6);
  ctx.fillStyle = '#333333';
  ctx.fillRect(x + 2, y + 2, 2, 2);
  ctx.fillRect(x + 6, y + 2, 2, 2);
  ctx.fillRect(x + 10, y + 2, 2, 2);
}

export function drawTextBar(ctx, text) {
  ctx.fillStyle = 'rgba(10, 14, 18, 0.85)';
  ctx.fillRect(4, 146, 312, 30);
  ctx.strokeStyle = '#4a6a7a';
  ctx.strokeRect(4.5, 146.5, 311, 29);
  ctx.fillStyle = '#e8f0f2';
  ctx.font = '7px monospace';
  ctx.textBaseline = 'top';
  wrapText(ctx, text, 10, 152, 296, 9);
  ctx.fillStyle = '#7adfc8';
  ctx.fillText('[E]', 296, 166);
}

export function drawToast(ctx, text) {
  ctx.fillStyle = 'rgba(10, 14, 18, 0.8)';
  ctx.fillRect(40, 128, 240, 14);
  ctx.strokeStyle = '#4a6a7a';
  ctx.strokeRect(40.5, 128.5, 239, 13);
  ctx.fillStyle = '#ffe97a';
  ctx.font = '7px monospace';
  ctx.textBaseline = 'top';
  const w = ctx.measureText(text).width;
  ctx.fillText(text, 160 - w / 2, 132);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let cursorY = y;
  for (const word of words) {
    const attempt = line ? line + ' ' + word : word;
    if (ctx.measureText(attempt).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = attempt;
    }
  }
  if (line) ctx.fillText(line, x, cursorY);
}

export function drawHud(ctx, label, progressText) {
  ctx.fillStyle = 'rgba(10, 14, 18, 0.7)';
  ctx.fillRect(4, 4, 120, 12);
  ctx.fillStyle = '#e8f0f2';
  ctx.font = '7px monospace';
  ctx.textBaseline = 'top';
  ctx.fillText(label, 8, 7);
  if (progressText) {
    ctx.fillStyle = '#7adfc8';
    ctx.fillText(progressText, 88, 7);
  }
}

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
    case 'wave': { // rolling foam front — several staggered crests
      const segs = [
        [0, 2, 14], [12, 0, 16], [26, 3, 12], [36, 1, 16], [50, 2, 12], [60, 0, 12],
      ];
      // translucent sheet of sea water trailing from the waterline to the
      // crest, so the wash visually connects back to the ocean
      const sheetTop = hazard.start.y + 4;
      if (y > sheetTop) {
        ctx.fillStyle = 'rgba(74, 140, 181, 0.55)';
        ctx.fillRect(x, sheetTop, hazard.w, y - sheetTop);
      }
      ctx.fillStyle = '#4a8cb5';
      for (const [ox, oy, sw] of segs) {
        ctx.fillRect(x + ox, y + oy + 2, Math.min(sw, hazard.w - ox), 3);
      }
      ctx.fillStyle = '#e8f0f2';
      for (const [ox, oy, sw] of segs) {
        ctx.fillRect(x + ox, y + oy, Math.min(sw, hazard.w - ox), 2);
      }
      break;
    }
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
