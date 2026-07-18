const PLAYER_WIDTH = 16;
const PLAYER_HEIGHT = 16;
const PLAYER_SPEED = 70; // pixels per second

export function createPlayer(startX, startY) {
  return {
    x: startX,
    y: startY,
    w: PLAYER_WIDTH,
    h: PLAYER_HEIGHT,
    speed: PLAYER_SPEED,
    facingLeft: false,
  };
}

export function movePlayer(player, dx, dy, dt, bounds) {
  let moveX = dx;
  let moveY = dy;

  if (moveX !== 0 && moveY !== 0) {
    moveX *= Math.SQRT1_2;
    moveY *= Math.SQRT1_2;
  }

  if (dx < 0) player.facingLeft = true;
  else if (dx > 0) player.facingLeft = false;

  const newX = player.x + moveX * player.speed * dt;
  const newY = player.y + moveY * player.speed * dt;

  player.x = Math.max(bounds.x, Math.min(newX, bounds.x + bounds.w - player.w));
  player.y = Math.max(bounds.y, Math.min(newY, bounds.y + bounds.h - player.h));
}
