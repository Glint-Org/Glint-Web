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

export function generateSessionJson(screens, appName, tagline, store = 'play') {
  return JSON.stringify({
    app: appName,
    tagline,
    screens,
    store,
    version: '1.0',
    exportedAt: new Date().toISOString(),
  }, null, 2);
}

export const EXPORT_PRESETS = {
  play: { width: 1080, height: 1920, label: 'Play Store', filename: 'screen' },
  ios: { width: 1290, height: 2796, label: 'App Store (iPhone)', filename: 'ios_screen' },
  'ios-tablet': { width: 2048, height: 2732, label: 'App Store (iPad)', filename: 'ipad_screen' },
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
