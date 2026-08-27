/**
 * Draw an iOS-style status bar onto a screen-sized 2d context.
 * theme "light" = dark icons (for light UIs); "dark" = light icons (for dark UIs).
 */
export function statusBarHeight(screenW) {
  return Math.max(28, Math.round(screenW * 0.065));
}

export function drawStatusBar(ctx, screenW, theme = 'dark') {
  if (!ctx || !(screenW > 0)) return;
  const lightIcons = theme !== 'light';
  const color = lightIcons ? '#FFFFFF' : '#1C1C1E';
  const h = statusBarHeight(screenW);
  const padX = Math.round(screenW * 0.055);
  const cy = h * 0.55;
  const fontSize = Math.max(11, Math.round(h * 0.38));

  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText('9:41', padX, cy);

  // Right cluster: signal · wifi · battery
  let x = screenW - padX;
  const batW = Math.round(fontSize * 1.55);
  const batH = Math.round(fontSize * 0.72);
  const batR = Math.max(1, Math.round(batH * 0.22));
  x -= batW;
  const batY = cy - batH / 2;
  ctx.lineWidth = Math.max(1, Math.round(fontSize * 0.1));
  ctx.strokeRect(x, batY, batW - 3, batH);
  ctx.fillRect(x + 2, batY + 2, batW - 10, batH - 4);
  ctx.fillRect(x + batW - 3, batY + batH * 0.28, 3, batH * 0.44);

  x -= Math.round(fontSize * 0.55);
  // wifi arcs
  const wifiR = fontSize * 0.42;
  ctx.lineWidth = Math.max(1.5, fontSize * 0.12);
  ctx.beginPath();
  ctx.arc(x, cy + wifiR * 0.35, wifiR, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, cy + wifiR * 0.35, wifiR * 0.55, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, cy + wifiR * 0.15, 1.5, 0, Math.PI * 2);
  ctx.fill();

  x -= Math.round(fontSize * 0.85);
  // cellular bars
  const barW = Math.max(2, Math.round(fontSize * 0.14));
  const gap = Math.max(1, Math.round(fontSize * 0.1));
  for (let i = 0; i < 4; i++) {
    const bh = fontSize * (0.25 + i * 0.2);
    ctx.fillRect(x + i * (barW + gap), cy + fontSize * 0.28 - bh, barW, bh);
  }

  ctx.restore();
}

/** True when status-bar chrome fields changed enough to rebake the screen bitmap. */
export function statusBarChromeChanged(prev = {}, next = {}) {
  return (
    !!prev.statusBarEnabled !== !!next.statusBarEnabled
    || (next.statusBarEnabled
      && (prev.statusBarTheme || 'dark') !== (next.statusBarTheme || 'dark'))
  );
}
