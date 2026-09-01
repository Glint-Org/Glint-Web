import { getWhiteScreenshot } from './placeholderScreenshots';

/** Drag-and-drop MIME for screenshot URLs between Assets and frames. */
export const GLINT_SHOT_MIME = 'application/x-glint-screenshot';

export function isUserScreenshot(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    if (url === getWhiteScreenshot()) return false;
  } catch {
    /* SSR */
  }
  return true;
}

/** Merge new ingested items; skip duplicates and white placeholders. */
export function mergeAssetItems(existing = [], incoming = []) {
  const seen = new Set(existing.map((a) => a.url));
  const added = [];
  for (const item of incoming) {
    const url = item?.url;
    if (!isUserScreenshot(url) || seen.has(url)) continue;
    seen.add(url);
    added.push({
      id: item.id || `asset-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      url,
      name: item.name || 'Screenshot',
    });
  }
  return [...existing, ...added];
}

export function readDroppedScreenshotUrl(dataTransfer) {
  if (!dataTransfer) return null;
  const url = dataTransfer.getData(GLINT_SHOT_MIME);
  if (isUserScreenshot(url)) return url;
  return null;
}
