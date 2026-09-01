/**
 * Device-accurate status bar SVG strips.
 * Icon paths: iOS glyphs mirror SF status-bar shapes (device-bars, MIT);
 * Android uses Material signal/wifi + AOSP batterymeter (12×20).
 * Run: node scripts/gen-status-bars.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, 'public/frames/status-bars');

// ── iOS (viewBox 0 0 512 512) ──────────────────────────────────────────────
const IOS_CELL = [
  'M472,432H424a24,24,0,0,1-24-24V104a24,24,0,0,1,24-24h48a24,24,0,0,1,24,24V408A24,24,0,0,1,472,432Z',
  'M344,432H296a24,24,0,0,1-24-24V184a24,24,0,0,1,24-24h48a24,24,0,0,1,24,24V408A24,24,0,0,1,344,432Z',
  'M216,432H168a24,24,0,0,1-24-24V248a24,24,0,0,1,24-24h48a24,24,0,0,1,24,24V408A24,24,0,0,1,216,432Z',
  'M88,432H40a24,24,0,0,1-24-24V312a24,24,0,0,1,24-24H88a24,24,0,0,1,24,24v96A24,24,0,0,1,88,432Z',
];
const IOS_WIFI = [
  'M256,96c-83,0-166.1,35.8-224,93.7l37.3,39.6c24.3-24.3,52.5-43.3,83.9-56.6C185.8,159,220.3,152,256,152s70.2,7,102.7,20.7c31.4,13.3,59.7,32.3,83.9,56.6l37.3-39.6C422.1,131.8,339,96,256,96z',
  'M256,209c-57.2,0-109,23.1-146.6,60.4L149,309c28.7-28.4,66.6-44,107-44c40.4,0,78.3,15.6,107,44l39.6-39.6C365,232.1,313.2,209,256,209z',
  'M256,321c-25.9,0-48.9,12.3-63.6,31.4L256,416l63.6-63.6C304.9,333.3,281.9,321,256,321z',
];
const IOS_BAT_FRAME = 'M396,144H64c-26.4,0-48,21.6-48,48v128c0,26.4,21.6,48,48,48h332c26.4,0,48-21.6,48-48V192C444,165.6,422.4,144,396,144z M416,320c0,11-9,20-20,20H64c-11,0-20-9-20-20V192c0-11,9-20,20-20h332c11,0,20,9,20,20V320z';
const IOS_BAT_CAP = 'M464,204.6v102.8c16,0,32-27.7,32-51.4C496,232.3,480,204.6,464,204.6z';
const IOS_BAT_FILL = 'M384,192H76c-6.6,0-12,5.4-12,12v104c0,6.6,5.4,12,12,12h308c6.6,0,12-5.4,12-12V204C396,197.4,390.6,192,384,192z';

// ── Android Material (viewBox 0 0 24 24) ───────────────────────────────────
const MD_CELL = 'M2 22h20V2z';
const MD_WIFI = 'M12.01 21.49L23.64 7c-.45-.34-4.93-4-11.64-4C5.28 3 .81 6.66.36 7l11.63 14.49.01.01.01-.01z';

// AOSP status-bar battery (viewBox 0 0 12 20)
const AOSP_BAT_FRAME = 'M3.5,2 v0 H1.33 C0.6,2 0,2.6 0,3.33 V13v5.67 C0,19.4 0.6,20 1.33,20 h9.33 C11.4,20 12,19.4 12,18.67 V13V3.33 C12,2.6 11.4,2 10.67,2 H8.5 V0 H3.5 z M2,18v-7V4h8v9v5H2L2,18z';
const AOSP_BAT_FILL = 'M2,18 v-14 h8 v14 z';

/** Fit icon content box into target rect; uniform scale, bottom-aligned by default. */
function fitIcon(content, targetX, targetY, targetW, targetH, { vbW, vbH, cx, cy, cw, ch, align = 'bottom' }) {
  const s = Math.min(targetW / cw, targetH / ch);
  const dw = cw * s;
  const dh = ch * s;
  const tx = targetX + (targetW - dw) / 2;
  const ty = align === 'bottom' ? targetY + targetH - dh : targetY + (targetH - dh) / 2;
  const paths = Array.isArray(content)
    ? content.map((d) => `<path d="${d}"/>`).join('\n    ')
    : `<path d="${content}"/>`;
  return `<g transform="translate(${tx.toFixed(2)},${ty.toFixed(2)}) scale(${s.toFixed(5)}) translate(${-cx},${-cy})" fill="currentColor">\n    ${paths}\n  </g>`;
}

function iosBatteryIcon(fg, x, y, w, h, pct = 0.82) {
  const s = Math.min(w / 480, h / 176);
  const dw = 480 * s;
  const dh = 176 * s;
  const tx = x + (w - dw) / 2;
  const ty = y + h - dh;
  const fillScale = pct;
  return `<g transform="translate(${tx.toFixed(2)},${ty.toFixed(2)}) scale(${s.toFixed(5)}) translate(-16,-144)" fill="${fg}">
    <path d="${IOS_BAT_FRAME}" opacity="0.4"/>
    <path d="${IOS_BAT_CAP}" opacity="0.4"/>
    <path d="${IOS_BAT_FILL}" transform="scale(${fillScale},1) translate(${(1 - fillScale) * 196},0)"/>
  </g>`;
}

