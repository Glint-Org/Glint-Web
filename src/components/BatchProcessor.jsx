import { useState } from 'react';
import { renderBatch, getScreenshotSlotCount } from '../utils/templateEngine';
import { fillScreenshotSlots } from '../utils/placeholderScreenshots';
import { loadThemePresets } from '../utils/templateLoader';
import { downloadBatchZip, EXPORT_PRESETS, zipFileName } from '../utils/exportHelper';

export default function BatchProcessor({
  screenshots,
  template,
  metadata,
  exportPreset = 'play/phone',
}) {
  const [processing, setProcessing] = useState(false);
  const [previews, setPreviews] = useState([]);
  const [progress, setProgress] = useState('');

  const preset = EXPORT_PRESETS[exportPreset] ?? EXPORT_PRESETS['play/phone'];
  const exportSize = { width: preset.width, height: preset.height };
  const canRun = !!template;

  const renderAll = async () => {
    const themes = await loadThemePresets();
    const needed = getScreenshotSlotCount(template);
    const urls = fillScreenshotSlots(screenshots || [], needed);
    return renderBatch(urls, template, metadata, themes, exportSize);
  };

  const handleRenderBatch = async () => {
    if (!template) return;
    setProcessing(true);
    setProgress('Rendering templates...');

    try {
      const results = await renderAll();
      setPreviews(results);
      setProgress(`Rendered ${results.length} frame(s) at ${preset.width}x${preset.height}`);
    } catch (err) {
      setProgress(`Error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleExportZip = async () => {
    if (!template) return;
    setProcessing(true);
    try {
      let results = previews;
      if (!results.length) {
        setProgress('Rendering templates...');
        results = await renderAll();
        setPreviews(results);
      }
      const prefix = preset.filename ?? 'screen';
      const filenames = results.map((_, i) => `${prefix}_${i + 1}.png`);
      await downloadBatchZip(results, filenames, `Glint-ss.zip`);
      setProgress(`Exported ${results.length} screenshot(s) as ZIP (${preset.label})`);
    } catch (err) {
      setProgress(`Error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-glint-text">Batch Export</h3>
      <p className="text-xs text-glint-text-secondary">
        {template?.name ?? 'No template'} - 5 slides - {preset.label}
      </p>
      <button
        onClick={handleRenderBatch}
        disabled={!canRun || processing}
        className="w-full px-4 py-2.5 glint-btn-primary rounded-xl text-sm"
      >
        {processing ? 'Processing...' : 'Preview All Screens'}
      </button>
      <button
        onClick={handleExportZip}
        disabled={!canRun || processing}
        className="w-full px-4 py-2.5 bg-glint-success text-white rounded-xl hover:opacity-90 disabled:opacity-50 text-sm font-semibold"
      >
        Export All as ZIP
      </button>
      {progress && <p className="text-xs text-glint-text-secondary">{progress}</p>}
      {previews.length > 0 && (
        <div className="grid grid-cols-5 gap-1">
          {previews.map((url, i) => (
            <img key={i} src={url} alt={`Preview ${i + 1}`} className="rounded border border-glint-border" />
          ))}
        </div>
      )}
    </div>
  );
}
