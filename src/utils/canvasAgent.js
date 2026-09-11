/**
 * Canvas Agent API - shared board verbs for Manual UI and Copilot (Mode 3).
 * Device transforms always go through canvasEngine helpers (center-aware scale/angle).
 */
import {
  getDeviceDisplaySize,
  replaceDeviceScreenshot,
  setDeviceAngle,
  setDeviceUniformScale,
} from './canvasEngine.js';
import { isUserScreenshot } from './assetLibrary.js';

export function findDeviceOnCanvas(canvas) {
  if (!canvas?.getObjects) return null;
  return (
    canvas.getObjects().find((o) => o.glintRole === 'framed-screenshot')
    || canvas.getObjects().find((o) => o.glintRole === 'screenshot')
    || null
  );
}

function resolveFrameIndex(ctx, frameIndex) {
  if (frameIndex == null || frameIndex < 0) return ctx.getActiveIndex?.() ?? 0;
  return frameIndex;
}

function canvasAt(ctx, frameIndex) {
  const frames = ctx.getFrames?.() || [];
  const i = resolveFrameIndex(ctx, frameIndex);
  const frame = frames[i];
  if (!frame) return { canvas: null, frame: null, index: i };
  const canvas = ctx.getCanvas?.(frame.id) || null;
  return { canvas, frame, index: i };
}

/** Snapshot agents must re-read after human edits (generation in session). */
export function getEditorState(ctx) {
  const frames = ctx.getFrames?.() || [];
  const activeIndex = ctx.getActiveIndex?.() ?? -1;
  const deviceFrame = ctx.getDeviceFrame?.() ?? null;

  return {
    activeIndex,
    deviceFrame,
    frameCount: frames.length,
    frames: frames.map((f, index) => {
      const canvas = ctx.getCanvas?.(f.id) || null;
      const device = findDeviceOnCanvas(canvas);
      const size = device ? getDeviceDisplaySize(device) : null;
      const active = canvas?.getActiveObject?.();
      const deviceSelected = !!(
        active
        && (active.glintRole === 'framed-screenshot' || active.glintRole === 'screenshot')
      );
      return {
        id: f.id,
        index,
        screenshotUrl: f.screenshotUrl || null,
        hasUserScreenshot: isUserScreenshot(f.screenshotUrl),
        device: device
          ? {
            role: device.glintRole,
            bezelId: device.glintFrameId ?? null,
            scalePct: size?.scalePct ?? 100,
            angle: Math.round(device.angle || 0),
            width: size?.width ?? 0,
            height: size?.height ?? 0,
            selected: deviceSelected && index === activeIndex,
          }
          : null,
      };
    }),
  };
}

export function selectFrame(ctx, frameIndex) {
  const frames = ctx.getFrames?.() || [];
  const i = Math.max(0, Math.min(frames.length - 1, Math.round(frameIndex)));
  if (!frames[i]) return { ok: false, error: 'frame_not_found' };
  ctx.setActiveIndex?.(i);
  return { ok: true, frameIndex: i, frameId: frames[i].id };
}

export function selectDevice(ctx, frameIndex) {
  const sel = selectFrame(ctx, resolveFrameIndex(ctx, frameIndex));
  if (!sel.ok) return sel;
  const { canvas, index } = canvasAt(ctx, sel.frameIndex);
  const device = findDeviceOnCanvas(canvas);
  if (!canvas || !device) return { ok: false, error: 'device_not_found', frameIndex: index };
  canvas.setActiveObject(device);
  canvas.requestRenderAll?.();
  return {
    ok: true,
    frameIndex: index,
    bezelId: device.glintFrameId ?? null,
    scalePct: getDeviceDisplaySize(device).scalePct,
    angle: Math.round(device.angle || 0),
  };
}

export function setDeviceScalePct(ctx, pct, frameIndex) {
  const { canvas, index } = canvasAt(ctx, frameIndex);
  const device = findDeviceOnCanvas(canvas);
  if (!device || device.glintRole !== 'framed-screenshot') {
    return { ok: false, error: 'device_not_found', frameIndex: index };
  }
  const n = Number(pct);
  if (!Number.isFinite(n)) return { ok: false, error: 'invalid_scale' };
  setDeviceUniformScale(device, n / 100);
  if (canvas?.getActiveObject?.() !== device) {
    canvas.setActiveObject(device);
    canvas.requestRenderAll?.();
  }
  const size = getDeviceDisplaySize(device);
  return { ok: true, frameIndex: index, scalePct: size.scalePct, width: size.width, height: size.height };
}

