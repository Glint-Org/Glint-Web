/**
 * Fit board zoom (%) so frames sit in the visible area between sidebars.
 */
/** Zoom-aware board spacing — gap scales with displayed frame size. */
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
  minZoom = 8,
  maxZoom = 48,
} = {}) {
  const n = Math.max(1, frameCount);
  const availW = Math.max(160, (boardWidth || 0) - padX);
  const availH = Math.max(160, (boardHeight || 0) - padY);
  if (!canvasWidth || !canvasHeight) return 16;

  const totalGaps = gap * Math.max(0, n - 1);
  const scaleByH = availH / canvasHeight;
  const scaleByW = (availW - totalGaps) / (canvasWidth * n);
  const scale = Math.min(scaleByH, scaleByW);
  return Math.min(maxZoom, Math.max(minZoom, Math.round(scale * 1000) / 10));
}

export function clampBoardZoom(z, minZoom = 8, maxZoom = 48) {
  return Math.min(maxZoom, Math.max(minZoom, z));
}
