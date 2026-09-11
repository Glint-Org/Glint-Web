/**
 * Editor undo/redo - snapshot frames, template, and editor chrome.
 */

import { GLINT_CLONE_PROPS } from '../utils/glintCloneProps';

const MAX_HISTORY = 40;

export function exportCanvasJson(canvas) {
  if (!canvas) return null;
  try {
    if (typeof canvas.toJSON === 'function') {
      return canvas.toJSON(GLINT_CLONE_PROPS);
    }
    if (typeof canvas.toObject === 'function') {
      return canvas.toObject(GLINT_CLONE_PROPS);
    }
  } catch {
    return null;
  }
  return null;
}

export function captureEditorSnapshot({
  frames = [],
  template = null,
  background = null,
  deviceFrame = null,
  screenshotStyle = null,
  fontFamily = null,
  canvasMap = {},
} = {}) {
  const stamp = Date.now();
  return {
    frames: frames.map((f, i) => ({
      id: f.id,
      design: f.design ? JSON.parse(JSON.stringify(f.design)) : null,
      screenshotUrl: f.screenshotUrl,
      fabricJson: exportCanvasJson(canvasMap[f.id]) ?? f.fabricJson ?? null,
      fabricRestoreKey: `hist-${stamp}-${i}`,
    })),
    template: template ? JSON.parse(JSON.stringify(template)) : null,
    background: background ? { ...background } : null,
    deviceFrame,
    screenshotStyle: screenshotStyle ? { ...screenshotStyle } : null,
    fontFamily,
  };
}

export function createEditorHistory() {
  const past = [];
  const future = [];

  return {
    push(snapshot) {
      if (!snapshot) return;
      past.push(snapshot);
      if (past.length > MAX_HISTORY) past.shift();
      future.length = 0;
    },
    undo(current) {
      if (!past.length) return null;
      if (current) future.push(current);
      return past.pop();
    },
    redo(current) {
      if (!future.length) return null;
      if (current) past.push(current);
      return future.pop();
    },
    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0,
    clear() {
      past.length = 0;
      future.length = 0;
    },
  };
}
