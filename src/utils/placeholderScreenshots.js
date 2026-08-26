/** Solid white placeholder screens for device frames (easy to swap / read). */

const W = 1080;
const H = 1920;

let whiteUrl = null;

function makeWhiteScreenshot() {
  if (typeof document === 'undefined') return '';
  if (whiteUrl) return whiteUrl;
  const el = document.createElement('canvas');
  el.width = W;
  el.height = H;
  const ctx = el.getContext('2d');
  if (!ctx) return '';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);
  whiteUrl = el.toDataURL('image/png');
  return whiteUrl;
}

/** Returns `count` white data-URL placeholders. */
export function getPlaceholderScreenshots(count = 5) {
  const url = makeWhiteScreenshot();
  return Array.from({ length: count }, () => url);
}

/** Fill missing slots with white placeholders; keep user URLs first. */
export function fillScreenshotSlots(userUrls = [], needed = 5) {
  const placeholders = getPlaceholderScreenshots(needed);
  const out = [];
  for (let i = 0; i < needed; i++) {
    out.push(userUrls[i] || placeholders[i]);
  }
  return out;
}

/** Single white screen URL (for reset / empty slots). */
export function getWhiteScreenshot() {
  return makeWhiteScreenshot();
}
