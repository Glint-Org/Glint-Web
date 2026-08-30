/**
 * Device-matched status bars for screen chrome.
 * theme "light" = dark icons on light strip; "dark" = light icons on dark strip.
 * Screenshot content must cover-fit into `screenContentRect` below the bar.
 */

export function statusBarKindForFrame(frameId) {
  const id = String(frameId || '');
  if (/iphone/i.test(id)) return 'ios';
  if (/ipad|tablet/i.test(id)) return 'ipados';
  return 'android';
}

/** True for Dynamic Island iPhone frames. */
export function statusBarHasIsland(frameId) {
  const id = String(frameId || '');
  return /iphone16/i.test(id);
}

export function statusBarHeight(screenW, kind = 'android') {
  const w = Math.max(1, screenW);
  if (kind === 'ios') return Math.max(32, Math.round(w * 0.062));
  if (kind === 'ipados') return Math.max(28, Math.round(w * 0.048));
  return Math.max(26, Math.round(w * 0.052));
}

/** Resolve kind from chrome / frame id. */
export function resolveStatusBarKind(chrome = {}, frameId = null) {
  if (chrome.statusBarKind) return chrome.statusBarKind;
  return statusBarKindForFrame(frameId || chrome.frameId);
}

/** Content area below an optional status bar (full hole when disabled). */
export function screenContentRect(screenW, screenH, chrome = {}, frameId = null) {
  const w = Math.max(1, Math.round(screenW));
  const h = Math.max(1, Math.round(screenH));
  const kind = resolveStatusBarKind(chrome, frameId);
  const barH = chrome.statusBarEnabled ? statusBarHeight(w, kind) : 0;
  return {
    x: 0,
    y: barH,
    w,
    h: Math.max(1, h - barH),
    barH,
    kind,
  };
}

/** object-fit: cover into a destination rect (dx may be negative when cropping). */
export function coverFitRect(srcW, srcH, destW, destH, destX = 0, destY = 0) {
  const iw = Math.max(1, srcW);
  const ih = Math.max(1, srcH);
  const dw0 = Math.max(1, destW);
  const dh0 = Math.max(1, destH);
  const cover = Math.max(dw0 / iw, dh0 / ih);
  const dw = iw * cover;
  const dh = ih * cover;
  return {
    dx: destX + (dw0 - dw) / 2,
    dy: destY + (dh0 - dh) / 2,
    dw,
    dh,
  };
}

/** object-fit: contain — fit inside dest without cropping, centered. */
export function containFitRect(srcW, srcH, destW, destH, destX = 0, destY = 0) {
  const iw = Math.max(1, srcW);
  const ih = Math.max(1, srcH);
  const dw0 = Math.max(1, destW);
  const dh0 = Math.max(1, destH);
  const contain = Math.min(dw0 / iw, dh0 / ih);
  const dw = iw * contain;
  const dh = ih * contain;
  return {
    dx: destX + (dw0 - dw) / 2,
    dy: destY + (dh0 - dh) / 2,
    dw,
    dh,
  };
}

function themeColors(theme) {
  const lightIcons = theme !== 'light';
  return {
    lightIcons,
    fg: lightIcons ? '#FFFFFF' : '#1C1C1E',
    bg: lightIcons ? '#000000' : '#FFFFFF',
  };
}

function drawWifi(ctx, x, cy, size, color) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.4, size * 0.14);
  ctx.lineCap = 'round';
  for (const [r, a0, a1] of [
    [size, Math.PI * 1.2, Math.PI * 1.8],
    [size * 0.62, Math.PI * 1.2, Math.PI * 1.8],
  ]) {
    ctx.beginPath();
    ctx.arc(x, cy + size * 0.35, r, a0, a1);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(x, cy + size * 0.2, Math.max(1.2, size * 0.12), 0, Math.PI * 2);
  ctx.fill();
}

