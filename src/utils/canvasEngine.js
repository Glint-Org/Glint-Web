import { Canvas, FabricImage, Gradient, Text, Rect, Group, loadSVGFromString, util } from 'fabric';
import {
  getFrameMeta,
  computeFrameLayout,
  resolveDeviceScale,
  MIN_DEVICE_COVERAGE,
  DEFAULT_SCREENSHOT_STYLE,
} from './frameMeta';

export function createCanvas(container, width = 1080, height = 1920) {
  return new Canvas(container, {
    width,
    height,
    backgroundColor: '#ffffff',
    preserveObjectStacking: true,
    selection: true,
    uniformScaling: true,
  });
}

export function setBackground(canvas, type, value) {
  const w = canvas.getWidth();
  const h = canvas.getHeight();
  if (type === 'gradient') {
    canvas.backgroundColor = new Gradient({
      type: 'linear',
      coords: { x1: 0, y1: 0, x2: 0, y2: h },
      colorStops: value,
    });
  } else {
    canvas.backgroundColor = value;
  }
  canvas.requestRenderAll();
}

export function setSolidBackground(canvas, color) {
  canvas.backgroundColor = color;
  canvas.requestRenderAll();
}

/**
 * Bare screenshot with optional corner radius and stroke (no device bezel).
 */
export async function addStyledScreenshot(canvas, screenshotUrl, opts = {}) {
  const style = { ...DEFAULT_SCREENSHOT_STYLE, ...opts };
  const canvasW = canvas.getWidth();
  const canvasH = canvas.getHeight();
  const targetW = canvasW * style.scale;
  const targetH = canvasH * style.scale;

  const img = await FabricImage.fromURL(screenshotUrl, { crossOrigin: 'anonymous' });
  const cover = Math.max(targetW / (img.width || 1), targetH / (img.height || 1));
  const left = opts.left ?? (canvasW - targetW) / 2;
  const top = opts.top ?? canvasH * 0.18;

  img.set({
    scaleX: cover,
    scaleY: cover,
    left: left + targetW / 2,
    top: top + targetH / 2,
    originX: 'center',
    originY: 'center',
    selectable: false,
    evented: false,
  });

  if (style.cornerRadius > 0) {
    img.set({
      clipPath: new Rect({
        width: targetW,
        height: targetH,
        rx: style.cornerRadius,
        ry: style.cornerRadius,
        originX: 'center',
        originY: 'center',
      }),
    });
  }

  const items = [img];

  if (style.strokeWidth > 0) {
    const border = new Rect({
      width: targetW,
      height: targetH,
      rx: style.cornerRadius,
      ry: style.cornerRadius,
      fill: 'transparent',
      stroke: style.strokeColor,
      strokeWidth: style.strokeWidth,
      left: left + targetW / 2,
      top: top + targetH / 2,
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
    });
    items.unshift(border);
  }

  const group = new Group(items, {
    left,
    top,
    originX: 'left',
    originY: 'top',
    selectable: opts.selectable !== false,
    evented: opts.selectable !== false,
    glintRole: 'screenshot',
  });

  canvas.add(group);
  canvas.requestRenderAll();
  return group;
}

export async function loadFrameSvg(frameId) {
  const res = await fetch(`/frames/${frameId}.svg`);
  if (!res.ok) throw new Error(`Frame not found: ${frameId}`);
  return res.text();
}

/**
 * Cover-fit a screenshot into an exact screen-sized bitmap (white + clipped image).
 * Avoids Fabric clipPath/group bbox leaks that paint past the bezel.
 */
