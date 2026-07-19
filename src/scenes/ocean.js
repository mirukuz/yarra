import { createSiteScene } from './site-common.js';

function drawBackground(ctx) {
  // sky
  ctx.fillStyle = '#c8e0ec';
  ctx.fillRect(0, 0, 320, 70);
  // Luna Park silhouette (far left)
  ctx.fillStyle = '#7a6a80';
  ctx.fillRect(10, 46, 30, 24);
  ctx.fillRect(18, 38, 14, 8);
  ctx.fillStyle = '#c8e0ec';
  ctx.fillRect(22, 52, 6, 8); // the "mouth" arch
  // sea
  ctx.fillStyle = '#2f6f95';
  ctx.fillRect(0, 70, 320, 50);
  ctx.fillStyle = '#4a8cb5';
  const wavePhase = Math.floor(Date.now() / 400) % 2;
  for (let i = 0; i < 9; i++) ctx.fillRect(10 + i * 36 + wavePhase * 6, 78 + (i % 3) * 12, 20, 2);
  // breakwater with penguins
  ctx.fillStyle = '#6e6a63';
  ctx.fillRect(210, 96, 100, 12);
  ctx.fillStyle = '#1a1a1a';
  for (const px of [224, 248, 276]) {
    ctx.fillRect(px, 90, 4, 6);
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(px + 1, 92, 2, 4);
    ctx.fillStyle = '#1a1a1a';
  }
  // beach
  ctx.fillStyle = '#e0cf9a';
  ctx.fillRect(0, 120, 320, 60);
  // pier posts
  ctx.fillStyle = '#6e5a43';
  ctx.fillRect(20, 100, 6, 40);
  ctx.fillRect(40, 104, 6, 36);
  ctx.fillStyle = '#7a6650';
  ctx.fillRect(14, 96, 36, 6);
  // rocks
  ctx.fillStyle = '#8a8a8a';
  ctx.fillRect(150, 126, 14, 8);
  ctx.fillRect(162, 130, 10, 6);
  // seaweed pile
  ctx.fillStyle = '#4a6a3a';
  ctx.fillRect(230, 150, 22, 5);
  ctx.fillRect(236, 147, 10, 3);
}

export default createSiteScene({
  siteId: 'ocean',
  label: 'St Kilda Beach',
  items: [
    { id: 'line-rocks', kind: 'line', x: 158, y: 124 },  // between the rocks
    { id: 'line-pier', kind: 'line', x: 36, y: 136 },   // around a pier post
    { id: 'cap-sand', kind: 'cap', x: 120, y: 156 },     // half-buried in sand
    { id: 'bag-seaweed', kind: 'bag', x: 240, y: 146 },  // in the seaweed pile
  ],
  drawBackground,
  bounds: { x: 0, y: 104, w: 320, h: 76 },
  hazards: [
    // wave-wash sweeping up and down the beach
    { x1: 60, y1: 120, x2: 60, y2: 166, speed: 38, w: 72, h: 6, kind: 'wave' },
    // gull tracking the tideline
    { x1: 296, y1: 110, x2: 16, y2: 110, speed: 52, w: 12, h: 8, kind: 'gull' },
  ],
});