function drawIosBattery(ctx, x, y, w, h, color, pct = 0.85) {
  const tip = Math.max(1.5, h * 0.28);
  const r = Math.max(1, h * 0.22);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1, h * 0.12);
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, w - tip - 1, h, r);
  else ctx.rect(x, y, w - tip - 1, h);
  ctx.stroke();
  const pad = Math.max(1.5, h * 0.18);
  const fillW = Math.max(pad, (w - tip - 1 - pad * 2) * pct);
  ctx.fillRect(x + pad, y + pad, fillW, h - pad * 2);
  ctx.fillRect(x + w - tip - 1, y + h * 0.28, tip, h * 0.44);
}

function drawAndroidBattery(ctx, x, y, w, h, color, pct = 0.8) {
  const tip = Math.max(1.5, w * 0.08);
  const r = Math.max(1, h * 0.2);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1, h * 0.12);
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, w - tip, h, r);
  else ctx.rect(x, y, w - tip, h);
  ctx.stroke();
  const pad = Math.max(1.2, h * 0.16);
  ctx.fillRect(x + pad, y + pad, Math.max(pad, (w - tip - pad * 2) * pct), h - pad * 2);
  ctx.fillRect(x + w - tip, y + h * 0.3, tip, h * 0.4);
}

function drawCellularIos(ctx, x, cy, color, fontSize) {
  ctx.fillStyle = color;
  const barW = Math.max(2, Math.round(fontSize * 0.13));
  const gap = Math.max(1.5, Math.round(fontSize * 0.1));
  for (let i = 0; i < 4; i++) {
    const bh = fontSize * (0.22 + i * 0.2);
    const rx = Math.max(0.5, barW * 0.35);
    const bx = x + i * (barW + gap);
    const by = cy + fontSize * 0.28 - bh;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') ctx.roundRect(bx, by, barW, bh, rx);
    else ctx.rect(bx, by, barW, bh);
    ctx.fill();
  }
}

function drawCellularAndroid(ctx, x, cy, color, fontSize) {
  ctx.fillStyle = color;
  const barW = Math.max(2, Math.round(fontSize * 0.15));
  const gap = Math.max(1.5, Math.round(fontSize * 0.09));
  for (let i = 0; i < 4; i++) {
    const bh = fontSize * (0.2 + i * 0.22);
    ctx.fillRect(x + i * (barW + gap), cy + fontSize * 0.3 - bh, barW, bh);
  }
}

function drawDynamicIsland(ctx, screenW, barH) {
  const iw = Math.round(screenW * 0.28);
  const ih = Math.round(barH * 0.72);
  const x = (screenW - iw) / 2;
  const y = (barH - ih) / 2;
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, iw, ih, ih / 2);
  else {
    ctx.moveTo(x + ih / 2, y);
    ctx.arcTo(x + iw, y, x + iw, y + ih, ih / 2);
    ctx.arcTo(x + iw, y + ih, x, y + ih, ih / 2);
    ctx.arcTo(x, y + ih, x, y, ih / 2);
    ctx.arcTo(x, y, x + iw, y, ih / 2);
  }
  ctx.fill();
}

