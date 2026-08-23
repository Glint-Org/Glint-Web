import { FabricImage, Rect, Text, loadSVGFromString, util } from 'fabric';
import { createCanvas, setBackground } from './canvasEngine';
import { getTheme } from './templateLoader';

const DEFAULT_WIDTH = 1080;
const DEFAULT_HEIGHT = 1920;

function resolvePosition(position, canvasW, canvasH, objW, objH, layer = {}) {
  const marginTop = layer.marginTop ?? 0;
  const marginLeft = layer.marginLeft ?? 0;

  switch (position) {
    case 'top': return { left: (canvasW - objW) / 2, top: marginTop };
    case 'left': return { left: marginLeft, top: marginTop };
    case 'right': return { left: canvasW - objW - 40, top: marginTop + 200 };
    case 'center': return { left: (canvasW - objW) / 2, top: (canvasH - objH) / 2 };
    case 'bottom-center': return { left: (canvasW - objW) / 2, top: canvasH - objH - 80 };
    case 'top-right': return { left: canvasW - objW - 60, top: 60 };
    case 'grid-2': return { left: (canvasW - objW) / 2, top: marginTop };
    default: return { left: (canvasW - objW) / 2, top: marginTop || 100 };
  }
}

async function loadFrameSvg(frameId) {
  const res = await fetch(`/frames/${frameId}.svg`);
  if (!res.ok) throw new Error(`Frame not found: ${frameId}`);
  return res.text();
}

async function addScreenshotLayer(canvas, screenshotUrl, layer, canvasW, canvasH) {
  const scale = layer.scale ?? 0.7;
  const img = await FabricImage.fromURL(screenshotUrl, { crossOrigin: 'anonymous' });
  const maxW = canvasW * scale;
  const maxH = canvasH * scale;
  const imgScale = Math.min(maxW / (img.width || 1), maxH / (img.height || 1), 1);

  img.set({ scaleX: imgScale, scaleY: imgScale, evented: false, selectable: false });

  const objW = img.width * imgScale;
  const objH = img.height * imgScale;
  const pos = resolvePosition(layer.position ?? 'center', canvasW, canvasH, objW, objH, layer);
  img.set({ left: pos.left, top: pos.top });

  if (layer.rounded) {
    img.set({ clipPath: new Rect({
      width: objW, height: objH, rx: layer.rounded, ry: layer.rounded,
      originX: 'center', originY: 'center',
    })});
  }

  canvas.add(img);
  return img;
}

async function addFrameLayer(canvas, frameId, layer, canvasW, canvasH) {
  if (!frameId) return null;
  try {
    const svg = await loadFrameSvg(frameId);
    const { objects, options } = await loadSVGFromString(svg);
    const frame = util.groupSVGElements(objects, options);
    const scale = layer.scale ?? 0.75;

    frame.set({ scaleX: scale, scaleY: scale, evented: false, selectable: false });

    const objW = canvasW * scale;
    const objH = canvasH * scale;
    const pos = resolvePosition(layer.position ?? 'center', canvasW, canvasH, objW, objH, layer);
    frame.set({ left: pos.left, top: pos.top });
    canvas.add(frame);
    return frame;
  } catch {
    return null;
  }
}

function addTextLayer(canvas, layer, metadata, canvasW, canvasH) {
  const text = metadata.headline || metadata.tagline || layer.placeholder || '';
  if (!text) return null;

  const fb = new Text(text, {
    fontSize: layer.fontSize ?? 36,
    fontFamily: `${layer.fontFamily || 'Inter'}, sans-serif`,
    fontWeight: layer.fontWeight ?? 'normal',
    fill: layer.color ?? '#ffffff',
    textAlign: layer.position === 'left' ? 'left' : 'center',
    originX: layer.position === 'left' ? 'left' : 'center',
    evented: false,
    selectable: false,
  });

  const pos = resolvePosition(layer.position ?? 'top', canvasW, canvasH, fb.width, fb.height, layer);
  fb.set({ left: layer.position === 'left' ? pos.left : canvasW / 2, top: pos.top });
  canvas.add(fb);
  return fb;
}

function addBadgeLayer(canvas, layer, canvasW) {
  const text = layer.text ?? 'NEW';
  const padding = 16;
  const fb = new Text(text, {
    fontSize: 20, fontFamily: 'Inter, sans-serif', fontWeight: 'bold',
    fill: layer.color ?? '#ffffff', evented: false, selectable: false,
  });

  const bg = new Rect({
    width: fb.width + padding * 2, height: fb.height + padding,
    fill: layer.background ?? '#ff4757', rx: 8, ry: 8,
    evented: false, selectable: false,
  });

  const groupLeft = canvasW - bg.width - 60;
  bg.set({ left: groupLeft, top: 60 });
  fb.set({ left: groupLeft + padding, top: 60 + padding / 2 });
  canvas.add(bg, fb);
}

