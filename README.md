# Yarra

A small pixel-art exploration game about water, waste, and an AI data centre draining the Yarra River.

**Play it:** https://mirukuz.github.io/yarra/

## Story

Melbourne, in the near years. The rains still come, but the river runs thin — an AI data centre on its banks drinks the Yarra to cool its endless thinking.

You play Mei, who collects what the water can't swallow: fishing line from Albert Park Lake, plastic bottles from the Dandenong Ranges, litter from St Kilda Beach. Twelve samples, three sites. Then she opens the data centre's last gate.

## Controls

- **Move:** WASD or arrow keys (8-directional)
- **Interact:** E or Space — talk, pick up items, enter/exit areas

## Running locally

No build step, no dependencies. Just serve the folder and open it:

```bash
python3 -m http.server 8080
# then open http://localhost:8080/index.html
```

(Opening `index.html` directly via `file://` won't work — ES modules need to be served over HTTP.)

## Tests

```bash
npm test
```

Runs the pure-logic unit suite (movement, item pickup, dialogue, game-state progress tracking) via Node's built-in test runner. Rendering and scene wiring are browser-only and verified manually.

## Tech

Vanilla JavaScript (ES modules), HTML5 Canvas 2D, no build tools, no external dependencies. All art is drawn from code — no image assets.