async function buildScreenBitmap(screenshotUrl, screenW, screenH, rx) {
  const w = Math.max(1, Math.round(screenW));
  const h = Math.max(1, Math.round(screenH));
  const r = Math.max(0, Math.min(rx, w / 2, h / 2));

  const src = await FabricImage.fromURL(screenshotUrl, { crossOrigin: 'anonymous' });
  const el = src.getElement?.() || src._element;
  const iw = el?.naturalWidth || el?.width || src.width || 1;
  const ih = el?.naturalHeight || el?.height || src.height || 1;
  const cover = Math.max(w / iw, h / ih);
  const dw = iw * cover;
  const dh = ih * cover;
  const dx = (w - dw) / 2;
  const dy = (h - dh) / 2;

  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const ctx = off.getContext('2d');
  // Rounded screen hole
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(0, 0, w, h, r);
  } else {
    ctx.moveTo(r, 0);
    ctx.arcTo(w, 0, w, h, r);
    ctx.arcTo(w, h, 0, h, r);
    ctx.arcTo(0, h, 0, 0, r);
    ctx.arcTo(0, 0, w, 0, r);
    ctx.closePath();
  }
  ctx.clip();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  if (el) ctx.drawImage(el, dx, dy, dw, dh);

  const fitted = await FabricImage.fromURL(off.toDataURL('image/png'));
  fitted.set({
    left: 0,
    top: 0,
    originX: 'left',
    originY: 'top',
    scaleX: 1,
    scaleY: 1,
    selectable: false,
    evented: false,
  });
  return fitted;
}

/**
 * Lock device transforms: uniform size only + free rotate/move.
 * Edge stretch handles are hidden so aspect ratio cannot be broken.
 */
export function applyDeviceTransformLocks(group) {
  if (!group) return group;
  group.set({
    lockSkewingX: true,
    lockSkewingY: true,
    lockScalingFlip: true,
    lockRotation: false,
    lockMovementX: false,
    lockMovementY: false,
  });
  group.setControlsVisibility?.({
    mt: false,
    mb: false,
    ml: false,
    mr: false,
    mtr: true,
  });
  if (!group.__glintUniformScaleBound) {
    group.__glintUniformScaleBound = true;
    const enforceUniform = function enforceUniform() {
      const sx = Math.abs(this.scaleX || 1);
      const sy = Math.abs(this.scaleY || 1);
      const s = Math.max(sx, sy) || 1;
      if (Math.abs(sx - s) > 1e-4 || Math.abs(sy - s) > 1e-4) {
        this.set({ scaleX: s, scaleY: s });
      }
    };
    group.on('scaling', enforceUniform);
    group.on('modified', enforceUniform);
  }
  return group;
}

/**
 * Swap the screenshot inside a framed device without resetting position/rotation/size.
 */
export async function replaceDeviceScreenshot(group, screenshotUrl) {
  if (!group || group.glintRole !== 'framed-screenshot' || !screenshotUrl) return false;
  const frameId = group.glintFrameId || 'pixel7';
  const baseScale = group.glintBaseScale ?? 0.55;
  const { insetL, insetT, screenW, screenH, rx } = computeFrameLayout(frameId, baseScale);
  const newScreen = await buildScreenBitmap(screenshotUrl, screenW, screenH, rx);
  newScreen.set({
    left: insetL,
    top: insetT,
    selectable: false,
    evented: false,
  });

  const kids = group.getObjects?.() || [];
  const oldScreen = kids[0];
  if (oldScreen) {
    group.remove(oldScreen);
    oldScreen.dispose?.();
  }
  if (typeof group.insertAt === 'function') {
    group.insertAt(0, newScreen);
  } else {
    group.add(newScreen);
    group.moveObjectTo?.(newScreen, 0);
  }

  group.set({ dirty: true });
  group.setCoords?.();
  group.canvas?.requestRenderAll?.();
  return true;
}

/**
 * Composite screenshot inside device frame.
 * Screen content is a fixed-size bitmap fitted to the hole; bezel sits on top.
 * Moving the device never lets the image spill outside the frame.
 */
