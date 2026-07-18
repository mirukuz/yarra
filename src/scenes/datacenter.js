import { movePlayer } from '../player.js';
import { LINES, createDialogue } from '../dialogue.js';
import { drawPlayer, drawHud } from '../render.js';

const BOUNDS = { x: 0, y: 24, w: 320, h: 132 }; // corridor band
const GATE = { x: 296, y: 70, w: 14, h: 60 };
const GATE_RADIUS = 24;
const SEQUENCE_SECONDS = 2.5;

const scene = {
  id: 'datacenter',
  nearGate: false,
  sequenceTimer: 0,

  enter(game) {
    game.player.x = 10;
    game.player.y = 100;
    scene.sequenceTimer = 0;
    if (!game.visited.datacenter) {
      game.visited.datacenter = true;
      game.dialogue = createDialogue(LINES.datacenterEnter);
    }
  },

  update(dt, game) {
    if (game.state.gateOpened) {
      scene.sequenceTimer += dt;
      if (scene.sequenceTimer >= SEQUENCE_SECONDS) game.switchScene('ending');
      return;
    }

    const { dx, dy } = game.input.getVector();
    movePlayer(game.player, dx, dy, dt, BOUNDS);

    const px = game.player.x + game.player.w / 2;
    const py = game.player.y + game.player.h / 2;
    scene.nearGate = Math.hypot(GATE.x - px, GATE.y + GATE.h / 2 - py) <= GATE_RADIUS + GATE.h / 2;

    if (scene.nearGate && game.input.consumeInteract()) {
      game.state.gateOpened = true;
      game.dialogue = createDialogue(LINES.gateOpen);
    }
  },

  render(ctx, game) {
    const opened = game.state.gateOpened;
    // hall
    ctx.fillStyle = '#14181f';
    ctx.fillRect(0, 0, 320, 180);
    ctx.fillStyle = '#1e242e';
    ctx.fillRect(0, 24, 320, 132);
    // server racks (top and bottom rows)
    for (let i = 0; i < 7; i++) {
      const rx = 12 + i * 42;
      ctx.fillStyle = '#2a3140';
      ctx.fillRect(rx, 28, 24, 34);
      ctx.fillRect(rx, 122, 24, 34);
      // blinking status LEDs — red while running, dim green after shutdown
      const blink = Math.floor(Date.now() / 300 + i) % 2 === 0;
      ctx.fillStyle = opened ? '#2e6a4a' : (blink ? '#ff5533' : '#7a2a1a');
      ctx.fillRect(rx + 4, 32, 3, 3);
      ctx.fillRect(rx + 12, 32, 3, 3);
      ctx.fillRect(rx + 4, 126, 3, 3);
      ctx.fillRect(rx + 12, 126, 3, 3);
    }
    // cooling pipe along the floor with flowing water
    ctx.fillStyle = '#3a4150';
    ctx.fillRect(0, 108, 296, 8);
    if (!opened) {
      ctx.fillStyle = '#4a8cb5';
      const flow = Math.floor(Date.now() / 150) % 4;
      for (let i = 0; i < 24; i++) ctx.fillRect(((i * 4 + flow) % 296), 111, 2, 2);
    }
    // warning / status light strip
    ctx.fillStyle = opened ? '#2e8a5a' : '#aa2222';
    ctx.fillRect(0, 24, 320, 3);
    // the gate
    ctx.fillStyle = opened ? '#2e8a5a' : '#8a4a2a';
    ctx.fillRect(GATE.x, GATE.y, GATE.w, GATE.h);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(GATE.x + 5, GATE.y + 24, 4, 12); // valve wheel slot
    if (scene.nearGate && !opened) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '6px monospace';
      ctx.textBaseline = 'top';
      ctx.fillText('[E] open the gate', 236, 56);
    }
    if (!opened || scene.sequenceTimer < SEQUENCE_SECONDS) drawPlayer(ctx, game.player);
    drawHud(ctx, 'Data Centre', opened ? 'gate open' : 'gate sealed');
  },
};

export default scene;