function iosRightCluster(fg, rightMargin, iconY, iconH) {
  const batW = 25;
  const wifiW = 16;
  const cellW = 17;
  const gap = 5;
  const batX = rightMargin - batW;
  const wifiX = batX - gap - wifiW;
  const cellX = wifiX - gap - cellW;
  return `
  <g color="${fg}">
    ${fitIcon(IOS_CELL, cellX, iconY, cellW, iconH, { cx: 16, cy: 104, cw: 480, ch: 328 })}
    ${fitIcon(IOS_WIFI, wifiX, iconY, wifiW, iconH, { cx: 32, cy: 96, cw: 448, ch: 320 })}
  </g>
  ${iosBatteryIcon(fg, batX, iconY, batW, iconH, 0.82)}`;
}


/** Pixel — thin vertical signal bars (AOSP SignalDrawable-style). */
function pixelSignalBars(fg, x, y, w, h) {
  const bars = [
    { h: 0.38 },
    { h: 0.55 },
    { h: 0.72 },
    { h: 0.92 },
  ];
  const gap = w * 0.12;
  const barW = (w - gap * 3) / 4;
  return bars
    .map((b, i) => {
      const bx = x + i * (barW + gap);
      const bh = h * b.h;
      const by = y + h - bh;
      return `<rect x="${bx.toFixed(2)}" y="${by.toFixed(2)}" width="${barW.toFixed(2)}" height="${bh.toFixed(2)}" rx="${(barW / 2).toFixed(2)}" fill="${fg}"/>`;
    })
    .join('\n  ');
}

function aospBatteryIcon(fg, x, y, w, h, pct = 0.78) {
  const s = Math.min(w / 12, h / 20);
  const tx = x + (w - 12 * s) / 2;
  const ty = y + h - 20 * s;
  return `<g transform="translate(${tx.toFixed(2)},${ty.toFixed(2)}) scale(${s.toFixed(5)})" fill="${fg}">
    <path d="${AOSP_BAT_FRAME}" opacity="0.55"/>
    <path d="${AOSP_BAT_FILL}" transform="scale(${pct},1)"/>
  </g>`;
}

function pixelRightCluster(fg, rightMargin, iconY, iconH) {
  const batW = 22;
  const wifiW = 17;
  const cellW = 17;
  const gap = 4;
  const batX = rightMargin - batW;
  const wifiX = batX - gap - wifiW;
  const cellX = wifiX - gap - cellW;
  return `
  ${pixelSignalBars(fg, cellX, iconY, cellW, iconH)}
  <g color="${fg}">
    ${fitIcon(MD_WIFI, wifiX, iconY, wifiW, iconH, { cx: 0.36, cy: 3, cw: 23.28, ch: 18.49 })}
  </g>
  ${aospBatteryIcon(fg, batX, iconY, batW, iconH)}`;
}

/** Samsung One UI — wedge cellular + filled wifi fan + AOSP battery. */
function samsungRightCluster(fg, rightMargin, iconY, iconH) {
  const batW = 22;
  const wifiW = 17;
  const cellW = 17;
  const gap = 4;
  const batX = rightMargin - batW;
  const wifiX = batX - gap - wifiW;
  const cellX = wifiX - gap - cellW;
  return `
  <g color="${fg}">
    ${fitIcon(MD_CELL, cellX, iconY, cellW, iconH, { cx: 2, cy: 2, cw: 20, ch: 20 })}
    ${fitIcon(MD_WIFI, wifiX, iconY, wifiW, iconH, { cx: 0.36, cy: 3, cw: 23.28, ch: 18.49 })}
  </g>
  ${aospBatteryIcon(fg, batX, iconY, batW, iconH)}`;
}

function iosIslandSensors() {
  return `
  <circle cx="172" cy="29.5" r="4.2" fill="#0c0c0c" stroke="#222" stroke-width="0.65"/>
  <circle cx="172" cy="29.5" r="2.35" fill="#040404"/>
  <circle cx="171.2" cy="28.6" r="0.55" fill="#1a1a1a" opacity="0.35"/>
  <circle cx="216" cy="29.5" r="2.65" fill="#0c0c0c" stroke="#222" stroke-width="0.55"/>
  <circle cx="221.5" cy="29.5" r="2.65" fill="#0c0c0c" stroke="#222" stroke-width="0.55"/>`;
}

function iosNotchSensors() {
  return `
  <rect x="188" y="8.5" width="52" height="5.5" rx="2.75" fill="#111"/>
  <circle cx="168" cy="19.5" r="3.8" fill="#0c0c0c" stroke="#222" stroke-width="0.6"/>
  <circle cx="168" cy="19.5" r="2.1" fill="#040404"/>
  <circle cx="222" cy="19.5" r="2.5" fill="#0c0c0c" stroke="#222" stroke-width="0.5"/>
  <circle cx="227" cy="19.5" r="2.5" fill="#0c0c0c" stroke="#222" stroke-width="0.5"/>`;
}

