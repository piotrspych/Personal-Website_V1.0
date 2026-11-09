// Loading-screen background: a GitHub-style contribution grid where each cell
// twinkles on its own rhythm. Based on the Framer "CommitGrid" component.
(function () {
  const canvas = document.getElementById("gridCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const COLOR = "#987858";
  const CELL = 6;
  const GAP = 3;
  const RADIUS = 2;
  const SPEED = 1.1;
  const INTENSITY = 0.5;
  const MAX_OPACITY = 1;
  const FRAME_MS = 1000 / 30;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let cols = 0;
  let rows = 0;

  const hash = (x, y) => {
    const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return n - Math.floor(n);
  };

  const opacity = (brightness) =>
    Math.min(1, 0.08 + brightness * (MAX_OPACITY - 0.08) * INTENSITY);

  function setup() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const step = CELL + GAP;
    cols = Math.floor((rect.width + GAP) / step);
    rows = Math.floor((rect.height + GAP) / step);
  }

  // Each cell gets its own random phase and speed, so the field never visibly loops.
  function twinkle(col, row, time) {
    const phase = hash(col, row) * Math.PI * 2;
    const freq = 0.3 + hash(col + 13.7, row - 4.2) * 1.4;
    return Math.sin(time * SPEED * freq + phase) * 0.5 + 0.5;
  }

  function draw(time) {
    const step = CELL + GAP;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = COLOR;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const brightness = reduceMotion ? hash(col + 0.5, row + 0.5) : twinkle(col, row, time);
        ctx.globalAlpha = opacity(brightness);
        ctx.beginPath();
        ctx.roundRect(col * step, row * step, CELL, CELL, RADIUS);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  const start = performance.now();
  setup();
  draw(0);
  addEventListener("resize", () => {
    setup();
    draw((performance.now() - start) / 1000);
  });
  if (reduceMotion) return;

  let lastDraw = 0;
  function loop(now) {
    if (!canvas.isConnected) return;
    requestAnimationFrame(loop);
    if (now - lastDraw < FRAME_MS) return;
    lastDraw = now;
    draw((now - start) / 1000);
  }
  requestAnimationFrame(loop);
})();