export function setDeviceAngleDeg(ctx, degrees, frameIndex) {
  const { canvas, index } = canvasAt(ctx, frameIndex);
  const device = findDeviceOnCanvas(canvas);
  if (!device || device.glintRole !== 'framed-screenshot') {
    return { ok: false, error: 'device_not_found', frameIndex: index };
  }
  const n = Number(degrees);
  if (!Number.isFinite(n)) return { ok: false, error: 'invalid_angle' };
  setDeviceAngle(device, n);
  if (canvas?.getActiveObject?.() !== device) {
    canvas.setActiveObject(device);
    canvas.requestRenderAll?.();
  }
  return { ok: true, frameIndex: index, angle: Math.round(device.angle || 0) };
}

/** Replace or clear screenshot. Pass null/empty to clear to white placeholder via ctx. */
export async function setScreenshot(ctx, url, frameIndex) {
  const { canvas, frame, index } = canvasAt(ctx, frameIndex);
  const device = findDeviceOnCanvas(canvas);
  if (!device || !frame) return { ok: false, error: 'device_not_found', frameIndex: index };
  const nextUrl = url || ctx.getWhiteScreenshot?.();
  if (!nextUrl) return { ok: false, error: 'no_screenshot_url' };
  const ok = await replaceDeviceScreenshot(device, nextUrl);
  if (!ok) return { ok: false, error: 'replace_failed', frameIndex: index };
  ctx.updateFrame?.(index, { screenshotUrl: nextUrl });
  return {
    ok: true,
    frameIndex: index,
    hasUserScreenshot: isUserScreenshot(nextUrl),
  };
}

/**
 * Copy device scale + angle from source frame onto targets (teach-from-edit).
 * Bezel is left alone unless copyBezel is true (async bezel swap is Editor-owned).
 */
export function matchDeviceTransform(ctx, sourceIndex, targetIndexes = null, { copyBezel = false } = {}) {
  const src = canvasAt(ctx, sourceIndex);
  const srcDevice = findDeviceOnCanvas(src.canvas);
  if (!srcDevice || srcDevice.glintRole !== 'framed-screenshot') {
    return { ok: false, error: 'source_device_not_found' };
  }
  const size = getDeviceDisplaySize(srcDevice);
  const angle = Math.round(srcDevice.angle || 0);
  const bezelId = srcDevice.glintFrameId ?? null;
  const frames = ctx.getFrames?.() || [];
  const targets = (targetIndexes == null
    ? frames.map((_, i) => i).filter((i) => i !== src.index)
    : targetIndexes
  ).map((i) => Math.round(i));

  const applied = [];
  for (const ti of targets) {
    if (ti === src.index || ti < 0 || ti >= frames.length) continue;
    const scaleRes = setDeviceScalePct(ctx, size.scalePct, ti);
    const angleRes = setDeviceAngleDeg(ctx, angle, ti);
    if (scaleRes.ok && angleRes.ok) {
      applied.push({ frameIndex: ti, scalePct: size.scalePct, angle, bezelId: copyBezel ? bezelId : undefined });
    }
  }
  return {
    ok: true,
    sourceIndex: src.index,
    scalePct: size.scalePct,
    angle,
    bezelId,
    applied,
    note: copyBezel
      ? 'Bezel id returned for callers; use Editor setDeviceBezel to apply.'
      : undefined,
  };
}

export const CANVAS_AGENT_OPS = [
  'getEditorState',
  'selectFrame',
  'selectDevice',
  'setDeviceScale',
  'setDeviceAngle',
  'setScreenshot',
  'matchDeviceTransform',
];

/** Run a named op against a live ctx (used by Copilot session). */
export async function runCanvasOp(ctx, op, args = {}) {
  switch (op) {
    case 'getEditorState':
      return { ok: true, state: getEditorState(ctx) };
    case 'selectFrame':
      return selectFrame(ctx, args.frameIndex ?? args.index ?? 0);
    case 'selectDevice':
      return selectDevice(ctx, args.frameIndex ?? args.index);
    case 'setDeviceScale':
      return setDeviceScalePct(ctx, args.pct ?? args.scalePct, args.frameIndex);
    case 'setDeviceAngle':
      return setDeviceAngleDeg(ctx, args.degrees ?? args.angle, args.frameIndex);
    case 'setScreenshot':
      return setScreenshot(ctx, args.url, args.frameIndex);
    case 'matchDeviceTransform':
      return matchDeviceTransform(
        ctx,
        args.sourceIndex ?? 0,
        args.targetIndexes ?? null,
        { copyBezel: !!args.copyBezel },
      );
    default:
      return { ok: false, error: 'unknown_op', op };
  }
}
