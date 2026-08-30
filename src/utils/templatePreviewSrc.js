/** Resolve a static gallery strip URL for a template id. */
export function getStaticPreviewUrl(templateId) {
  if (!templateId) return null;
  return `/templates/previews/${templateId}.png`;
}

export function previewCandidates(templateId) {
  if (!templateId) return [];
  return [`/templates/previews/${templateId}.png`, `/templates/previews/${templateId}.webp`];
}

/**
 * Probe / resolve which static preview exists.
 * @returns {Promise<string|null>}
 */
export async function resolveStaticPreview(templateId) {
  if (!templateId) return null;
  return getStaticPreviewUrl(templateId);
}

export function clearPreviewCache() {
  // no-op
}
