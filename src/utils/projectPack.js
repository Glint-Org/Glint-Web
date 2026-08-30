/**
 * Glint project pack — time-capsule round-trip for the editor.
 *
 * .glint format:
 *   [GLINT magic 5B][version 1B][ZIP payload]
 *
 * ZIP layout:
 *   project.json                  metadata + editor state
 *   assets/screenshots/frame-N.png   embedded raw screenshots
 *   assets/previews/frame-N.png      rendered store frames
 *   assets/fabric/frame-N/*.png      bitmaps extracted from Fabric JSON
 *   canvas/frame-N.json              full Fabric canvas JSON
 */

import JSZip from 'jszip';
import { GLINT_CLONE_PROPS } from './glintCloneProps';

export const GLINT_FORMAT = 'glint';
export const GLINT_VERSION = 1;
export const GLINT_EXT = '.glint';
export const GLINT_MAGIC = new Uint8Array([0x47, 0x4C, 0x49, 0x4E, 0x54]); // "GLINT"

export function glintFileName() {
  return `Glint-ss${GLINT_EXT}`;
}

/** @deprecated Use glintFileName */
export const glintPackFileName = glintFileName;

function dataUrlToBase64(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const i = dataUrl.indexOf(',');
  if (i < 0) return null;
  return dataUrl.slice(i + 1);
}

async function urlToPngBase64(url) {
  if (!url) return null;
  if (url.startsWith('data:')) return dataUrlToBase64(url);
  try {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  } catch {
    return null;
  }
}

function walkFabricObjects(objects, visit) {
  if (!Array.isArray(objects)) return;
  for (const obj of objects) {
    visit(obj);
    if (Array.isArray(obj.objects)) walkFabricObjects(obj.objects, visit);
  }
}

function canvasToJson(canvas) {
  if (!canvas) return null;
  if (typeof canvas.toJSON === 'function') {
    return canvas.toJSON(GLINT_CLONE_PROPS);
  }
  if (typeof canvas.toObject === 'function') {
    return canvas.toObject(GLINT_CLONE_PROPS);
  }
  return null;
}

/**
 * Build a .glint Blob from live editor state.
 * Format: [GLINT magic 5B][version 1B][ZIP payload]
 */
export async function buildGlintBlob({
  frames = [],
  liveCanvases = [],
  template = null,
  store = 'play/phone',
  background = null,
  deviceFrame = null,
  screenshotStyle = null,
  fontFamily = null,
  previewDataUrls = [],
} = {}) {
  const zip = new JSZip();
  const assets = zip.folder('assets');
  const screenshots = assets.folder('screenshots');
  const previews = assets.folder('previews');
  const fabricRoot = assets.folder('fabric');
  const canvasFolder = zip.folder('canvas');

  const packFrames = [];

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const canvas = liveCanvases[i] || null;
    const shotPath = `assets/screenshots/frame-${i}.png`;
    const previewPath = `assets/previews/frame-${i}.png`;
    const canvasPath = `canvas/frame-${i}.json`;

    // Embed screenshot as PNG
    const shotB64 = await urlToPngBase64(frame.screenshotUrl);
    if (shotB64) screenshots.file(`frame-${i}.png`, shotB64, { base64: true });

    // Embed preview render as PNG
    let previewB64 = dataUrlToBase64(previewDataUrls[i]);
    if (!previewB64 && canvas?.toDataURL) {
      try {
        previewB64 = dataUrlToBase64(
          canvas.toDataURL({ format: 'png', multiplier: 1 }),
        );
      } catch {
        previewB64 = null;
      }
    }
    if (previewB64) previews.file(`frame-${i}.png`, previewB64, { base64: true });

    // Capture full Fabric canvas JSON
    let fabric = canvasToJson(canvas);
    if (fabric) {
      fabric = JSON.parse(JSON.stringify(fabric));

      // Extract embedded images from Fabric objects
      const frameFolder = fabricRoot.folder(`frame-${i}`);
      let imgIdx = 0;
      const extractSrc = async (obj) => {
        const src = obj.src || obj.glintScreenshotUrl;
        if (!src || typeof src !== 'string') return;
        if (src.startsWith('assets/')) return;
        const b64 = await urlToPngBase64(src);
        if (!b64) return;
        const name = `img-${imgIdx++}.png`;
        frameFolder.file(name, b64, { base64: true });
        const rel = `assets/fabric/frame-${i}/${name}`;
        if (obj.src) obj.src = rel;
        if (obj.glintScreenshotUrl && (obj.glintScreenshotUrl.startsWith('data:') || obj.glintScreenshotUrl.startsWith('blob:'))) {
          obj.glintScreenshotUrl = shotB64 ? shotPath : rel;
        }
      };
      const jobs = [];
      walkFabricObjects(fabric.objects, (obj) => {
        jobs.push(extractSrc(obj));
      });
      if (fabric.backgroundImage) jobs.push(extractSrc(fabric.backgroundImage));
      await Promise.all(jobs);

      // Rewrite screenshot URLs to asset paths
      if (shotB64) {
        walkFabricObjects(fabric.objects, (obj) => {
          if (obj.glintRole === 'framed-screenshot' || obj.glintRole === 'screenshot') {
            if (!obj.glintScreenshotUrl || obj.glintScreenshotUrl.startsWith('blob:') || obj.glintScreenshotUrl.startsWith('data:')) {
              obj.glintScreenshotUrl = shotPath;
            }
          }
        });
      }

      // Save full canvas JSON
      canvasFolder.file(`frame-${i}.json`, JSON.stringify(fabric, null, 2));
    }

    packFrames.push({
      id: frame.id || `frame-${i}`,
      screenshot: shotB64 ? shotPath : null,
      preview: previewB64 ? previewPath : null,
      design: frame.design || null,
      fabric,
      canvas: canvasPath,
    });
  }

  const project = {
    format: GLINT_FORMAT,
    schemaVersion: GLINT_VERSION,
    store: store || 'play/phone',
    exportedAt: new Date().toISOString(),
    editor: {
      background,
      deviceFrame,
      screenshotStyle,
      fontFamily,
    },
    template: template
      ? {
          id: template.id,
          name: template.name,
          store: template.store,
          canvas: template.canvas,
        }
      : null,
    frames: packFrames,
  };

  zip.file('project.json', JSON.stringify(project, null, 2));

  // Generate ZIP payload as arraybuffer
  const zipArrayBuffer = await zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' });
  const zipBytes = new Uint8Array(zipArrayBuffer);

  // Build .glint binary: [MAGIC 5B][VERSION 1B][ZIP]
  const header = new Uint8Array(6);
  header.set(GLINT_MAGIC, 0);
  header[5] = GLINT_VERSION;

  return new Blob([header, zipBytes], { type: 'application/octet-stream' });
}

