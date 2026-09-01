/**
 * Board scale (%) — zoom out fits all frames; zoom in caps at ~2.5 frames visible.
 */
export const BOARD_FIT_MIN = 8;
export const BOARD_FIT_MAX = 100;
/** Max zoom in: viewport sized for this many frame widths. */
export const BOARD_ZOOM_IN_FRAMES = 2.5;
/** Controls + labels above/below the canvas (px). */
export const FRAME_COLUMN_CHROME = 88;

/** Gap scales with displayed frame width. */
export function boardFrameGap(displayFrameW, minGap = 4, maxGap = 20) {
  const w = Math.max(1, displayFrameW || 1);
  return Math.min(maxGap, Math.max(minGap, Math.round(w * 0.035)));
}

export function computeBoardFitZoom({
  boardWidth,
  boardHeight,
  canvasWidth,
  canvasHeight,
  frameCount = 1,
  gap = 12,
  padX = 32,
  padY = 48,
  frameChrome = FRAME_COLUMN_CHROME,
  minZoom = BOARD_FIT_MIN,
  maxZoom = BOARD_FIT_MAX,
} = {}) {
  const n = Math.max(1, frameCount);
  const availW = Math.max(160, (boardWidth || 0) - padX);
  const availH = Math.max(160, (boardHeight || 0) - padY);
  if (!canvasWidth || !canvasHeight) return 20;

  const totalGaps = gap * Math.max(0, n - 1);
  const scaleByH = Math.max(0, availH - frameChrome) / canvasHeight;
  const scaleByW = (availW - totalGaps) / (canvasWidth * n);
  const scale = Math.min(scaleByH, scaleByW);
  return Math.min(maxZoom, Math.max(minZoom, Math.round(scale * 1000) / 10));
}

/** Zoom-out floor (all frames) and zoom-in ceiling (~2.5 frames). */
export function computeBoardZoomBounds(params = {}) {
  const n = Math.max(1, params.frameCount ?? 1);
  const fitAll = computeBoardFitZoom(params);
  const zoomInFrames = Math.min(n, BOARD_ZOOM_IN_FRAMES);
  const maxZoomIn = computeBoardFitZoom({ ...params, frameCount: zoomInFrames });
  return {
    minScale: Math.min(fitAll, maxZoomIn),
    maxScale: Math.max(fitAll, maxZoomIn),
  };
}

export function clampBoardScale(scale, minScale, maxScale) {
  return Math.min(maxScale, Math.max(minScale, scale));
}

export function stepBoardScale(scale, factor, minScale, maxScale) {
  return clampBoardScale(Math.round(scale * factor * 10) / 10, minScale, maxScale);
}
