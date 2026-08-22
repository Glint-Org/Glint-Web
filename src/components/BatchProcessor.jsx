import { useState } from 'react';
import { renderBatch } from '../utils/templateEngine';
import { loadThemePresets } from '../utils/templateLoader';
import { downloadBatchZip, EXPORT_PRESETS } from '../utils/exportHelper';

export default function BatchProcessor({
  screenshots,
  template,
  metadata,
  exportPreset = 'play',
}) {
  const [processing, setProcessing] = useState(false);
  const [previews, setPreviews] = useState([]);
  const [progress, setProgress] = useState('');

  const preset = EXPORT_PRESETS[exportPreset] ?? EXPORT_PRESETS.play;
  const exportSize = { width: preset.width, height: preset.height };

  const renderAll = async () => {
    const themes = await loadThemePresets();
    return renderBatch(screenshots, template, metadata, themes, exportSize);
  };

  const handleRenderBatch = async () => {
    if (!template || !screenshots.length) return;
    setProcessing(true);
    setProgress('Rendering templates...');

    try {
      const results = await renderAll();
      setPreviews(results);
      setProgress(`Rendered ${results.length} frame(s) at ${preset.width}×${preset.height}`);
    } catch (err) {
      setProgress(`Error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleExportZip = async () => {
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
      await downloadBatchZip(results, filenames);
      setProgress(`Exported ${results.length} screenshot(s) as ZIP (${preset.label})`);
    } catch (err) {
      setProgress(`Error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-800">Batch Export</h3>
      <p className="text-xs text-gray-500">
        {template?.name ?? 'No template'} → {screenshots.length} screen(s) → {preset.label}
      </p>
      <button
        onClick={handleRenderBatch}
        disabled={!template || !screenshots.length || processing}
        className="w-full px-4 py-2.5 glint-btn-primary rounded-xl text-sm"
      >
        {processing ? 'Processing...' : 'Preview All Screens'}
      </button>
      <button
        onClick={handleExportZip}
        disabled={!template || !screenshots.length || processing}
        className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 text-sm font-semibold"
      >
        Export All as ZIP
      </button>
      {progress && <p className="text-xs text-gray-500">{progress}</p>}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
          {previews.map((url, i) => (
            <img key={i} src={url} alt={`Preview ${i + 1}`} className="rounded-lg border border-gray-200" />
          ))}
        </div>
      )}
    </div>
  );
}