/** @deprecated Use buildGlintBlob */
export const buildGlintPackBlob = buildGlintBlob;

export async function downloadGlint(blob) {
  const link = document.createElement('a');
  link.download = glintFileName();
  link.href = URL.createObjectURL(blob);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

/** @deprecated Use downloadGlint */
export const downloadGlintPack = downloadGlint;

/**
 * Check if a Uint8Array starts with the GLINT magic header.
 */
export function isGlintMagic(bytes) {
  if (!bytes || bytes.length < 5) return false;
  return (
    bytes[0] === 0x47 &&
    bytes[1] === 0x4C &&
    bytes[2] === 0x49 &&
    bytes[3] === 0x4E &&
    bytes[4] === 0x54
  );
}

/**
 * Parse a .glint file (magic header + ZIP).
 * Returns restored editor payload with blob: URLs.
 */
async function readBlobAsArrayBuffer(blob) {
  if (blob.arrayBuffer) return blob.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
}

export async function parseGlint(input) {
  let buffer;

  if (input instanceof Blob) {
    buffer = await readBlobAsArrayBuffer(input);
  } else if (input instanceof ArrayBuffer) {
    buffer = input;
  } else if (input?.buffer instanceof ArrayBuffer) {
    buffer = input.buffer;
  } else {
    throw new Error('Invalid input: expected Blob or ArrayBuffer');
  }

  const bytes = new Uint8Array(buffer);

  let zipInput;
  if (isGlintMagic(bytes)) {
    // .glint format: skip 6-byte header
    zipInput = buffer.slice(6);
  } else {
    throw new Error('Not a .glint file (missing GLINT header)');
  }

  const zip = await JSZip.loadAsync(zipInput);
  const projectFile = zip.file('project.json');
  if (!projectFile) {
    throw new Error('Not a Glint file (missing project.json)');
  }
  const project = JSON.parse(await projectFile.async('string'));
  if (project.format && project.format !== GLINT_FORMAT) {
    throw new Error(`Unsupported format: ${project.format}`);
  }

  const blobUrlFor = async (relPath) => {
    if (!relPath) return null;
    const f = zip.file(relPath);
    if (!f) return null;
    const blob = await f.async('blob');
    return URL.createObjectURL(blob);
  };

  const rewriteFabric = async (fabric) => {
    if (!fabric) return null;
    const clone = JSON.parse(JSON.stringify(fabric));
    const jobs = [];
    const rewrite = (obj) => {
      if (!obj) return;
      if (typeof obj.src === 'string' && obj.src.startsWith('assets/')) {
        jobs.push(
          blobUrlFor(obj.src).then((url) => {
            if (url) obj.src = url;
          }),
        );
      }
      if (typeof obj.glintScreenshotUrl === 'string' && obj.glintScreenshotUrl.startsWith('assets/')) {
        jobs.push(
          blobUrlFor(obj.glintScreenshotUrl).then((url) => {
            if (url) obj.glintScreenshotUrl = url;
          }),
        );
      }
    };
    walkFabricObjects(clone.objects, rewrite);
    if (clone.backgroundImage) rewrite(clone.backgroundImage);
    await Promise.all(jobs);
    return clone;
  };

  const frames = [];
  const screenshots = [];
  const previews = [];

  for (let i = 0; i < (project.frames || []).length; i++) {
    const f = project.frames[i];
    const shotUrl = await blobUrlFor(f.screenshot);
    const previewUrl = await blobUrlFor(f.preview);
    const fabric = await rewriteFabric(f.fabric);
    frames.push({
      id: f.id || `frame-${i}`,
      design: f.design || null,
      screenshotUrl: shotUrl || previewUrl,
      fabricJson: fabric,
      fabricRestoreKey: `pack-${i}-${Date.now()}`,
    });
    if (shotUrl) screenshots.push(shotUrl);
    else if (previewUrl) screenshots.push(previewUrl);
    if (previewUrl) previews.push(previewUrl);
  }

  return {
    kind: GLINT_FORMAT,
    project,
    frames,
    screenshots,
    previews,
    session: {
      store: project.store,
      version: '1.0',
      exportedAt: project.exportedAt,
      screens: previews.length ? previews : screenshots,
    },
    editor: project.editor || {},
    templateMeta: project.template || null,
  };
}

export function isGlintFile(file) {
  if (!file?.name) return false;
  const n = file.name.toLowerCase();
  return n.endsWith('.glint') || n.endsWith('.glint.zip');
}

