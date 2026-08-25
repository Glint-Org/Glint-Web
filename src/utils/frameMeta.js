/**
 * Screen insets for curated device frames (`public/frames/*`).
 * Photo-real PNGs use native pixel sizes from device-frames-media template.json.
 * `ext`: asset extension. `rx`: screen corner radius in frame pixels.
 */
export const FRAME_INSETS = {
  pixel9: {
    ext: 'png',
    top: 142,
    right: 170,
    bottom: 138,
    left: 170,
    rx: 90,
    width: 1620,
    height: 3136,
  },
  'galaxy-s24': {
    ext: 'png',
    top: 200,
    right: 200,
    bottom: 200,
    left: 200,
    rx: 80,
    width: 1480,
    height: 2800,
  },
  'iphone16-pro': {
    ext: 'png',
    top: 100,
    right: 98,
    bottom: 100,
    left: 102,
    rx: 100,
    width: 1406,
    height: 2822,
  },
  'iphone16-pro-max': {
    ext: 'png',
    top: 100,
    right: 100,
    bottom: 100,
    left: 100,
    rx: 105,
    width: 1520,
    height: 3068,
  },
  'ipad-pro-13': {
    ext: 'png',
    top: 100,
    right: 100,
    bottom: 100,
    left: 100,
    rx: 55,
    width: 2264,
    height: 2952,
  },
  'ipad-pro': {
    ext: 'png',
    top: 100,
    right: 101,
    bottom: 100,
    left: 99,
    rx: 50,
    width: 1868,
    height: 2620,
  },
  /** Matches Blink/BoxLock Figma bezel (975x1966, rx ~82). */
  'simple-dark': {
    ext: 'svg',
    top: 25,
    right: 25,
    bottom: 25,
    left: 25,
    rx: 62,
    width: 975,
    height: 1966,
  },
  /** iPhone 14 Pro Max with soft drop shadow (dimensional). */
  'phone-3d': {
    ext: 'png',
    top: 100,
    right: 99,
    bottom: 100,
    left: 101,
    rx: 100,
    width: 1490,
    height: 2996,
  },
  /** iPad Pro 13 photo-real bezel. */
  'tablet-3d': {
    ext: 'png',
    top: 100,
    right: 100,
    bottom: 100,
    left: 100,
    rx: 55,
    width: 2264,
    height: 2952,
  },
};

/** Fallback when an unknown frame id is requested. */
const DEFAULT_FRAME = 'pixel9';

/** Minimum device size as a fraction of the store frame (canvas). */
export const MIN_DEVICE_COVERAGE = 0.6;
export const MAX_DEVICE_COVERAGE = 0.92;

export function getFrameMeta(frameId) {
  return FRAME_INSETS[frameId] || FRAME_INSETS[DEFAULT_FRAME];
}

/** Public URL for a curated frame asset. */
export function getFrameSrc(frameId) {
  const meta = getFrameMeta(frameId);
  const ext = meta.ext || 'png';
  return `/frames/${frameId}.${ext}`;
}

/**
 * Convert canvas coverage (e.g. 0.6 = 60% of frame) into SVG/PNG unit scale.
 * Device keeps aspect ratio; size is limited by the tighter canvas axis.
 */
export function resolveDeviceScale(
  frameId,
  canvasW,
  canvasH,
  coverage = MIN_DEVICE_COVERAGE,
  { minCoverage = MIN_DEVICE_COVERAGE, maxCoverage = MAX_DEVICE_COVERAGE } = {},
) {
  const meta = getFrameMeta(frameId);
  const fraction = Math.min(
    maxCoverage,
    Math.max(minCoverage, coverage ?? minCoverage),
  );
  return Math.min((canvasW * fraction) / meta.width, (canvasH * fraction) / meta.height);
}

/** Default chrome for screenshots (no bezel) and drop shadow (any device). */
export const DEFAULT_SCREENSHOT_STYLE = {
  cornerRadius: 28,
  strokeWidth: 0,
  strokeColor: '#FFFFFF',
  scale: 0.58,
  /** Drop shadow — works on framed devices and bare screenshots. */
  shadowEnabled: true,
  shadowBlur: 36,
  shadowOffsetX: 0,
  shadowOffsetY: 22,
  shadowOpacity: 0.4,
  shadowColor: '#000000',
};

export function computeFrameLayout(frameId, targetScale) {
  const meta = getFrameMeta(frameId);
  const frameW = meta.width * targetScale;
  const frameH = meta.height * targetScale;
  const insetL = meta.left * targetScale;
  const insetT = meta.top * targetScale;
  const insetR = meta.right * targetScale;
  const insetB = meta.bottom * targetScale;
  const screenW = frameW - insetL - insetR;
  const screenH = frameH - insetT - insetB;
  const rx = meta.rx * targetScale;
  return { meta, frameW, frameH, insetL, insetT, screenW, screenH, rx };
}
