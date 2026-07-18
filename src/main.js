import { createGameState } from './game-state.js';
import { createPlayer } from './player.js';
import { createKeyboardInput } from './input.js';
import { currentLine, advanceDialogue, isDialogueDone } from './dialogue.js';
import { drawTextBar } from './render.js';
import titleScene from './scenes/title.js';
import mapScene from './scenes/map.js';
import lakeScene from './scenes/lake.js';
import forestScene from './scenes/forest.js';
import oceanScene from './scenes/ocean.js';
import datacenterScene from './scenes/datacenter.js';
import endingScene from './scenes/ending.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const SCENES = {
  title: titleScene,
  map: mapScene,
  lake: lakeScene,
  forest: forestScene,
  ocean: oceanScene,
  datacenter: datacenterScene,
  ending: endingScene,
};

const input = createKeyboardInput();
input.attach();

const game = {
  state: createGameState(),
  player: createPlayer(152, 84),
  input,
  visited: {},
  dialogue: null,
  currentScene: null,

  switchScene(name) {
    game.currentScene = SCENES[name];
    game.currentScene.enter(game);
  },

  resetAll() {
    game.state = createGameState();
    game.player = createPlayer(152, 84);
    game.visited = {};
    game.dialogue = null;
    game.switchScene('title');
  },
};

let lastTimestamp = null;

function update(dt) {
  if (game.dialogue) {
    if (game.input.consumeInteract()) {
      advanceDialogue(game.dialogue);
      if (isDialogueDone(game.dialogue)) game.dialogue = null;
    }
    return;
  }
  game.currentScene.update(dt, game);
}

function render() {
  game.currentScene.render(ctx, game);
  if (game.dialogue) {
    const line = currentLine(game.dialogue);
    if (line) drawTextBar(ctx, line);
  }
}

function loop(timestamp) {
  if (lastTimestamp === null) lastTimestamp = timestamp;
  const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.05);
  lastTimestamp = timestamp;

  update(dt);
  render();

  requestAnimationFrame(loop);
}

game.switchScene('title');
requestAnimationFrame(loop);
