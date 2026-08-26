/**
 * Glint project pack (.glintpack) — editable round-trip between Web and View.
 *
 * ZIP layout:
 *   project.json
 *   assets/shots/frame-N.png          raw device screenshots
 *   assets/previews/frame-N.png       rendered store frames (View + QA)
 *   assets/fabric/frame-N/*.png       bitmaps extracted from Fabric JSON
 *
 * Store PNG ZIP stays separate (Play/App Store delivery).
 * View session JSON stays separate (rendered data: handoff).
 */

import JSZip from 'jszip';
import { GLINT_CLONE_PROPS } from './glintCloneProps';

export const GLINTPACK_FORMAT = 'glintpack';
export const GLINTPACK_VERSION = 1;
export const GLINTPACK_EXT = '.glintpack';

function slugApp(appName) {
  const slug = String(appName || '')
    .trim()
    .replace(/[^\w\s-]+/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 48);
  return slug || 'glint-project';
}

export function glintPackFileName(appName) {
  return `${slugApp(appName)}${GLINTPACK_EXT}`;
}

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
 * Build a .glintpack Blob from live editor state.
 */
export async function buildGlintPackBlob({
  frames = [],
  liveCanvases = [],
  template = null,
  appName = 'My App',
  tagline = '',
  store = 'play/phone',
  background = null,
  deviceFrame = null,
  screenshotStyle = null,
  fontFamily = null,
  previewDataUrls = [],
} = {}) {
  const zip = new JSZip();
  const assets = zip.folder('assets');
  const shots = assets.folder('shots');
  const previews = assets.folder('previews');
  const fabricRoot = assets.folder('fabric');

  const packFrames = [];

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const canvas = liveCanvases[i] || null;
    const shotPath = `assets/shots/frame-${i}.png`;
    const previewPath = `assets/previews/frame-${i}.png`;

    const shotB64 = await urlToPngBase64(frame.screenshotUrl);
    if (shotB64) shots.file(`frame-${i}.png`, shotB64, { base64: true });

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

    let fabric = canvasToJson(canvas);
    if (fabric) {
      fabric = JSON.parse(JSON.stringify(fabric));
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
      if (shotB64) {
        walkFabricObjects(fabric.objects, (obj) => {
          if (obj.glintRole === 'framed-screenshot' || obj.glintRole === 'screenshot') {
            if (!obj.glintScreenshotUrl || obj.glintScreenshotUrl.startsWith('blob:') || obj.glintScreenshotUrl.startsWith('data:')) {
              obj.glintScreenshotUrl = shotPath;
            }
          }
        });
      }
    }

    packFrames.push({
      id: frame.id || `frame-${i}`,
      screenshot: shotB64 ? shotPath : null,
      preview: previewB64 ? previewPath : null,
      design: frame.design || null,
      fabric,
    });
  }

  const project = {
    format: GLINTPACK_FORMAT,
    schemaVersion: GLINTPACK_VERSION,
    app: appName || 'My App',
    tagline: tagline || '',
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
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}

export async function downloadGlintPack(blob, appName) {
  const link = document.createElement('a');
  link.download = glintPackFileName(appName);
  link.href = URL.createObjectURL(blob);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

/**
 * Parse a .glintpack (or zip containing project.json) File/Blob/ArrayBuffer.
 * Returns restored editor payload with blob: URLs.
 */
export async function parseGlintPack(input) {
  const zip = await JSZip.loadAsync(input);
  const projectFile = zip.file('project.json');
  if (!projectFile) {
    throw new Error('Not a Glint project pack (missing project.json)');
  }
  const project = JSON.parse(await projectFile.async('string'));
  if (project.format && project.format !== GLINTPACK_FORMAT) {
    throw new Error(`Unsupported pack format: ${project.format}`);
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
    kind: 'glintpack',
    project,
    frames,
    screenshots,
    previews,
    session: {
      app: project.app,
      tagline: project.tagline,
      store: project.store,
      version: '1.0',
      exportedAt: project.exportedAt,
      screens: previews.length ? previews : screenshots,
    },
    editor: project.editor || {},
    templateMeta: project.template || null,
  };
}

export function isGlintPackFile(file) {
  if (!file?.name) return false;
  const n = file.name.toLowerCase();
  return n.endsWith('.glintpack') || n.endsWith('.glint.zip');
}
