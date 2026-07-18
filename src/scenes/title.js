import { LINES, createDialogue } from '../dialogue.js';

const scene = {
  id: 'title',
  introStarted: false,

  enter() {
    scene.introStarted = false;
  },

  update(dt, game) {
    if (scene.introStarted && !game.dialogue) {
      game.switchScene('map');
      return;
    }
    if (!scene.introStarted && game.input.consumeInteract()) {
      scene.introStarted = true;
      game.dialogue = createDialogue(LINES.intro);
    }
  },

  render(ctx) {
    ctx.fillStyle = '#0c1116';
    ctx.fillRect(0, 0, 320, 180);
    // river glint under the title
    ctx.fillStyle = '#3a7ca5';
    ctx.fillRect(60, 96, 200, 4);
    ctx.fillStyle = '#4a8cb5';
    ctx.fillRect(90, 102, 140, 2);
    // title
    ctx.fillStyle = '#e8f0f2';
    ctx.font = 'bold 28px monospace';
    ctx.textBaseline = 'top';
    ctx.fillText('YARRA', 118, 56);
    ctx.font = '7px monospace';
    ctx.fillStyle = '#7adfc8';
    ctx.fillText('Press E to start', 128, 120);
    ctx.fillStyle = '#8a9aa5';
    ctx.fillText('Move: WASD / arrows   Interact: E or Space', 74, 140);
  },
};

export default scene;