function addBulletsLayer(canvas, layer) {
  const items = layer.items ?? [];
  items.forEach((item, i) => {
    const fb = new Text(`• ${item}`, {
      left: layer.marginLeft ?? 80,
      top: (layer.marginTop ?? 200) + i * 48,
      fontSize: layer.fontSize ?? 28,
      fontFamily: 'Inter, sans-serif',
      fill: layer.color ?? '#ffffff',
      evented: false, selectable: false,
    });
    canvas.add(fb);
  });
}

/**
 * Render a multi-screenshot template.
 * Supports screenshot slots (0, 1, 2...) and device frames per slot.
 */
export async function renderTemplateFrame(template, screenshotUrls, metadata = {}, themes = {}) {
  const layers = template?.layers ?? [];
  const canvasW = template.canvas?.width ?? DEFAULT_WIDTH;
  const canvasH = template.canvas?.height ?? DEFAULT_HEIGHT;

  const container = document.createElement('canvas');
  const canvas = createCanvas(container);
  canvas.setDimensions({ width: canvasW, height: canvasH });

  try {
    for (const layer of layers) {
      switch (layer.type) {
        case 'background': {
          const theme = getTheme(layer.theme, themes);
          setBackground(canvas, theme.type, theme.value);
          break;
        }
        case 'headline':
        case 'subheadline':
          addTextLayer(canvas, layer, metadata, canvasW, canvasH);
          break;
        case 'screenshot': {
          const slotIndex = layer.slot ?? 0;
          const url = Array.isArray(screenshotUrls) ? screenshotUrls[slotIndex] : screenshotUrls;
          if (url) await addScreenshotLayer(canvas, url, layer, canvasW, canvasH);
          break;
        }
        case 'device-frame':
          await addFrameLayer(canvas, layer.frame, layer, canvasW, canvasH);
          break;
        case 'badge':
          addBadgeLayer(canvas, layer, canvasW);
          break;
        case 'bullets':
          addBulletsLayer(canvas, layer);
          break;
      }
    }
    canvas.renderAll();
    return canvas.toDataURL({ format: 'png', multiplier: 1 });
  } finally {
    canvas.dispose();
  }
}

/**
 * Render all screenshots through a template.
 */
export async function renderBatch(screenshots, template, metadata = {}, themes = {}, exportSize = null) {
  const effectiveTemplate = exportSize
    ? { ...template, canvas: { width: exportSize.width, height: exportSize.height } }
    : template;

  const results = [];
  const slotsNeeded = Math.max(
    ...((template?.layers ?? []).filter((l) => l.type === 'screenshot').map((l) => (l.slot ?? 0) + 1)),
    1,
  );

  const chunkSize = Math.max(slotsNeeded, 1);

  for (let i = 0; i < screenshots.length; i += chunkSize) {
    const chunk = screenshots.slice(i, i + chunkSize);
    try {
      const frameMeta = { ...metadata, slot: i };
      const dataUrl = await renderTemplateFrame(effectiveTemplate, chunk, frameMeta, themes);
      results.push(dataUrl);
    } catch {
      // Skip failed frames
    }
  }
  return results;
}

/**
 * Apply template to live canvas (editor preview).
 */
export async function applyTemplate(canvas, template, screenshotUrls, metadata = {}, themes = {}) {
  const layers = template?.layers ?? [];
  const canvasW = template.canvas?.width ?? DEFAULT_WIDTH;
  const canvasH = template.canvas?.height ?? DEFAULT_HEIGHT;

  canvas.clear();
  canvas.setDimensions({ width: canvasW, height: canvasH });

  for (const layer of layers) {
    switch (layer.type) {
      case 'background': {
        const theme = getTheme(layer.theme, themes);
        setBackground(canvas, theme.type, theme.value);
        break;
      }
      case 'headline':
      case 'subheadline':
        addTextLayer(canvas, layer, metadata, canvasW, canvasH);
        break;
      case 'screenshot': {
        const slotIndex = layer.slot ?? 0;
        const url = Array.isArray(screenshotUrls) ? screenshotUrls[slotIndex] : screenshotUrls;
        if (url) await addScreenshotLayer(canvas, url, layer, canvasW, canvasH);
        break;
      }
      case 'device-frame':
        await addFrameLayer(canvas, layer.frame, layer, canvasW, canvasH);
        break;
      case 'badge':
        addBadgeLayer(canvas, layer, canvasW);
        break;
      case 'bullets':
        addBulletsLayer(canvas, layer);
        break;
    }
  }
  canvas.renderAll();
}
