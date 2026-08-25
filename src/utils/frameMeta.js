/** Screen insets for curated device frames only (`public/frames/*.svg`). */
export const FRAME_INSETS = {
  pixel9: { top: 12, right: 12, bottom: 12, left: 12, rx: 26, width: 412, height: 915 },
  'galaxy-s24': { top: 12, right: 12, bottom: 12, left: 12, rx: 30, width: 360, height: 780 },
  'iphone16-pro': { top: 12, right: 12, bottom: 12, left: 12, rx: 44, width: 393, height: 852 },
  'iphone16-pro-max': { top: 14, right: 16, bottom: 14, left: 16, rx: 48, width: 430, height: 932 },
  'ipad-pro-13': { top: 30, right: 30, bottom: 30, left: 30, rx: 18, width: 1024, height: 1366 },
  'ipad-pro': { top: 28, right: 28, bottom: 28, left: 28, rx: 16, width: 834, height: 1194 },
};

/** Fallback when an unknown frame id is requested. */
const DEFAULT_FRAME = 'pixel9';

/** Minimum device size as a fraction of the store frame (canvas). */
export const MIN_DEVICE_COVERAGE = 0.6;
export const MAX_DEVICE_COVERAGE = 0.92;

export function getFrameMeta(frameId) {
  return FRAME_INSETS[frameId] || FRAME_INSETS[DEFAULT_FRAME];
}

/**
 * Convert canvas coverage (e.g. 0.6 = 60% of frame) into SVG unit scale.
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

/** Default screenshot styling when no device frame is used. */
export const DEFAULT_SCREENSHOT_STYLE = {
  cornerRadius: 24,
  strokeWidth: 0,
  strokeColor: '#FFFFFF',
  scale: 0.58,
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
