import { Canvas, FabricImage, Gradient, IText, Rect, Group, Shadow, LayoutManager, FixedLayout, loadSVGFromString, util } from 'fabric';
import {
  getFrameMeta,
  computeFrameLayout,
  resolveDeviceScale,
  MIN_DEVICE_COVERAGE,
  DEFAULT_SCREENSHOT_STYLE,
} from './frameMeta';
import { GLINT_CLONE_PROPS } from './glintCloneProps';

export { GLINT_CLONE_PROPS } from './glintCloneProps';

/** Build a Fabric Shadow from screenshot chrome style (or null when off). */
export function buildChromeShadow(style = {}) {
  const s = { ...DEFAULT_SCREENSHOT_STYLE, ...style };
  if (!s.shadowEnabled || !(s.shadowBlur > 0)) return null;
  const opacity = Math.min(1, Math.max(0, s.shadowOpacity ?? 0.4));
  const hex = (s.shadowColor || '#000000').replace('#', '');
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex.padEnd(6, '0');
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  return new Shadow({
    color: `rgba(${r},${g},${b},${opacity})`,
    blur: s.shadowBlur,
    offsetX: s.shadowOffsetX ?? 0,
    offsetY: s.shadowOffsetY ?? 0,
  });
}

export function applyChromeShadow(obj, style = {}) {
  if (!obj) return obj;
  const merged = { ...DEFAULT_SCREENSHOT_STYLE, ...(obj.glintChrome || {}), ...style };
  obj.set('shadow', buildChromeShadow(merged));
  obj.set({ glintChrome: merged });
  obj.setCoords?.();
  obj.canvas?.requestRenderAll?.();
  return obj;
}

export function createCanvas(container, width = 1080, height = 1920) {
  return new Canvas(container, {
    width,
    height,
    backgroundColor: '#ffffff',
    preserveObjectStacking: true,
    selection: true,
    uniformScaling: true,
    selectionColor: 'rgba(245, 208, 111, 0.12)',
    selectionBorderColor: '#F5D06F',
    selectionLineWidth: 2,
  });
}

/** Accent selection chrome so selected canvas layers are obvious. */
export function applySelectionStyle(obj) {
  if (!obj) return obj;
  obj.set({
    borderColor: '#F5D06F',
    cornerColor: '#F5D06F',
    cornerStrokeColor: '#1C1C1E',
    cornerStyle: 'circle',
    transparentCorners: false,
    borderScaleFactor: 2.5,
    padding: 4,
  });
  return obj;
}