export async function addFramedScreenshot(canvas, screenshotUrl, frameId, opts = {}) {
  const targetScale = opts.scale ?? 0.55;
  const { frameW, frameH, insetL, insetT, screenW, screenH, rx } = computeFrameLayout(frameId, targetScale);
  const meta = getFrameMeta(frameId);

  const screenImg = await buildScreenBitmap(screenshotUrl, screenW, screenH, rx);
  screenImg.set({
    left: insetL,
    top: insetT,
  });

  const svg = await loadFrameSvg(frameId);
  const { objects, options } = await loadSVGFromString(svg);
  const frame = util.groupSVGElements(objects, options);
  frame.set({
    scaleX: frameW / meta.width,
    scaleY: frameH / meta.height,
    left: 0,
    top: 0,
    originX: 'left',
    originY: 'top',
    selectable: false,
    evented: false,
  });

  const group = new Group([screenImg, frame], {
    left: opts.left ?? 0,
    top: opts.top ?? 0,
    originX: 'left',
    originY: 'top',
    selectable: opts.selectable !== false,
    evented: opts.selectable !== false,
    subTargetCheck: false,
    objectCaching: true,
    glintRole: 'framed-screenshot',
    glintFrameId: frameId,
    glintBaseScale: targetScale,
  });

  applyDeviceTransformLocks(group);

  canvas.add(group);
  canvas.requestRenderAll();
  return group;
}

export function addTextOverlay(canvas, text, opts = {}) {
  const fb = new Text(text || 'Double-click to edit', {
    left: opts.left ?? canvas.getWidth() / 2,
    top: opts.top ?? 120,
    fontSize: opts.fontSize ?? 48,
    fontFamily: `${opts.fontFamily || 'Inter'}, sans-serif`,
    fontWeight: opts.fontWeight ?? '700',
    fill: opts.fill ?? '#ffffff',
    textAlign: opts.textAlign ?? 'center',
    originX: opts.originX ?? 'center',
    selectable: true,
    evented: true,
    editable: true,
    glintRole: 'text',
    ...opts,
  });
  canvas.add(fb);
  canvas.setActiveObject(fb);
  canvas.requestRenderAll();
  return fb;
}

export function deleteActiveObjects(canvas) {
  const active = canvas.getActiveObjects();
  if (!active.length) return;
  active.forEach((obj) => canvas.remove(obj));
  canvas.discardActiveObject();
  canvas.requestRenderAll();
}

export function exportAsPNG(canvas) {
  return canvas.toDataURL({ format: 'png', multiplier: 1 });
}

export function clearCanvas(canvas) {
  canvas.clear();
  canvas.backgroundColor = '#ffffff';
  canvas.requestRenderAll();
}

/** Compute centered frame placement for store canvas (coverage = fraction of frame). */
export function computeCenteredFramePlacement(frameId, canvasW, canvasH, coverage = MIN_DEVICE_COVERAGE) {
  const scale = resolveDeviceScale(frameId, canvasW, canvasH, coverage);
  const { frameW, frameH } = computeFrameLayout(frameId, scale);
  return {
    scale,
    left: (canvasW - frameW) / 2,
    top: canvasH * 0.18,
  };
}

/**
 * Render a single scratch frame for batch export.
 */
export async function renderScratchFrame({
  screenshotUrl,
  background,
  frameId,
  screenshotStyle,
  text,
  width = 1080,
  height = 1920,
}) {
  const el = document.createElement('canvas');
  const canvas = createCanvas(el, width, height);
  try {
    if (background) setBackground(canvas, background.type, background.value);
    else setSolidBackground(canvas, '#1C1C1E');

    if (screenshotUrl && frameId) {
      const { scale, left, top } = computeCenteredFramePlacement(frameId, width, height);
      await addFramedScreenshot(canvas, screenshotUrl, frameId, { scale, left, top, selectable: false });
    } else if (screenshotUrl) {
      await addStyledScreenshot(canvas, screenshotUrl, {
        ...screenshotStyle,
        left: (width - width * (screenshotStyle?.scale ?? 0.58)) / 2,
        top: height * 0.18,
        selectable: false,
      });
    }

    if (text) {
      addTextOverlay(canvas, text, { top: 100, left: width / 2, selectable: false });
    }

    canvas.requestRenderAll();
    return canvas.toDataURL({ format: 'png', multiplier: 1 });
  } finally {
    canvas.dispose();
  }
}
