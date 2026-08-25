/** Resolve a static gallery strip URL for a template id, if the file exists. */
const EXT = ['webp', 'png', 'jpg', 'jpeg'];

const cache = new Map();

export function previewCandidates(templateId) {
  if (!templateId) return [];
  return EXT.map((ext) => `/templates/previews/${templateId}.${ext}`);
}

/**
 * Probe which static preview exists (HEAD). Cached per id.
 * @returns {Promise<string|null>}
 */
export async function resolveStaticPreview(templateId) {
  if (!templateId) return null;
  if (cache.has(templateId)) return cache.get(templateId);

  for (const url of previewCandidates(templateId)) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok) {
        cache.set(templateId, url);
        return url;
      }
    } catch {
      // try next
    }
  }
  cache.set(templateId, null);
  return null;
}

export function clearPreviewCache() {
  cache.clear();
}
