import { useState } from 'react';
import { exportAsPNG, renderScratchFrame } from '../utils/canvasEngine';
import { downloadSinglePNG, downloadBatchZip, EXPORT_PRESETS, zipFileName } from '../utils/exportHelper';

export default function ExportManager({
  canvas,
  screenshots,
  background,
  frame,
  screenshotStyle,
  textOverlay,
  exportPreset = 'play/phone',
  appName = '',
}) {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState('');
  const preset = EXPORT_PRESETS[exportPreset] ?? EXPORT_PRESETS['play/phone'];

  const handleExportSingle = () => {
    if (!canvas) return;
    const dataUrl = exportAsPNG(canvas);
    downloadSinglePNG(dataUrl, 'glint-frame.png');
  };

  const handleExportAll = async () => {
    if (!screenshots.length) return;
    setExporting(true);
    setProgress('Rendering screens...');
    try {
      const dataUrls = [];
      for (let i = 0; i < screenshots.length; i++) {
        setProgress(`Rendering ${i + 1}/${screenshots.length}...`);
        const dataUrl = await renderScratchFrame({
          screenshotUrl: screenshots[i],
          background,
          frameId: frame,
          screenshotStyle,
          text: textOverlay?.text,
          width: preset.width,
          height: preset.height,
        });
        dataUrls.push(dataUrl);
      }
      const filenames = dataUrls.map((_, i) => `${preset.filename || 'screen'}_${i + 1}.png`);
      await downloadBatchZip(dataUrls, filenames, zipFileName(appName));
      setProgress(`Exported ${dataUrls.length} screenshot(s)`);
    } catch (err) {
      setProgress(`Error: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-glint-text-secondary text-[10px] uppercase tracking-wider">Export</h3>
      <p className="text-[11px] text-glint-text-secondary">
        {screenshots.length} screen(s) · {preset.label} ({preset.width}×{preset.height})
      </p>
      <button
        onClick={handleExportSingle}
        disabled={!canvas}
        className="w-full px-4 py-2 glint-btn-primary rounded-lg text-sm disabled:opacity-50"
      >
        Export Current Frame
      </button>
      <button
        onClick={handleExportAll}
        disabled={!screenshots.length || exporting}
        className="w-full px-4 py-2 bg-glint-success text-white rounded-lg hover:opacity-90 disabled:opacity-50 text-sm font-semibold"
      >
        {exporting ? 'Exporting...' : 'Export All as ZIP'}
      </button>
      {progress && <p className="text-xs text-glint-text-secondary">{progress}</p>}
    </div>
  );
}
