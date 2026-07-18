const KEY_MAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
};

const INTERACT_CODES = new Set(['KeyE', 'Space']);

export function keysToVector(pressedKeys) {
  let dx = 0;
  let dy = 0;
  for (const code of pressedKeys) {
    const dir = KEY_MAP[code];
    if (dir === 'up') dy -= 1;
    else if (dir === 'down') dy += 1;
    else if (dir === 'left') dx -= 1;
    else if (dir === 'right') dx += 1;
  }
  return {
    dx: Math.max(-1, Math.min(1, dx)),
    dy: Math.max(-1, Math.min(1, dy)),
  };
}

export function createInteractLatch() {
  let pressed = false;
  return {
    press() { pressed = true; },
    consume() {
      const was = pressed;
      pressed = false;
      return was;
    },
  };
}

export function createKeyboardInput() {
  const pressedKeys = new Set();
  const latch = createInteractLatch();

  function handleKeyDown(e) {
    if (INTERACT_CODES.has(e.code) && !e.repeat) latch.press();
    pressedKeys.add(e.code);
    if (e.code === 'Space') e.preventDefault();
  }

  function handleKeyUp(e) {
    pressedKeys.delete(e.code);
  }

  function attach() {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
  }

  function detach() {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
  }

  function getVector() {
    return keysToVector(pressedKeys);
  }

  return { attach, detach, getVector, consumeInteract: latch.consume };
}