/** Copy Glint metadata after Fabric clone (clone alone drops custom fields). */
export function copyGlintProps(from, to) {
  if (!from || !to) return to;
  for (const key of GLINT_CLONE_PROPS) {
    if (from[key] !== undefined) to[key] = from[key];
  }
  return to;
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
 * Cover-fit a screenshot into an exact screen-sized bitmap (white fill + clipped image).
 * Guarantees the hole is fully opaque white where the shot doesn't cover, and the shot
 * always completely fills the frame (object-fit: cover).
 */
async function buildScreenBitmap(screenshotUrl, screenW, screenH, rx) {
  const w = Math.max(1, Math.round(screenW));
  const h = Math.max(1, Math.round(screenH));
  const r = Math.max(0, Math.min(rx || 0, w / 2, h / 2));

  const src = await FabricImage.fromURL(screenshotUrl, { crossOrigin: 'anonymous' });
  const el = src.getElement?.() || src._element;
  const iw = Math.max(1, el?.naturalWidth || el?.width || src.width || 1);
  const ih = Math.max(1, el?.naturalHeight || el?.height || src.height || 1);
  const cover = Math.max(w / iw, h / ih);
  const dw = iw * cover;
  const dh = ih * cover;
  const dx = (w - dw) / 2;
  const dy = (h - dh) / 2;

  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const ctx = off.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Full white fill first (letterbox / pillarbox areas stay white).
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  // Rounded clip, then cover-draw the screenshot.
  ctx.save();
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
  ctx.restore();

  // Soft outer mask so corners stay transparent outside the round rect (for bare frames).
  if (r > 0) {
    ctx.globalCompositeOperation = 'destination-in';
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
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

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
  src.dispose?.();
  return fitted;
}

/** Default phone aspect for bare (no-bezel) screenshot frames. */
const BARE_SCREEN_ASPECT = 9 / 19.5;

/**
 * Bare screenshot: white-filled rounded frame + cover-fit shot + optional border stroke.
 * Uses the same bitmap pipeline as device screens so imports always fill correctly.
 */
export async function addStyledScreenshot(canvas, screenshotUrl, opts = {}) {
  const style = { ...DEFAULT_SCREENSHOT_STYLE, ...opts };
  const canvasW = canvas.getWidth();
  const canvasH = canvas.getHeight();
  const aspect = opts.aspect ?? BARE_SCREEN_ASPECT;

  let targetW = opts.targetW;
  let targetH = opts.targetH;
  if (!(targetW > 0) || !(targetH > 0)) {
    targetH = canvasH * (style.scale ?? 0.58);
    targetW = targetH * aspect;
    if (targetW > canvasW * 0.92) {
      targetW = canvasW * 0.92;
      targetH = targetW / aspect;
    }
  }

  const left = opts.left ?? (canvasW - targetW) / 2;
  const top = opts.top ?? canvasH * 0.14;
  const rx = Math.max(0, Math.min(style.cornerRadius ?? 0, targetW / 2, targetH / 2));

  // White fill + cover-fit screenshot (exact frame size).
  const screenImg = await buildScreenBitmap(screenshotUrl, targetW, targetH, rx);
  screenImg.set({ left: 0, top: 0, originX: 'left', originY: 'top' });

  const strokeW = Math.max(0, style.strokeWidth ?? 0);
  // Always attach a border ring — invisible when width is 0 — so the frame edge stays defined.
  const border = new Rect({
    left: 0,
    top: 0,
    width: targetW,
    height: targetH,
    rx,
    ry: rx,
    fill: 'transparent',
    stroke: strokeW > 0 ? (style.strokeColor || '#FFFFFF') : 'rgba(0,0,0,0)',
    strokeWidth: strokeW,
    strokeUniform: true,
    originX: 'left',
    originY: 'top',
    selectable: false,
    evented: false,
  });

  const group = new Group([screenImg, border], {
    left,
    top,
    originX: 'left',
    originY: 'top',
    selectable: opts.selectable !== false,
    evented: opts.selectable !== false,
    subTargetCheck: false,
    objectCaching: true,
    layoutManager: new LayoutManager(new FixedLayout()),
    glintRole: 'screenshot',
    glintScreenshotUrl: screenshotUrl,
    glintChrome: style,
    glintTargetW: targetW,
    glintTargetH: targetH,
  });

  applyChromeShadow(group, style);
  applyDeviceTransformLocks(group);

  canvas.add(group);
  canvas.requestRenderAll();
  return group;
}

/**
 * Strip a device bezel → styled screenshot at the same center (keeps shot + chrome).
 * Target size matches the previous screen hole so the shot still fills the frame.
 */
export async function stripDeviceFrame(group, style = {}) {
  if (!group || group.glintRole !== 'framed-screenshot') return false;
  const canvas = group.canvas;
  const screenshotUrl = group.glintScreenshotUrl;
  if (!canvas || !screenshotUrl) return false;

  const chrome = { ...DEFAULT_SCREENSHOT_STYLE, ...(group.glintChrome || {}), ...style };
  const center = typeof group.getCenterPoint === 'function'
    ? group.getCenterPoint()
    : {
        x: (group.left || 0) + ((group.width || 0) * (group.scaleX || 1)) / 2,
        y: (group.top || 0) + ((group.height || 0) * (group.scaleY || 1)) / 2,
      };
  const angle = group.angle || 0;
  const slot = group.glintSlot;
  const slide = group.glintSlide;
  const selectable = group.selectable !== false;
  const uniform = Math.max(Math.abs(group.scaleX || 1), Math.abs(group.scaleY || 1));

  const frameId = group.glintFrameId || 'pixel9';
  const baseScale = group.glintBaseScale ?? 0.55;
  const { screenW, screenH } = computeFrameLayout(frameId, baseScale);
  const targetW = screenW * uniform;
  const targetH = screenH * uniform;
  const left = center.x - targetW / 2;
  const top = center.y - targetH / 2;

  const next = await addStyledScreenshot(canvas, screenshotUrl, {
    ...chrome,
    targetW,
    targetH,
    aspect: targetW / targetH,
    left,
    top,
    selectable,
  });
  if (!next) return false;

  next.set({
    angle,
    glintSlot: slot,
    glintSlide: slide,
    glintScreenshotUrl: screenshotUrl,
  });
  applyDeviceTransformLocks(next);
  next.setCoords?.();

  canvas.remove(group);
  group.dispose?.();
  canvas.requestRenderAll();
  return true;
}

/**
 * Update bare-screenshot border stroke in place (no bitmap rebuild).
 */
function applyBareBorderStroke(group, chrome) {
  const kids = group.getObjects?.() || [];
  const border = kids.find((o) => o.type === 'rect') || kids[1];
  if (!border || typeof border.set !== 'function') return false;
  const strokeW = Math.max(0, chrome.strokeWidth ?? 0);
  const tw = group.glintTargetW || group.width || 0;
  const th = group.glintTargetH || group.height || 0;
  const rx = Math.max(0, Math.min(chrome.cornerRadius ?? 0, tw / 2, th / 2));
  border.set({
    strokeWidth: strokeW,
    stroke: strokeW > 0 ? (chrome.strokeColor || '#FFFFFF') : 'rgba(0,0,0,0)',
    rx,
    ry: rx,
    dirty: true,
  });
  group.set({ dirty: true, glintChrome: chrome });
  border.setCoords?.();
  return true;
}

/**
 * Apply screenshot chrome. Cheap path for shadow/stroke; rebuild only when radius
 * (or forceRebuild) requires a new cover-fill bitmap.
 */
export async function restyleScreenshot(group, style = {}, opts = {}) {
  if (!group) return false;

  if (group.glintRole === 'framed-screenshot') {
    applyChromeShadow(group, style);
    return true;
  }
  if (group.glintRole !== 'screenshot') return false;

  const prev = group.glintChrome || {};
  const chrome = { ...DEFAULT_SCREENSHOT_STYLE, ...prev, ...style };
  const radiusChanged =
    (chrome.cornerRadius ?? 0) !== (prev.cornerRadius ?? DEFAULT_SCREENSHOT_STYLE.cornerRadius);
  const needsBitmapRebuild = opts.forceRebuild || radiusChanged;

  if (!needsBitmapRebuild) {
    applyBareBorderStroke(group, chrome);
    applyChromeShadow(group, chrome);
    group.canvas?.requestRenderAll?.();
    return true;
  }

  const canvas = group.canvas;
  const screenshotUrl = opts.screenshotUrl || group.glintScreenshotUrl;
  if (!canvas || !screenshotUrl) {
    applyBareBorderStroke(group, chrome);
    applyChromeShadow(group, chrome);
    return false;
  }

  const center = typeof group.getCenterPoint === 'function'
    ? group.getCenterPoint()
    : {
        x: (group.left || 0) + ((group.width || 0) * (group.scaleX || 1)) / 2,
        y: (group.top || 0) + ((group.height || 0) * (group.scaleY || 1)) / 2,
      };
  const angle = group.angle || 0;
  const slot = group.glintSlot;
  const slide = group.glintSlide;
  const selectable = group.selectable !== false;
  const uniform = Math.max(Math.abs(group.scaleX || 1), Math.abs(group.scaleY || 1));
  const targetW = (group.glintTargetW || group.width || 1) * uniform;
  const targetH = (group.glintTargetH || group.height || 1) * uniform;
  const left = center.x - targetW / 2;
  const top = center.y - targetH / 2;

  const next = await addStyledScreenshot(canvas, screenshotUrl, {
    ...chrome,
    targetW,
    targetH,
    aspect: targetW / Math.max(1, targetH),
    left,
    top,
    selectable,
  });
  if (!next) return false;

  next.set({
    angle,
    glintSlot: slot,
    glintSlide: slide,
    glintScreenshotUrl: screenshotUrl,
  });
  applyDeviceTransformLocks(next);
  next.setCoords?.();

  canvas.remove(group);
  group.dispose?.();
  canvas.requestRenderAll();
  return true;
}

/** Load a curated bezel as a Fabric object (PNG image or SVG group). */
export async function loadFrameBezel(frameId) {
  const meta = getFrameMeta(frameId);
  const ext = meta.ext || 'png';
  const src = `/frames/${frameId}.${ext}`;

  if (ext === 'svg') {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`Frame not found: ${frameId}`);
    const svg = await res.text();
    const { objects, options } = await loadSVGFromString(svg);
    return util.groupSVGElements(objects, options);
  }

  return FabricImage.fromURL(src, { crossOrigin: 'anonymous' });
}

/**
 * Composite screenshot + bezel into one native-resolution bitmap, then scale.
 * Avoids Fabric Group layout drift that misaligns the shot inside the hole.
 */
async function buildFramedDeviceBitmap(screenshotUrl, frameId) {
  const meta = getFrameMeta(frameId);
  const W = meta.width;
  const H = meta.height;
  const screenW = W - meta.left - meta.right;
  const screenH = H - meta.top - meta.bottom;

  // Sharp rect fill — the bezel PNG/SVG masks the rounded hole on top.
  const screen = await buildScreenBitmap(screenshotUrl, screenW, screenH, 0);
  const screenEl = screen.getElement?.() || screen._element;

  const bezel = await loadFrameBezel(frameId);
  let bezelEl = null;
  if (bezel.getElement) {
    bezelEl = bezel.getElement();
  } else if (bezel._element) {
    bezelEl = bezel._element;
  } else if (typeof bezel.toCanvasElement === 'function') {
    bezelEl = bezel.toCanvasElement(1);
  }

  const off = document.createElement('canvas');
  off.width = W;
  off.height = H;
  const ctx = off.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Screen slightly inset so anti-aliased bezel edges never leak the shot outside the hole.
  const bleed = 2;
  if (screenEl) {
    ctx.drawImage(
      screenEl,
      meta.left + bleed,
      meta.top + bleed,
      Math.max(1, screenW - bleed * 2),
      Math.max(1, screenH - bleed * 2),
    );
  }
  if (bezelEl) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(bezelEl, 0, 0, W, H);
    ctx.imageSmoothingEnabled = true;
  }

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
  screen.dispose?.();
  bezel.dispose?.();
  return fitted;
}

