export function createHazard({ x1, y1, x2, y2, speed, w, h, kind }) {
  return {
    x: x1,
    y: y1,
    w,
    h,
    kind,
    speed,
    start: { x: x1, y: y1 },
    end: { x: x2, y: y2 },
    movingToEnd: true,
    facingLeft: x2 < x1,
  };
}

export function updateHazard(hazard, dt) {
  const target = hazard.movingToEnd ? hazard.end : hazard.start;
  const dx = target.x - hazard.x;
  const dy = target.y - hazard.y;
  if (dx < 0) hazard.facingLeft = true;
  else if (dx > 0) hazard.facingLeft = false;
  const dist = Math.hypot(dx, dy);
  const step = hazard.speed * dt;

  if (dist === 0 || dist <= step) {
    hazard.x = target.x;
    hazard.y = target.y;
    hazard.movingToEnd = !hazard.movingToEnd;
  } else {
    hazard.x += (dx / dist) * step;
    hazard.y += (dy / dist) * step;
  }
}
