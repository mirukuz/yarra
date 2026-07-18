const KEY_MAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
};

const INTERACT_CODES = new Set(['KeyE', 'Space']);

const DPAD_DIRS = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
  'up-left': { dx: -1, dy: -1 },
  'up-right': { dx: 1, dy: -1 },
  'down-left': { dx: -1, dy: 1 },
  'down-right': { dx: 1, dy: 1 },
};

export function dirsToVector(activeDirs) {
  let dx = 0;
  let dy = 0;
  for (const dir of activeDirs) {
    const v = DPAD_DIRS[dir];
    if (!v) continue;
    dx += v.dx;
    dy += v.dy;
  }
  return {
    dx: Math.max(-1, Math.min(1, dx)),
    dy: Math.max(-1, Math.min(1, dy)),
  };
}

export function mergeVectors(a, b) {
  return {
    dx: Math.max(-1, Math.min(1, a.dx + b.dx)),
    dy: Math.max(-1, Math.min(1, a.dy + b.dy)),
  };
}

export function isTouchDevice() {
  return typeof window !== 'undefined' &&
    (('ontouchstart' in window) || (navigator.maxTouchPoints > 0));
}

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

export function createTouchInput() {
  const activeDirs = new Set();
  const latch = createInteractLatch();

  function bindDirButton(el, dir) {
    const start = (e) => { e.preventDefault(); activeDirs.add(dir); };
    const end = (e) => { e.preventDefault(); activeDirs.delete(dir); };
    el.addEventListener('touchstart', start, { passive: false });
    el.addEventListener('touchend', end, { passive: false });
    el.addEventListener('touchcancel', end, { passive: false });
  }

  function attach() {
    const dpad = document.getElementById('touch-dpad');
    const interactBtn = document.getElementById('touch-interact');
    if (dpad) {
      for (const dir of Object.keys(DPAD_DIRS)) {
        const btn = dpad.querySelector(`[data-dir="${dir}"]`);
        if (btn) bindDirButton(btn, dir);
      }
    }
    if (interactBtn) {
      interactBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        latch.press();
      }, { passive: false });
    }
    if (isTouchDevice()) {
      document.body.classList.add('touch-controls-active');
    }
  }

  function detach() {
    // On-screen buttons are static page elements for the game's lifetime; no teardown needed.
  }

  function getVector() {
    return dirsToVector(activeDirs);
  }

  return { attach, detach, getVector, consumeInteract: latch.consume };
}

export function createGameInput() {
  const keyboard = createKeyboardInput();
  const touch = createTouchInput();

  function attach() {
    keyboard.attach();
    touch.attach();
  }

  function detach() {
    keyboard.detach();
    touch.detach();
  }

  function getVector() {
    return mergeVectors(keyboard.getVector(), touch.getVector());
  }

  function consumeInteract() {
    // Call both unconditionally — do NOT short-circuit with `||` directly on the
    // calls, or the second latch never gets drained and fires again next frame.
    const k = keyboard.consumeInteract();
    const t = touch.consumeInteract();
    return k || t;
  }

  return { attach, detach, getVector, consumeInteract };
}
