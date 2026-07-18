export const PICKUP_RADIUS = 18;

export function nearestItemInRange(player, items, isCollected, radius) {
  const px = player.x + player.w / 2;
  const py = player.y + player.h / 2;
  let best = null;
  let bestDist = Infinity;
  for (const item of items) {
    if (isCollected(item.id)) continue;
    const d = Math.hypot(item.x - px, item.y - py);
    if (d <= radius && d < bestDist) {
      best = item;
      bestDist = d;
    }
  }
  return best;
}