function drawIosStatusBar(ctx, screenW, theme, frameId) {
  const { fg, bg } = themeColors(theme);
  const h = statusBarHeight(screenW, 'ios');
  const padX = Math.round(screenW * 0.07);
  const cy = h * 0.52;
  const fontSize = Math.max(12, Math.round(h * 0.4));
  const island = statusBarHasIsland(frameId);

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, screenW, h);

  if (island) drawDynamicIsland(ctx, screenW, h);

  ctx.fillStyle = fg;
  ctx.font = `600 ${fontSize}px -apple-system, "SF Pro Text", Inter, system-ui, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText('9:41', padX, cy);

  let x = screenW - padX;
  const batW = Math.round(fontSize * 1.65);
  const batH = Math.round(fontSize * 0.7);
  x -= batW;
  drawIosBattery(ctx, x, cy - batH / 2, batW, batH, fg);

  x -= Math.round(fontSize * 0.85);
  drawWifi(ctx, x, cy, fontSize * 0.48, fg);

  x -= Math.round(fontSize * 1.15);
  drawCellularIos(ctx, x, cy, fg, fontSize);
}

function drawAndroidStatusBar(ctx, screenW, theme) {
  const { fg, bg } = themeColors(theme);
  const h = statusBarHeight(screenW, 'android');
  const padX = Math.round(screenW * 0.045);
  const cy = h * 0.55;
  const fontSize = Math.max(11, Math.round(h * 0.42));

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, screenW, h);

  ctx.fillStyle = fg;
  ctx.font = `500 ${fontSize}px Roboto, Inter, system-ui, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText('12:30', padX, cy);

  let x = screenW - padX;
  const batW = Math.round(fontSize * 1.45);
  const batH = Math.round(fontSize * 0.68);
  x -= batW;
  drawAndroidBattery(ctx, x, cy - batH / 2, batW, batH, fg);

  x -= Math.round(fontSize * 0.75);
  drawWifi(ctx, x, cy, fontSize * 0.45, fg);

  x -= Math.round(fontSize * 1.05);
  drawCellularAndroid(ctx, x, cy, fg, fontSize);
}

function drawIpadStatusBar(ctx, screenW, theme) {
  const { fg, bg } = themeColors(theme);
  const h = statusBarHeight(screenW, 'ipados');
  const padX = Math.round(screenW * 0.04);
  const cy = h * 0.52;
  const fontSize = Math.max(11, Math.round(h * 0.38));

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, screenW, h);

  ctx.fillStyle = fg;
  ctx.font = `600 ${fontSize}px -apple-system, "SF Pro Text", Inter, system-ui, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText('9:41', padX, cy);
  ctx.font = `400 ${Math.max(10, fontSize * 0.92)}px -apple-system, "SF Pro Text", Inter, system-ui, sans-serif`;
  ctx.fillText('Mon Jun 9', padX + fontSize * 2.6, cy);

  let x = screenW - padX;
  ctx.font = `500 ${Math.max(10, fontSize * 0.85)}px -apple-system, Inter, system-ui, sans-serif`;
  ctx.textAlign = 'right';
  const pct = '100%';
  const pctW = ctx.measureText?.(pct)?.width || fontSize * 2.2;
  ctx.fillText(pct, x, cy);
  x -= pctW + fontSize * 0.35;

  const batW = Math.round(fontSize * 1.55);
  const batH = Math.round(fontSize * 0.65);
  x -= batW;
  ctx.textAlign = 'left';
  drawIosBattery(ctx, x, cy - batH / 2, batW, batH, fg, 1);

  x -= Math.round(fontSize * 0.8);
  drawWifi(ctx, x, cy, fontSize * 0.42, fg);
}

/**
 * Draw a platform status bar. `kind` = ios | android | ipados.
 * `frameId` enables Dynamic Island on matching iPhones.
 */
export function drawStatusBar(ctx, screenW, theme = 'dark', kind = 'android', frameId = null) {
  if (!ctx || !(screenW > 0)) return;
  ctx.save();
  if (kind === 'ios') drawIosStatusBar(ctx, screenW, theme, frameId);
  else if (kind === 'ipados') drawIpadStatusBar(ctx, screenW, theme);
  else drawAndroidStatusBar(ctx, screenW, theme);
  ctx.restore();
}

/** True when status-bar chrome fields changed enough to rebake the screen bitmap. */
export function statusBarChromeChanged(prev = {}, next = {}) {
  return (
    !!prev.statusBarEnabled !== !!next.statusBarEnabled
    || (next.statusBarEnabled
      && (prev.statusBarTheme || 'dark') !== (next.statusBarTheme || 'dark'))
    || (next.statusBarEnabled
      && resolveStatusBarKind(prev) !== resolveStatusBarKind(next))
  );
}