function wrap(vbW, vbH, bg, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbW} ${vbH}" fill="none">
  <rect width="${vbW}" height="${vbH}" fill="${bg}"/>
  ${body}
</svg>
`;
}

function iosIsland(theme) {
  const dark = theme === 'dark';
  const fg = dark ? '#FFFFFF' : '#000000';
  const bg = dark ? '#000000' : '#FFFFFF';
  const W = 393;
  const iconY = 24;
  const iconH = 13;
  return wrap(W, 59, bg, `
  <rect x="133.5" y="11" width="126" height="37" rx="18.5" fill="#000000"/>
  ${iosIslandSensors()}
  <text x="27" y="38.2" fill="${fg}" font-family="-apple-system,BlinkMacSystemFont,'SF Pro Text','SF Pro Display',system-ui,sans-serif" font-size="17" font-weight="600" letter-spacing="-0.41">9:41</text>
  ${iosRightCluster(fg, W - 16, iconY, iconH)}`);
}

function iosNotch(theme) {
  const dark = theme === 'dark';
  const fg = dark ? '#FFFFFF' : '#000000';
  const bg = dark ? '#000000' : '#FFFFFF';
  const W = 390;
  const iconY = 19;
  const iconH = 12;
  return wrap(W, 47, bg, `
  <path d="M122 0 h146 a19 19 0 0 1 19 19 v11 a19 19 0 0 1-19 19 H122 a19 19 0 0 1-19-19 V19 a19 19 0 0 1 19-19z" fill="#000000"/>
  ${iosNotchSensors()}
  <text x="24" y="31.8" fill="${fg}" font-family="-apple-system,BlinkMacSystemFont,'SF Pro Text',system-ui,sans-serif" font-size="15" font-weight="600" letter-spacing="-0.32">9:41</text>
  ${iosRightCluster(fg, W - 16, iconY, iconH)}`);
}

function ipados(theme) {
  const dark = theme === 'dark';
  const fg = dark ? '#FFFFFF' : '#000000';
  const bg = dark ? '#000000' : '#FFFFFF';
  const W = 1024;
  const iconY = 6;
  const iconH = 12;
  const batX = W - 16 - 25;
  return wrap(W, 24, bg, `
  <text x="16" y="16.8" fill="${fg}" font-family="-apple-system,BlinkMacSystemFont,'SF Pro Text',system-ui,sans-serif" font-size="12" font-weight="600" letter-spacing="-0.2">9:41</text>
  <text x="62" y="16.8" fill="${fg}" font-family="-apple-system,BlinkMacSystemFont,'SF Pro Text',system-ui,sans-serif" font-size="12" font-weight="400">Mon Jun 9</text>
  <text x="${W - 52}" y="16.8" fill="${fg}" font-family="-apple-system,BlinkMacSystemFont,'SF Pro Text',system-ui,sans-serif" font-size="11" font-weight="500" text-anchor="end">100%</text>
  <g color="${fg}">
    ${fitIcon(IOS_WIFI, batX - 22, iconY, 15, iconH, { cx: 32, cy: 96, cw: 448, ch: 320 })}
  </g>
  ${iosBatteryIcon(fg, batX, iconY, 25, iconH, 1)}`);
}

function androidPixel(theme) {
  const dark = theme === 'dark';
  const fg = dark ? '#FFFFFF' : '#1C1B1F';
  const bg = dark ? '#000000' : '#FFFFFF';
  const W = 412;
  const iconY = 12;
  const iconH = 14;
  return wrap(W, 36, bg, `
  <text x="16" y="23.5" fill="${fg}" font-family="Roboto,'Google Sans',system-ui,sans-serif" font-size="14" font-weight="500" letter-spacing="0.1">9:30</text>
  ${pixelRightCluster(fg, W - 14, iconY, iconH)}`);
}

function androidSamsung(theme) {
  const dark = theme === 'dark';
  const fg = dark ? '#FFFFFF' : '#000000';
  const bg = dark ? '#000000' : '#FFFFFF';
  const W = 412;
  const iconY = 12;
  const iconH = 14;
  return wrap(W, 36, bg, `
  <text x="${W / 2}" y="23.5" fill="${fg}" font-family="Roboto,'SamsungOne',system-ui,sans-serif" font-size="14" font-weight="500" text-anchor="middle">9:30</text>
  ${samsungRightCluster(fg, W - 14, iconY, iconH)}`);
}

const profiles = {
  'ios-island': iosIsland,
  'ios-notch': iosNotch,
  ipados,
  'android-pixel': androidPixel,
  'android-samsung': androidSamsung,
};

fs.mkdirSync(outDir, { recursive: true });
for (const [name, fn] of Object.entries(profiles)) {
  for (const theme of ['dark', 'light']) {
    const file = path.join(outDir, `${name}-${theme}.svg`);
    fs.writeFileSync(file, fn(theme));
    console.log('wrote', path.relative(root, file));
  }
}
