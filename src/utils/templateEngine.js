import { FabricImage, Rect, Text, loadSVGFromString, util } from 'fabric';
import { createCanvas, setBackground, addFramedScreenshot, applyDeviceTransformLocks, applySelectionStyle, copyGlintProps, GLINT_CLONE_PROPS } from './canvasEngine';
import { addGraphicLayer, addShapeLayer } from './graphicLayers';
import { getTheme } from './templateLoader';
import { getFrameMeta, resolveDeviceScale, MIN_DEVICE_COVERAGE } from './frameMeta';

const DEFAULT_WIDTH = 1080;
const DEFAULT_HEIGHT = 1920;
export const SLIDE_GAP = 48;

const DEFAULT_HEADLINES = [
  'Capture. Polish. Ship.',
  'Your app, store-ready',
  'Swap shots in seconds',
  'Five screens. One look.',
  'Built for Play & App Store',
];

function resolvePosition(position, canvasW, canvasH, objW, objH, layer = {}) {
  const marginTop = layer.marginTop ?? 0;
  const marginLeft = layer.marginLeft;

  if (marginLeft != null && !position) {
    return { left: marginLeft, top: marginTop };
  }

  switch (position) {
    case 'top':
      return { left: (canvasW - objW) / 2, top: marginTop };
    case 'left':
      return { left: marginLeft ?? 40, top: marginTop };
    case 'right':
      return { left: canvasW - objW - 40, top: marginTop + 200 };
    case 'center':
      return { left: (canvasW - objW) / 2, top: marginTop || (canvasH - objH) / 2 };
    case 'bottom-center':
      return { left: (canvasW - objW) / 2, top: canvasH - objH - 80 };
    case 'bottom':
      return { left: (canvasW - objW) / 2, top: canvasH - objH - (layer.marginBottom ?? 80) };
    default:
      return {
        left: marginLeft ?? (canvasW - objW) / 2,
        top: marginTop || 100,
      };
  }
}

function shiftLayer(layer, originX) {
  if (!originX) return layer;
  return {
    ...layer,
    left: (layer.left ?? 0) + originX,
    marginLeft: layer.marginLeft != null ? layer.marginLeft + originX : undefined,
  };
}

async function addScreenshotLayer(canvas, screenshotUrl, layer, canvasW, canvasH, editable, originX = 0) {
  const scale = layer.scale ?? 0.7;
  const img = await FabricImage.fromURL(screenshotUrl, { crossOrigin: 'anonymous' });
  const maxW = canvasW * scale;
  const maxH = canvasH * scale;
  const imgScale = Math.min(maxW / (img.width || 1), maxH / (img.height || 1), 1);

  img.set({
    scaleX: imgScale,
    scaleY: imgScale,
    evented: editable,
    selectable: editable,
    glintRole: 'screenshot',
    glintSlot: layer.slot ?? 0,
  });

  const objW = (img.width || 0) * imgScale;
  const objH = (img.height || 0) * imgScale;
  const pos = resolvePosition(layer.position ?? 'center', canvasW, canvasH, objW, objH, layer);
  img.set({ left: pos.left + originX, top: pos.top });

  if (layer.rounded) {
    img.set({
      clipPath: new Rect({
        width: objW,
        height: objH,
        rx: layer.rounded,
        ry: layer.rounded,
        originX: 'center',
        originY: 'center',
      }),
    });
  }

  canvas.add(img);
  return img;
}

async function addFrameLayer(canvas, frameId, layer, canvasW, canvasH, editable, originX = 0) {
  if (!frameId) return null;
  try {
    const res = await fetch(`/frames/${frameId}.svg`);
    if (!res.ok) return null;
    const svg = await res.text();
    const { objects, options } = await loadSVGFromString(svg);
    const frame = util.groupSVGElements(objects, options);
    const meta = getFrameMeta(frameId);
    const scale = layer.scale ?? 0.75;
    const frameW = meta.width * scale;
    const frameH = meta.height * scale;
    const fw = frame.width || meta.width;
    const fh = frame.height || meta.height;

    frame.set({
      scaleX: frameW / fw,
      scaleY: frameH / fh,
      evented: editable,
      selectable: editable,
    });

    const pos = resolvePosition(layer.position ?? 'center', canvasW, canvasH, frameW, frameH, layer);
    frame.set({ left: pos.left + originX, top: pos.top });
    canvas.add(frame);
    return frame;
  } catch {
    return null;
  }
}

