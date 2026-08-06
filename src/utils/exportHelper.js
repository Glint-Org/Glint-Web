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

export function generateSessionJson(screens, appName, tagline) {
  return JSON.stringify({
    app: appName,
    tagline,
    screens,
    version: '1.0',
    exportedAt: new Date().toISOString(),
  }, null, 2);
}
