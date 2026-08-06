import JSZip from 'jszip';

export function downloadSinglePNG(dataUrl, filename = 'screenshot.png') {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function downloadBatchZip(dataUrls, filenames) {
  const zip = new JSZip();
  dataUrls.forEach((url, i) => {
    const base64 = url.split(',')[1];
    zip.file(filenames[i] || `screenshot_${i + 1}.png`, base64, { base64: true });
  });
  const blob = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.download = 'telor-export.zip';
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
  ios: { width: 1290, height: 2796, label: 'App Store Phone', filename: 'ios_screen' },
  'ios-tablet': { width: 2048, height: 2732, label: 'App Store Tablet', filename: 'ipad_screen' },
};