/** @deprecated Prefer loadFrameBezel — kept for callers that need raw SVG text. */
export async function loadFrameSvg(frameId) {
  const res = await fetch(`/frames/${frameId}.svg`);
  if (!res.ok) throw new Error(`Frame not found: ${frameId}`);
  return res.text();
}

/**
 * Lock device transforms: uniform size only + free rotate/move.
 * Edge stretch handles are hidden so aspect ratio cannot be broken.
 */
export function applyDeviceTransformLocks(group) {
  if (!group) return group;
  applySelectionStyle(group);
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
 * Geometric center from left/top/size — ignores shadow blur that can skew getCenterPoint.
 */
function getGroupGeoCenter(group) {
  const sx = Math.abs(group.scaleX || 1);
  const sy = Math.abs(group.scaleY || 1);
  const w = (group.width || 0) * sx;
  const h = (group.height || 0) * sy;
  return {
    x: (group.left || 0) + w / 2,
    y: (group.top || 0) + h / 2,
    sx,
    sy,
    w,
    h,
  };
}

/**
 * Place group so its geometric center sits on (cx, cy).
 */
function placeGroupAtCenter(group, cx, cy) {
  if (!group) return;
  const sx = Math.abs(group.scaleX || 1);
  const sy = Math.abs(group.scaleY || 1);
  const w = (group.width || 0) * sx;
  const h = (group.height || 0) * sy;
  group.set({
    left: cx - w / 2,
    top: cy - h / 2,
    originX: 'left',
    originY: 'top',
  });
  group.setCoords?.();
}

/**
 * Swap the screenshot inside a framed device without resetting position/rotation/size.
 * Rebuilds the whole device group — Fabric 7 layout breaks if we surgically swap children.
 */
export async function replaceDeviceScreenshot(group, screenshotUrl) {
  if (!group || group.glintRole !== 'framed-screenshot' || !screenshotUrl) return false;
  const frameId = group.glintFrameId || 'pixel9';
  const canvas = group.canvas;
  if (!canvas) return false;

  const { x: cx, y: cy, sx, sy } = getGroupGeoCenter(group);
  const uniform = Math.max(sx, sy);
  const angle = group.angle || 0;
  const selectable = group.selectable !== false;
  const slot = group.glintSlot;
  const slide = group.glintSlide;
  const coverage = group.glintCoverage || MIN_DEVICE_COVERAGE;
  const baseScale = group.glintBaseScale
    ?? resolveDeviceScale(frameId, canvas.getWidth?.() || 1080, canvas.getHeight?.() || 1920, coverage);
  const chrome = group.glintChrome || DEFAULT_SCREENSHOT_STYLE;

  const next = await addFramedScreenshot(canvas, screenshotUrl, frameId, {
    scale: baseScale,
    left: 0,
    top: 0,
    selectable,
    coverage,
    chrome,
  });
  if (!next) return false;

  next.set({
    angle,
    scaleX: uniform,
    scaleY: uniform,
    glintSlot: slot,
    glintSlide: slide,
    glintCoverage: coverage,
    glintScreenshotUrl: screenshotUrl,
  });
  placeGroupAtCenter(next, cx, cy);
  applyDeviceTransformLocks(next);

  canvas.remove(group);
  group.dispose?.();
  canvas.requestRenderAll();
  return true;
}

/**
 * Swap the device bezel while keeping the screenshot (cover-filled into the new hole).
 * Also accepts a bare `screenshot` group and wraps it in a bezel.
 */
export async function replaceDeviceFrame(group, nextFrameId, screenshotUrlOverride, styleOverride) {
  if (!group || !nextFrameId) return false;
  const role = group.glintRole;
  if (role !== 'framed-screenshot' && role !== 'screenshot') return false;

  const screenshotUrl = screenshotUrlOverride || group.glintScreenshotUrl;
  if (!screenshotUrl) return false;

  // Same bezel + same shot → skip rebuild (stops top-right drift on repeated clicks).
  if (
    role === 'framed-screenshot'
    && group.glintFrameId === nextFrameId
    && screenshotUrl === group.glintScreenshotUrl
  ) {
    if (styleOverride) applyChromeShadow(group, styleOverride);
    return true;
  }

  const canvas = group.canvas;
  if (!canvas) return false;

  const chrome = {
    ...DEFAULT_SCREENSHOT_STYLE,
    ...(group.glintChrome || {}),
    ...(styleOverride || {}),
  };

  const canvasW = canvas.getWidth?.() || 1080;
  const canvasH = canvas.getHeight?.() || 1920;
  const selectable = group.selectable !== false;
  const slot = group.glintSlot;
  const slide = group.glintSlide;
  const angle = group.angle || 0;
  const { x: cx, y: cy, sx, sy } = getGroupGeoCenter(group);

  const coverage = Math.max(
    MIN_DEVICE_COVERAGE,
    group.glintCoverage || MIN_DEVICE_COVERAGE,
  );

  // Same bezel, new shot — keep exact transform, only rebake pixels.
  if (role === 'framed-screenshot' && group.glintFrameId === nextFrameId) {
    const baseScale = group.glintBaseScale
      ?? resolveDeviceScale(nextFrameId, canvasW, canvasH, coverage);
    const next = await addFramedScreenshot(canvas, screenshotUrl, nextFrameId, {
      scale: baseScale,
      left: 0,
      top: 0,
      selectable,
      coverage,
      chrome,
    });
    if (!next) return false;
    next.set({
      angle,
      scaleX: sx,
      scaleY: sy,
      glintSlot: slot,
      glintSlide: slide,
      glintCoverage: coverage,
      glintScreenshotUrl: screenshotUrl,
    });
    placeGroupAtCenter(next, cx, cy);
    applyDeviceTransformLocks(next);
    canvas.remove(group);
    group.dispose?.();
    canvas.requestRenderAll();
    return true;
  }

  const baseScale = resolveDeviceScale(nextFrameId, canvasW, canvasH, coverage);
  const next = await addFramedScreenshot(canvas, screenshotUrl, nextFrameId, {
    scale: baseScale,
    left: 0,
    top: 0,
    selectable,
    coverage,
    chrome,
  });
  if (!next) return false;

  next.set({
    angle,
    glintSlot: slot,
    glintSlide: slide,
    glintCoverage: coverage,
    glintScreenshotUrl: screenshotUrl,
  });
  placeGroupAtCenter(next, cx, cy);
  applyDeviceTransformLocks(next);

  canvas.remove(group);
  group.dispose?.();
  canvas.requestRenderAll();
  return true;
}

/**
 * Composite screenshot inside device frame.
 * Screen + bezel are baked into one bitmap at native size, then scaled as a unit
 * so the shot always cover-fills and stays aligned with the hole.
 */
export async function addFramedScreenshot(canvas, screenshotUrl, frameId, opts = {}) {
  const targetScale = opts.scale ?? 0.55;
  const { frameW, frameH } = computeFrameLayout(frameId, targetScale);
  const meta = getFrameMeta(frameId);

  const deviceImg = await buildFramedDeviceBitmap(screenshotUrl, frameId);
  deviceImg.set({
    scaleX: frameW / meta.width,
    scaleY: frameH / meta.height,
    left: 0,
    top: 0,
    originX: 'left',
    originY: 'top',
    selectable: false,
    evented: false,
  });

  const group = new Group([deviceImg], {
    left: opts.left ?? 0,
    top: opts.top ?? 0,
    originX: 'left',
    originY: 'top',
    selectable: opts.selectable !== false,
    evented: opts.selectable !== false,
    subTargetCheck: false,
    objectCaching: true,
    layoutManager: new LayoutManager(new FixedLayout()),
    glintRole: 'framed-screenshot',
    glintFrameId: frameId,
    glintBaseScale: targetScale,
    glintCoverage: opts.coverage ?? MIN_DEVICE_COVERAGE,
    glintScreenshotUrl: screenshotUrl,
    glintChrome: opts.chrome || DEFAULT_SCREENSHOT_STYLE,
  });

  applyDeviceTransformLocks(group);
  applyChromeShadow(group, opts.chrome || DEFAULT_SCREENSHOT_STYLE);

  canvas.add(group);
  canvas.requestRenderAll();
  return group;
}

export function addTextOverlay(canvas, text, opts = {}) {
  const fb = new IText(text || 'Double-click to edit', {
    left: opts.left ?? canvas.getWidth() / 2,
    top: opts.top ?? 120,
    fontSize: opts.fontSize ?? 48,
    fontFamily: `${opts.fontFamily || 'Space Grotesk'}, sans-serif`,
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
  applySelectionStyle(fb);
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