async function addDeviceLayer(canvas, screenshotUrl, layer, canvasW, canvasH, editable, originX = 0) {
  if (!layer.frame || !screenshotUrl) return null;
  // layer.scale = canvas coverage (0.6 = 60% of frame). Min 60% unless minCoverage overrides (e.g. dual phones).
  const minCoverage = layer.minCoverage ?? MIN_DEVICE_COVERAGE;
  const coverage = Math.max(minCoverage, layer.scale ?? minCoverage);
  const scale = resolveDeviceScale(layer.frame, canvasW, canvasH, coverage, { minCoverage });
  const meta = getFrameMeta(layer.frame);
  const frameW = meta.width * scale;
  const frameH = meta.height * scale;
  const pos = resolvePosition(layer.position, canvasW, canvasH, frameW, frameH, layer);

  const group = await addFramedScreenshot(canvas, screenshotUrl, layer.frame, {
    scale,
    left: pos.left + originX,
    top: pos.top,
    selectable: editable,
    coverage,
  });
  if (group) {
    group.set({
      glintSlot: layer.slot ?? 0,
      glintSlide: layer.slideIndex ?? 0,
      glintCoverage: coverage,
      glintScreenshotUrl: screenshotUrl,
    });
  }
  return group;
}

function addTextLayer(canvas, layer, metadata, canvasW, canvasH, editable, originX = 0) {
  const useGlobal =
    layer.type === 'subheadline'
      ? metadata.subheadline || metadata.tagline
      : metadata.headline;
  const text = (useGlobal || layer.placeholder || '') || '';
  if (!text) return null;

  const alignLeft = layer.position === 'left';
  const fb = new Text(text, {
    fontSize: layer.fontSize ?? 36,
    fontFamily: `${layer.fontFamily || 'Inter'}, sans-serif`,
    fontWeight: layer.fontWeight ?? 'normal',
    fill: layer.color ?? '#ffffff',
    textAlign: alignLeft ? 'left' : 'center',
    originX: alignLeft ? 'left' : 'center',
    evented: editable,
    selectable: editable,
    editable: editable,
    glintRole: 'text',
  });

  const pos = resolvePosition(layer.position ?? 'top', canvasW, canvasH, fb.width, fb.height, layer);
  fb.set({ left: (alignLeft ? pos.left : canvasW / 2) + originX, top: pos.top });
  canvas.add(fb);
  return fb;
}

function addBadgeLayer(canvas, layer, canvasW, editable, originX = 0) {
  const text = layer.text ?? 'NEW';
  const padding = 16;
  const fb = new Text(text, {
    fontSize: 20,
    fontFamily: 'Inter, sans-serif',
    fontWeight: 'bold',
    fill: layer.color ?? '#ffffff',
    evented: editable,
    selectable: editable,
  });

  const bg = new Rect({
    width: fb.width + padding * 2,
    height: fb.height + padding,
    fill: layer.background ?? '#ff4757',
    rx: 8,
    ry: 8,
    evented: editable,
    selectable: editable,
  });

  const groupLeft = canvasW - bg.width - 60 + originX;
  bg.set({ left: groupLeft, top: 60 });
  fb.set({ left: groupLeft + padding, top: 60 + padding / 2 });
  canvas.add(bg, fb);
}

