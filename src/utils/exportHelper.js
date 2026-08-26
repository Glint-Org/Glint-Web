import JSZip from 'jszip';

export function downloadSinglePNG(dataUrl, filename = 'screenshot.png') {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/** ZIP name: MyApp.zip, or glint.zip when app name is empty. */
export function zipFileName(appName) {
  const slug = String(appName || '')
    .trim()
    .replace(/[^\w\s-]+/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 48);
  return slug ? `${slug}.zip` : 'glint.zip';
}

/**
 * Build store ZIP filenames.
 * @param {'flat'|'fastlane'} layout
 * @param {string} locale - e.g. en-US (Fastlane phoneScreenshots/{locale}/)
 */
export function buildExportFilenames(count, {
  exportPreset = 'play',
  layout = 'flat',
  locale = 'en-US',
} = {}) {
  const preset = EXPORT_PRESETS[exportPreset] ?? EXPORT_PRESETS.play;
  const prefix = preset.filename ?? 'screen';
  const files = [];
  for (let i = 0; i < count; i++) {
    const base = `${prefix}_${i + 1}.png`;
    if (layout === 'fastlane') {
      const folder = preset.fastlaneFolder || 'phoneScreenshots';
      files.push(`${folder}/${locale}/${base}`);
    } else {
      files.push(base);
    }
  }
  return files;
}

export async function downloadBatchZip(dataUrls, filenames, zipName = 'glint.zip') {
  const zip = new JSZip();
  dataUrls.forEach((url, i) => {
    const base64 = url.split(',')[1];
    zip.file(filenames[i] || `screenshot_${i + 1}.png`, base64, { base64: true });
  });
  const blob = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.download = zipName || 'glint.zip';
  link.href = URL.createObjectURL(blob);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

/** Return ZIP as Blob (for headless / MCP). */
export async function buildZipBlob(dataUrls, filenames) {
  const zip = new JSZip();
  dataUrls.forEach((url, i) => {
    const base64 = url.split(',')[1];
    zip.file(filenames[i] || `screenshot_${i + 1}.png`, base64, { base64: true });
  });
  return zip.generateAsync({ type: 'blob' });
}

export function generateSessionJson(screens, appName, tagline, store = 'play', extra = {}) {
  return JSON.stringify({
    app: appName,
    tagline,
    screens,
    store,
    version: '1.0',
    locales: extra.locales || ['en-US'],
    exportedAt: new Date().toISOString(),
    ...extra,
  }, null, 2);
}

export const EXPORT_PRESETS = {
  play: {
    width: 1080,
    height: 1920,
    label: 'Play Store',
    filename: 'screen',
    fastlaneFolder: 'phoneScreenshots',
  },
  ios: {
    width: 1290,
    height: 2796,
    label: 'App Store (iPhone)',
    filename: 'ios_screen',
    fastlaneFolder: 'phoneScreenshots',
  },
  'ios-tablet': {
    width: 2048,
    height: 2732,
    label: 'App Store (iPad)',
    filename: 'ipad_screen',
    fastlaneFolder: 'tabletScreenshots',
  },
};

/** Normalize template.store / session.store to an export preset key. */
export function resolveStoreKey(store) {
  if (store === 'ios-tablet' || store === 'ipad') return 'ios-tablet';
  if (store === 'ios' || store === 'iphone') return 'ios';
  if (store === 'play' || store === 'android') return 'play';
  return EXPORT_PRESETS[store] ? store : 'play';
}

export function storeExportLabel(store, canvas) {
  const key = resolveStoreKey(store);
  const preset = EXPORT_PRESETS[key];
  const w = canvas?.width ?? preset.width;
  const h = canvas?.height ?? preset.height;
  return `${preset.label} · ${w}×${h}`;
}
