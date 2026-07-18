import { LINES } from '../dialogue.js';
import { ITEM_SPRITES, drawSprite } from '../render.js';

const scene = {
  id: 'ending',

  enter(game) {
    game.input.consumeInteract();
  },

  update(dt, game) {
    if (game.input.consumeInteract()) game.resetAll();
  },

  render(ctx) {
    // restored river landscape
    ctx.fillStyle = '#b8d8e8';
    ctx.fillRect(0, 0, 320, 70);
    ctx.fillStyle = '#3a7ca5';
    ctx.fillRect(0, 70, 320, 40);
    ctx.fillStyle = '#4a8cb5';
    for (let i = 0; i < 8; i++) ctx.fillRect(16 + i * 38, 78 + (i % 3) * 8, 20, 2);
    ctx.fillStyle = '#5aa457';
    ctx.fillRect(0, 110, 320, 70);
    ctx.fillStyle = '#3d7a3a';
    for (const rx of [24, 32, 290, 298]) ctx.fillRect(rx, 100, 2, 12);
    // swans returning
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(60, 84, 8, 5);
    ctx.fillRect(66, 78, 2, 7);
    ctx.fillRect(250, 92, 8, 5);
    ctx.fillRect(256, 86, 2, 7);
    // Mei watching, back turned (simple silhouette)
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(154, 96, 12, 6);
    ctx.fillStyle = '#2ee6c8';
    ctx.fillRect(164, 96, 3, 3);
    ctx.fillStyle = '#3b5f8a';
    ctx.fillRect(155, 102, 10, 8);

    // poem
    ctx.fillStyle = 'rgba(10, 14, 18, 0.65)';
    ctx.fillRect(40, 118, 240, 52);
    ctx.fillStyle = '#e8f0f2';
    ctx.font = '7px monospace';
    ctx.textBaseline = 'top';
    LINES.ending.forEach((line, i) => {
      ctx.fillText(line, 48, 122 + i * 9);
    });

    // the twelve samples, lined up
    let sx = 96;
    for (const kind of ['line', 'line', 'line', 'line', 'bottle', 'bottle', 'bottle', 'bottle', 'line', 'line', 'cap', 'bag']) {
      drawSprite(ctx, ITEM_SPRITES[kind], sx, 6, 1);
      sx += 11;
    }

    ctx.fillStyle = '#7adfc8';
    ctx.fillText('Press E to play again', 112, 20);
  },
};

export default scene;
