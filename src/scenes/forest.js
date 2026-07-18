import { createSiteScene } from './site-common.js';

function drawBackground(ctx) {
  // deep forest backdrop
  ctx.fillStyle = '#1e3b24';
  ctx.fillRect(0, 0, 320, 180);
  // canopy light shafts
  ctx.fillStyle = 'rgba(220, 240, 180, 0.12)';
  ctx.fillRect(60, 0, 14, 180);
  ctx.fillRect(200, 0, 10, 180);
  // mountain ash trunks
  ctx.fillStyle = '#8a7a63';
  for (const tx of [24, 88, 150, 226, 290]) {
    ctx.fillRect(tx, 0, 10, 140);
    ctx.fillStyle = '#6e6250';
    ctx.fillRect(tx + 7, 0, 3, 140);
    ctx.fillStyle = '#8a7a63';
  }
  // tree hollow (in trunk at x=150)
  ctx.fillStyle = '#2b2118';
  ctx.fillRect(151, 96, 8, 10);
  // ground
  ctx.fillStyle = '#2e5231';
  ctx.fillRect(0, 140, 320, 40);
  // creek
  ctx.fillStyle = '#3a7ca5';
  ctx.fillRect(0, 152, 110, 8);
  ctx.fillStyle = '#8a8a8a';
  ctx.fillRect(40, 150, 8, 4);
  ctx.fillRect(72, 158, 8, 4);
  // ferns
  ctx.fillStyle = '#3d7a3a';
  for (const [fx, fy] of [[50, 130], [120, 134], [190, 128], [260, 132]]) {
    ctx.fillRect(fx, fy, 12, 3);
    ctx.fillRect(fx + 2, fy - 4, 8, 4);
    ctx.fillRect(fx + 4, fy - 7, 4, 3);
  }
  // lyrebird silhouette
  ctx.fillStyle = '#141d16';
  ctx.fillRect(270, 128, 7, 4);
  ctx.fillRect(276, 124, 2, 5);
  ctx.fillRect(263, 122, 8, 2);
  ctx.fillRect(261, 120, 4, 2);
}

export default createSiteScene({
  siteId: 'forest',
  label: 'Dandenong Ranges',
  items: [
    { id: 'bottle-fern', kind: 'bottle', x: 126, y: 130 },   // behind the ferns
    { id: 'bottle-hollow', kind: 'bottle', x: 155, y: 100 }, // in the tree hollow
    { id: 'bottle-creek', kind: 'bottle', x: 58, y: 150 },   // by the creek stones
    { id: 'bottle-grass', kind: 'bottle', x: 246, y: 144 },  // in trailside grass
  ],
  drawBackground,
});
