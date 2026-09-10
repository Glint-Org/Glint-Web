/**
 * Fabric copies lower-canvas className + cssText onto the upper canvas at create.
 * pointer-events-none on the React <canvas> permanently blocks the upper hit layer.
 */

export function unlockCanvasPointerEvents(canvas) {
  if (!canvas) return;
  const els = [canvas.lowerCanvasEl, canvas.upperCanvasEl, canvas.wrapperEl, canvas.container].filter(Boolean);
  els.forEach((el) => {
    el.classList?.remove('pointer-events-none');
    if (el.style) el.style.pointerEvents = '';
  });
}

export function setCanvasPaintVisibility(canvas, visible) {
  if (!canvas) return;
  const opacity = visible ? '' : '0';
  [canvas.lowerCanvasEl, canvas.upperCanvasEl].filter(Boolean).forEach((el) => {
    if (el.style) el.style.opacity = opacity;
  });
  if (visible) unlockCanvasPointerEvents(canvas);
}
