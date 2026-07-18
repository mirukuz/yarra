import { createSiteScene } from './site-common.js';

function drawBackground(ctx) {
  // sky + city skyline
  ctx.fillStyle = '#b8d8e8';
  ctx.fillRect(0, 0, 320, 60);
  ctx.fillStyle = '#7a95a8';
  for (const [x, w, h] of [[20, 10, 24], [34, 8, 30], [46, 12, 20], [250, 10, 26], [264, 14, 18], [282, 8, 32]]) {
    ctx.fillRect(x, 60 - h, w, h);
  }
  // lake water
  ctx.fillStyle = '#3a7ca5';
  ctx.fillRect(0, 60, 320, 70);
  ctx.fillStyle = '#4a8cb5';
  for (let i = 0; i < 8; i++) ctx.fillRect(20 + i * 38, 72 + (i % 3) * 16, 18, 2);
  // shore
  ctx.fillStyle = '#5aa457';
  ctx.fillRect(0, 130, 320, 50);
  // reeds
  ctx.fillStyle = '#3d7a3a';
  for (const rx of [30, 38, 90, 98, 210, 218, 280]) {
    ctx.fillRect(rx, 116, 2, 16);
    ctx.fillRect(rx - 2, 114, 2, 8);
  }
  // bench
  ctx.fillStyle = '#8a5a33';
  ctx.fillRect(240, 140, 28, 4);
  ctx.fillRect(242, 144, 3, 8);
  ctx.fillRect(263, 144, 3, 8);
  // small jetty
  ctx.fillStyle = '#8a6a43';
  ctx.fillRect(150, 118, 30, 6);
  ctx.fillStyle = '#6e5433';
  ctx.fillRect(154, 124, 3, 6);
  ctx.fillRect(172, 124, 3, 6);
  // buoy
  ctx.fillStyle = '#ff5533';
  ctx.fillRect(160, 84, 6, 6);
  // black swans
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(120, 96, 8, 5);
  ctx.fillRect(126, 90, 2, 7);
  ctx.fillRect(70, 108, 8, 5);
  ctx.fillRect(76, 102, 2, 7);
  ctx.fillStyle = '#cc3311';
  ctx.fillRect(127, 89, 2, 2);
  ctx.fillRect(77, 101, 2, 2);
}

export default createSiteScene({
  siteId: 'lake',
  label: 'Albert Park Lake',
  items: [
    { id: 'line-reeds', kind: 'line', x: 34, y: 122 },   // wound through the reeds
    { id: 'line-shore', kind: 'line', x: 190, y: 128 },  // floating at the waterline
    { id: 'line-bench', kind: 'line', x: 252, y: 150 },  // under the park bench
    { id: 'line-jetty', kind: 'line', x: 166, y: 122 },  // snagged at the foot of the jetty
  ],
  drawBackground,
  bounds: { x: 0, y: 114, w: 320, h: 66 },
});
