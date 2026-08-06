import { Canvas, FabricImage, Gradient, Text, loadSVGFromString, util } from 'fabric';

const FRAME_WIDTH = 1080;
const FRAME_HEIGHT = 1920;

export function createCanvas(container) {
  const canvas = new Canvas(container, {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    backgroundColor: '#ffffff',
    preserveObjectStacking: true,
  });
  return canvas;
}

export async function addImageToCanvas(canvas, imgUrl, opts = {}) {
  const img = await FabricImage.fromURL(imgUrl, { crossOrigin: 'anonymous' });
  const maxW = FRAME_WIDTH * 0.85;
  const maxH = FRAME_HEIGHT * 0.7;
  const scale = Math.min(maxW / img.width, maxH / img.height, 1);
  img.set({
    left: opts.left ?? (FRAME_WIDTH - img.width * scale) / 2,
    top: opts.top ?? 100,
    scaleX: scale,
    scaleY: scale,
    ...opts,
  });
  canvas.add(img);
  canvas.renderAll();
  return img;
}

export async function applyFrame(canvas, frameSvg) {
  const { objects, options } = await loadSVGFromString(frameSvg);
  const frame = util.groupSVGElements(objects, options);
  frame.set({
    left: 0,
    top: 0,
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    evented: false,
    selectable: false,
  });
  canvas.add(frame);
  canvas.renderAll();
  return frame;
}

export function setBackground(canvas, type, value) {
  if (type === 'gradient') {
    canvas.setBackgroundColor(
      new Gradient({
        type: 'linear',
        coords: { x1: 0, y1: 0, x2: FRAME_WIDTH, y2: FRAME_HEIGHT },
        colorStops: value,
      }),
      () => canvas.renderAll(),
    );
  } else {
    canvas.setBackgroundColor(value, () => canvas.renderAll());
  }
}

export function addTextOverlay(canvas, text, opts = {}) {
  const fb = new Text(text, {
    left: FRAME_WIDTH / 2,
    top: FRAME_HEIGHT - 120,
    fontSize: 36,
    fontFamily: 'Inter, sans-serif',
    fill: '#ffffff',
    textAlign: 'center',
    originX: 'center',
    ...opts,
  });
  canvas.add(fb);
  canvas.renderAll();
  return fb;
}

export function reorderScreenshots(canvas, oldIndex, newIndex) {
  const objects = canvas.getObjects().filter((o) => o.type === 'image');
  if (oldIndex < 0 || oldIndex >= objects.length) return;
  const [moved] = objects.splice(oldIndex, 1);
  objects.splice(newIndex, 0, moved);
  canvas.clear().renderAll();
  objects.forEach((obj) => canvas.add(obj));
  canvas.renderAll();
}

export function exportAsPNG(canvas) {
  return canvas.toDataURL({ format: 'png', multiplier: 1 });
}

export function clearCanvas(canvas) {
  canvas.clear();
  canvas.backgroundColor = '#ffffff';
  canvas.renderAll();
}
