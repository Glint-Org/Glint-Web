/** Sample a CSS hex color from a Fabric canvas at viewport coordinates. */
export function sampleFabricAtClient(canvas, clientX, clientY) {
  const el = canvas?.lowerCanvasEl;
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  if (
    clientX < rect.left ||
    clientX > rect.right ||
    clientY < rect.top ||
    clientY > rect.bottom ||
    rect.width <= 0 ||
    rect.height <= 0
  ) {
    return null;
  }
  const x = Math.min(
    el.width - 1,
    Math.max(0, Math.floor(((clientX - rect.left) / rect.width) * el.width)),
  );
  const y = Math.min(
    el.height - 1,
    Math.max(0, Math.floor(((clientY - rect.top) / rect.height) * el.height)),
  );
  try {
    const ctx = el.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    const [r, g, b, a] = ctx.getImageData(x, y, 1, 1).data;
    if (a === 0) return null;
    return rgbToHex(r, g, b);
  } catch {
    return null;
  }
}

export function rgbToHex(r, g, b) {
  const c = (n) => Math.max(0, Math.min(255, n | 0)).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

/**
 * Figma-style eyedropper over editor canvases.
 * Move to sample; click to confirm; Esc / right-click to cancel.
 * @returns {Promise<string|null>} hex or null if cancelled
 */
export function openCanvasEyedropper({ getCanvases }) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.setAttribute('data-glint-eyedropper', '1');
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:99999;cursor:crosshair;background:transparent;';

    const loupe = document.createElement('div');
    loupe.style.cssText =
      'position:fixed;width:88px;height:88px;border-radius:50%;border:2px solid #F5D06F;box-shadow:0 8px 24px rgba(0,0,0,.45),inset 0 0 0 1px rgba(0,0,0,.2);pointer-events:none;overflow:hidden;display:none;background:#0B0D10;';

    const swatch = document.createElement('div');
    swatch.style.cssText =
      'position:fixed;left:0;top:0;transform:translate(-50%,12px);padding:4px 8px;border-radius:8px;font:11px/1.2 ui-monospace,monospace;color:#E8E6DF;background:#151A21;border:1px solid rgba(255,255,255,.16);pointer-events:none;display:none;white-space:nowrap;';

    const hint = document.createElement('div');
    hint.textContent = 'Click to pick · Esc to cancel';
    hint.style.cssText =
      'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);padding:8px 14px;border-radius:999px;font:12px/1.2 system-ui,sans-serif;color:#412402;background:#F5D06F;pointer-events:none;box-shadow:0 4px 16px rgba(0,0,0,.3);';

    document.body.append(overlay, loupe, swatch, hint);

    let current = null;
    let done = false;

    const finish = (hex) => {
      if (done) return;
      done = true;
      window.removeEventListener('keydown', onKey, true);
      overlay.remove();
      loupe.remove();
      swatch.remove();
      hint.remove();
      resolve(hex);
    };

    const sampleAt = (clientX, clientY) => {
      const canvases = (typeof getCanvases === 'function' ? getCanvases() : getCanvases) || [];
      for (const c of canvases) {
        const hex = sampleFabricAtClient(c, clientX, clientY);
        if (hex) return hex;
      }
      return null;
    };

    const onMove = (e) => {
      const hex = sampleAt(e.clientX, e.clientY);
      current = hex;
      loupe.style.display = 'block';
      loupe.style.left = `${e.clientX + 18}px`;
      loupe.style.top = `${e.clientY + 18}px`;
      loupe.style.background = hex || '#0B0D10';
      swatch.style.display = 'block';
      swatch.style.left = `${e.clientX}px`;
      swatch.style.top = `${e.clientY + 110}px`;
      swatch.textContent = hex || 'Move over canvas';
    };

    const onClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.button === 2) {
        finish(null);
        return;
      }
      const hex = sampleAt(e.clientX, e.clientY) || current;
      finish(hex);
    };

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        finish(null);
      }
    };

    overlay.addEventListener('mousemove', onMove);
    overlay.addEventListener('mousedown', onClick);
    overlay.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      finish(null);
    });
    window.addEventListener('keydown', onKey, true);
  });
}
