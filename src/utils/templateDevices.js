import { getStoreTarget, resolveStoreKey } from './storeCatalog.js';

const DEFAULT_HEIGHT = 1920;

/** Prefer template preview/device frame, then store catalog default. */
export function resolveTemplateFrame(template) {
  const fromPreview = template?.preview?.frame;
  if (fromPreview) return fromPreview;
  const fromLayers = (template?.layers || []).find((l) => l.type === 'device' && l.frame)?.frame;
  if (fromLayers) return fromLayers;
  const fromSlides = (template?.slides || [])
    .flatMap((s) => s.layers || [])
    .find((l) => l.type === 'device' && l.frame)?.frame;
  if (fromSlides) return fromSlides;
  const target = getStoreTarget(resolveStoreKey(template?.store));
  return target.defaultFrame || 'pixel9';
}

/**
 * Guarantee a `device` layer with a real bezel on every slide.
 * Upgrades bare `screenshot` layers and fills missing `frame` ids.
 */
export function ensureSlideHasDevice(slide, frameId, canvas = {}) {
  const canvasH = canvas.height ?? DEFAULT_HEIGHT;
  const bezel = frameId || 'pixel9';
  const layers = (slide?.layers || []).map((l) => {
    if (l.type === 'device' && !l.frame) return { ...l, frame: bezel };
    return { ...l };
  });

  if (layers.some((l) => l.type === 'device' && l.frame)) {
    return { ...slide, layers };
  }

  const shotIdx = layers.findIndex((l) => l.type === 'screenshot');
  if (shotIdx >= 0) {
    const shot = layers[shotIdx];
    layers[shotIdx] = {
      type: 'device',
      frame: bezel,
      slot: shot.slot ?? 0,
      scale: shot.scale ?? 0.62,
      position:
        shot.marginLeft != null || shot.left != null
          ? 'absolute'
          : shot.position ?? 'center',
      marginTop: shot.marginTop ?? shot.top ?? Math.round(canvasH * 0.16),
      ...(shot.marginLeft != null || shot.left != null
        ? { marginLeft: shot.marginLeft ?? shot.left }
        : {}),
      ...(shot.angle != null ? { angle: shot.angle } : {}),
    };
    return { ...slide, layers };
  }

  layers.push({
    type: 'device',
    frame: bezel,
    slot: 0,
    scale: 0.62,
    position: 'center',
    marginTop: Math.round(canvasH * 0.16),
  });
  return { ...slide, layers };
}

/** Remap pack-wide slots so each board frame paints against its own screenshot [0]. */
export function bindSlideToFrameShot(slide) {
  if (!slide?.layers?.length) return slide;
  const shotLayers = slide.layers.filter(
    (l) => l.type === 'device' || l.type === 'screenshot',
  );
  if (!shotLayers.length) return slide;
  const minSlot = Math.min(...shotLayers.map((l) => l.slot ?? 0));
  return {
    ...slide,
    layers: slide.layers.map((l) => {
      if (l.type !== 'device' && l.type !== 'screenshot') return l;
      return { ...l, slot: (l.slot ?? 0) - minSlot };
    }),
  };
}