function addBulletsLayer(canvas, layer, editable, originX = 0) {
  const items = layer.items ?? [];
  items.forEach((item, i) => {
    const fb = new Text(`• ${item}`, {
      left: (layer.marginLeft ?? 80) + originX,
      top: (layer.marginTop ?? 200) + i * 48,
      fontSize: layer.fontSize ?? 28,
      fontFamily: 'Inter, sans-serif',
      fill: layer.color ?? '#ffffff',
      evented: editable,
      selectable: editable,
      editable: editable,
    });
    canvas.add(fb);
  });
}

function hexToRgb(hex) {
  const h = String(hex || '#1C1C1E').replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.padEnd(6, '0');
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }) {
  const c = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

function mix(hex, toward, amount) {
  const a = hexToRgb(hex);
  const b = hexToRgb(toward);
  return rgbToHex({
    r: a.r + (b.r - a.r) * amount,
    g: a.g + (b.g - a.g) * amount,
    b: a.b + (b.b - a.b) * amount,
  });
}

function isLight(hex) {
  const { r, g, b } = hexToRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}

/**
 * Expand a single-canvas template into 5 Blink-style store slides.
 * Uses template.slides when present; otherwise derives layout variants.
 */
export function getTemplateSlides(template) {
  if (!template) return [];
  if (Array.isArray(template.slides) && template.slides.length) {
    return template.slides.map((slide, i) => ({
      id: slide.id || `${template.id}-frame-${i + 1}`,
      name: slide.name || `Frame ${i + 1}`,
      layers: slide.layers || [],
      preview: slide.preview || null,
    }));
  }
  return expandToFiveSlides(template);
}

function expandToFiveSlides(template) {
  const baseLayers = template.layers || [];
  const canvasH = template.canvas?.height ?? DEFAULT_HEIGHT;
  const bgLayer = baseLayers.find((l) => l.type === 'background');
  const accent = bgLayer?.color || template.preview?.bg || '#611AB4';
  const deviceLayer = baseLayers.find((l) => l.type === 'device' || l.type === 'screenshot');
  const frame = deviceLayer?.frame || template.preview?.frame || 'pixel9';
  const graphics = baseLayers.filter((l) => l.type === 'graphic' || l.type === 'shape');
  const headlines =
    template.preview?.headlines?.length === 5
      ? template.preview.headlines
      : DEFAULT_HEADLINES.map((h, i) =>
          i === 0
            ? (baseLayers.find((l) => l.type === 'headline')?.placeholder || h)
            : h,
        );

  // Blink-inspired layouts. Each becomes a named Frame artboard.
  const canvasW = template.canvas?.width ?? DEFAULT_WIDTH;
  const layouts = [
    {
      // Frame 1: phone upper, accent band + headline at bottom
      bg: '#FFFFFF',
      textColor: '#FFFFFF',
      band: accent,
      headlineBottom: true,
      phoneTop: Math.round(canvasH * 0.06),
      phoneScale: 0.62,
      showGraphics: false,
    },
    {
      // Frame 2: headline top, phone below
      bg: '#FFFFFF',
      textColor: accent,
      band: null,
      headlineBottom: false,
      headlineTop: Math.round(canvasH * 0.055),
      phoneTop: Math.round(canvasH * 0.18),
      phoneScale: 0.6,
      showGraphics: false,
    },
    {
      // Frame 3: soft tint bg
      bg: mix(accent, '#FFFFFF', 0.42),
      textColor: '#FFFFFF',
      band: null,
      headlineBottom: false,
      headlineTop: Math.round(canvasH * 0.055),
      phoneTop: Math.round(canvasH * 0.18),
      phoneScale: 0.6,
      showGraphics: true,
    },
    {
      // Frame 4: solid accent
      bg: accent,
      textColor: '#FFFFFF',
      band: null,
      headlineBottom: false,
      headlineTop: Math.round(canvasH * 0.055),
      phoneTop: Math.round(canvasH * 0.18),
      phoneScale: 0.6,
      showGraphics: true,
    },
    {
      // Frame 5: deeper tone
      bg: mix(accent, '#000000', 0.18),
      textColor: isLight(accent) ? '#1A1A1A' : '#FFFFFF',
      band: null,
      headlineBottom: false,
      headlineTop: Math.round(canvasH * 0.05),
      phoneTop: Math.round(canvasH * 0.16),
      phoneScale: 0.62,
      showGraphics: false,
    },
  ];

  return layouts.map((layout, i) => {
    const layers = [{ type: 'background', color: layout.bg }];

    if (layout.showGraphics) {
      graphics.forEach((g) => {
        layers.push({
          ...g,
          left: 0,
          top: 0,
          width: canvasW,
        });
      });
    }

    if (layout.band) {
      // Bottom accent strip (clipped to frame) - Blink-style
      layers.push({
        type: 'shape',
        shape: 'rect',
        fill: layout.band,
        left: -40,
        top: Math.round(canvasH * 0.78),
        width: canvasW + 80,
        height: Math.round(canvasH * 0.28),
        angle: -10,
        rx: 0,
      });
    }

    layers.push({
      type: 'headline',
      position: 'top',
      fontSize: layout.headlineBottom ? 46 : 54,
      fontWeight: '800',
      color: layout.textColor,
      placeholder: headlines[i],
      marginTop: layout.headlineBottom
        ? Math.round(canvasH * 0.84)
        : layout.headlineTop,
    });

    if (deviceLayer?.type === 'screenshot') {
      layers.push({
        type: 'screenshot',
        slot: 0,
        scale: layout.phoneScale,
        position: 'center',
        marginTop: layout.phoneTop,
        rounded: deviceLayer.rounded ?? 48,
      });
    } else {
      layers.push({
        type: 'device',
        frame,
        slot: 0,
        scale: layout.phoneScale,
        position: 'center',
        marginTop: layout.phoneTop,
      });
    }

    return {
      id: `${template.id}-frame-${i + 1}`,
      name: `Frame ${i + 1}`,
      layers,
      preview: {
        bg: layout.bg,
        textColor: layout.textColor,
        band: layout.band,
        headline: headlines[i],
        headlineBottom: layout.headlineBottom,
      },
    };
  });
}

/** Slots needed across the full 5-slide template set. */
export function getScreenshotSlotCount(template) {
  const slides = getTemplateSlides(template);
  if (!slides.length) {
    const slots = (template?.layers ?? [])
      .filter((l) => l.type === 'screenshot' || l.type === 'device')
      .map((l) => (l.slot ?? 0) + 1);
    return Math.max(1, ...slots, 1);
  }
  return slides.reduce((sum, slide) => {
    const slots = (slide.layers ?? [])
      .filter((l) => l.type === 'screenshot' || l.type === 'device')
      .map((l) => (l.slot ?? 0) + 1);
    return sum + Math.max(1, ...slots, 1);
  }, 0);
}

/** Canvas size when all slides are laid out horizontally. */
export function getTemplateCanvasSize(template) {
  const slideW = template?.canvas?.width ?? DEFAULT_WIDTH;
  const slideH = template?.canvas?.height ?? DEFAULT_HEIGHT;
  const slides = getTemplateSlides(template);
  const n = Math.max(1, slides.length);
  const labelH = 56;
  return {
    width: n * slideW + (n - 1) * SLIDE_GAP,
    height: slideH + labelH,
    slideWidth: slideW,
    slideHeight: slideH,
    slideCount: n,
    labelHeight: labelH,
  };
}

async function paintLayers(canvas, template, screenshotUrls, metadata, themes, editable, originX = 0) {
  const layers = template?.layers ?? [];
  const canvasW = template.canvas?.width ?? DEFAULT_WIDTH;
  const canvasH = template.canvas?.height ?? DEFAULT_HEIGHT;

  for (const layer of layers) {
    switch (layer.type) {
      case 'background': {
        const color = layer.color || layer.value || '#1C1C1E';
        if (layer.color && !layer.theme) {
          setBackground(canvas, 'solid', layer.color);
        } else {
          const theme = getTheme(layer.theme, themes) || {
            type: 'solid',
            value: color,
          };
          setBackground(canvas, theme.type, theme.value);
        }
        break;
      }
      case 'graphic':
        await addGraphicLayer(canvas, shiftLayer(layer, originX), { selectable: editable });
        break;
      case 'shape':
        addShapeLayer(canvas, shiftLayer(layer, originX), { selectable: editable });
        break;
      case 'headline':
      case 'subheadline':
        addTextLayer(canvas, layer, metadata, canvasW, canvasH, editable, originX);
        break;
      case 'screenshot': {
        const slotIndex = layer.slot ?? 0;
        const url = Array.isArray(screenshotUrls) ? screenshotUrls[slotIndex] : screenshotUrls;
        if (url) await addScreenshotLayer(canvas, url, layer, canvasW, canvasH, editable, originX);
        break;
      }
      case 'device': {
        const slotIndex = layer.slot ?? 0;
        const url = Array.isArray(screenshotUrls) ? screenshotUrls[slotIndex] : screenshotUrls;
        if (url) await addDeviceLayer(canvas, url, { ...layer }, canvasW, canvasH, editable, originX);
        break;
      }
      case 'device-frame':
        await addFrameLayer(canvas, layer.frame, layer, canvasW, canvasH, editable, originX);
        break;
      case 'badge':
        addBadgeLayer(canvas, layer, canvasW, editable, originX);
        break;
      case 'bullets':
        addBulletsLayer(canvas, layer, editable, originX);
        break;
    }
  }
  canvas.requestRenderAll();
}

async function paintDesignContents(
  canvas,
  design,
  screenshotUrl,
  { canvasWidth, canvasHeight, themes, metadata, editable },
) {
  canvas.setDimensions({ width: canvasWidth, height: canvasHeight });

  if (!design?.layers?.length) {
    setBackground(canvas, 'solid', '#1C1C1E');
    if (screenshotUrl) {
      await addDeviceLayer(
        canvas,
        screenshotUrl,
        { frame: 'pixel9', scale: MIN_DEVICE_COVERAGE, position: 'center', marginTop: Math.round(canvasHeight * 0.18), slot: 0 },
        canvasWidth,
        canvasHeight,
        editable,
        0,
      );
    }
    canvas.requestRenderAll();
    return;
  }

  const slideTemplate = {
    canvas: { width: canvasWidth, height: canvasHeight },
    layers: design.layers,
  };
  const urls = [screenshotUrl].filter(Boolean);
  const slideMeta = { ...metadata, headline: undefined, tagline: undefined };
  await paintLayers(canvas, slideTemplate, urls, slideMeta, themes, editable, 0);
}

/**
 * Paint one design slide into a single Frame canvas (clipped by canvas bounds).
 * Builds offscreen first, then swaps onto the live canvas in one frame to avoid blank flashes.
 * @param {object} design - slide with layers (from getTemplateSlides)
 * @param {string|null} screenshotUrl - raw app screenshot for device/screenshot slots
 */
export async function applyDesignToFrame(
  canvas,
  design,
  screenshotUrl,
  {
    canvasWidth = DEFAULT_WIDTH,
    canvasHeight = DEFAULT_HEIGHT,
    themes = {},
    metadata = {},
    editable = true,
    signal,
  } = {},
) {
  if (!canvas) return;

  const opts = { canvasWidth, canvasHeight, themes, metadata, editable };
  const draftEl = document.createElement('canvas');
  const draft = createCanvas(draftEl, canvasWidth, canvasHeight);

  try {
    await paintDesignContents(draft, design, screenshotUrl, opts);
    if (signal?.aborted) return;

    const clones = [];
    const draftObjects = draft.getObjects();
    for (let i = 0; i < draftObjects.length; i++) {
      if (signal?.aborted) return;
      const src = draftObjects[i];
      // Fabric clone drops custom glint* fields unless listed — then copy again to be safe.
      const cloned = await src.clone(GLINT_CLONE_PROPS);
      copyGlintProps(src, cloned);
      clones.push(cloned);
    }
    if (signal?.aborted) return;

    const prevRender = canvas.renderOnAddRemove;
    canvas.renderOnAddRemove = false;
    canvas.clear();
    canvas.setDimensions({ width: canvasWidth, height: canvasHeight });
    canvas.backgroundColor = draft.backgroundColor;
    for (const cloned of clones) canvas.add(cloned);
    canvas.renderOnAddRemove = prevRender;
    canvas.requestRenderAll();
  } finally {
    draft.dispose();
  }
}

/** Toggle selectability without rebuilding the design. */
export function setFrameEditable(canvas, editable) {
  if (!canvas) return;
  canvas.selection = editable;
  canvas.uniformScaling = true;
  canvas.forEachObject((obj) => {
    if (obj.glintRole === 'framed-screenshot') {
      // Always evented so right-click import works; only selectable when frame is active.
      obj.set({ selectable: editable, evented: true });
      applyDeviceTransformLocks(obj);
    } else {
      obj.set({ selectable: editable, evented: editable });
      applySelectionStyle(obj);
    }
  });
  if (!editable) canvas.discardActiveObject?.();
  canvas.requestRenderAll();
}

/**
 * Render a single slide offscreen (for export).
 */
export async function renderTemplateFrame(template, screenshotUrls, metadata = {}, themes = {}) {
  const canvasW = template.canvas?.width ?? DEFAULT_WIDTH;
  const canvasH = template.canvas?.height ?? DEFAULT_HEIGHT;
  const container = document.createElement('canvas');
  const canvas = createCanvas(container, canvasW, canvasH);

  try {
    await paintLayers(canvas, template, screenshotUrls, metadata, themes, false, 0);
    return canvas.toDataURL({ format: 'png', multiplier: 1 });
  } finally {
    canvas.dispose();
  }
}

/**
 * Export each of the 5 template slides as its own PNG.
 * Falls back to legacy per-screenshot rendering when slides expand from one layout.
 */
export async function renderBatch(screenshots, template, metadata = {}, themes = {}, exportSize = null) {
  const slides = getTemplateSlides(template);
  const baseCanvas = exportSize
    ? { width: exportSize.width, height: exportSize.height }
    : (template.canvas || { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });

  const results = [];
  let urlCursor = 0;

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const slideTemplate = {
      ...template,
      canvas: baseCanvas,
      layers: slide.layers,
      _slideMode: false,
    };
    const slots = Math.max(
      1,
      ...(slide.layers || [])
        .filter((l) => l.type === 'screenshot' || l.type === 'device')
        .map((l) => (l.slot ?? 0) + 1),
    );
    const chunk = [];
    for (let s = 0; s < slots; s++) {
      chunk.push(screenshots[urlCursor + s] || screenshots[s % Math.max(1, screenshots.length)]);
    }
    urlCursor += slots;

    try {
      const dataUrl = await renderTemplateFrame(
        slideTemplate,
        chunk,
        { ...metadata, slot: i },
        themes,
      );
      results.push(dataUrl);
    } catch {
      // Skip failed frames
    }
  }

  return results;
}

/**
 * @deprecated Prefer applyDesignToFrame per Frame. Kept for offscreen batch helpers.
 */
export async function applyTemplate(canvas, template, screenshotUrls, metadata = {}, themes = {}) {
  const slides = getTemplateSlides(template);
  const slide = slides[0];
  const w = template?.canvas?.width ?? DEFAULT_WIDTH;
  const h = template?.canvas?.height ?? DEFAULT_HEIGHT;
  await applyDesignToFrame(canvas, slide, screenshotUrls?.[0], {
    canvasWidth: w,
    canvasHeight: h,
    themes,
    metadata,
    editable: true,
  });
}
