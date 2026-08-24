import { useState } from 'react';
import { applyDesignToFrame } from '../utils/templateEngine';
import { createCanvas } from '../utils/canvasEngine';
import { downloadBatchZip, EXPORT_PRESETS, zipFileName } from '../utils/exportHelper';

/**
 * Export each Frame as an ordered store PNG in a ZIP.
 * Prefers live Fabric canvases so in-editor edits stick.
 */
export default function FrameExport({
  frames,
  getLiveCanvases,
  exportPreset = 'play',
  appName = '',
  themes = {},
  canvasWidth = 1080,
  canvasHeight = 1920,
}) {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [previews, setPreviews] = useState([]);

  const preset = EXPORT_PRESETS[exportPreset] ?? EXPORT_PRESETS.play;

  const renderFrames = async () => {
    // Always re-render at full store size so viewport zoom on the board
    // cannot shrink exported PNGs. Live edits to text/colors are still on
    // the Fabric objects — for now designs are re-applied from frame state.
    const results = [];
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const live = getLiveCanvases?.()?.[i];
      if (live) {
        try {
          // Temporarily reset viewport for full-res export
          const vpt = live.viewportTransform?.slice?.() || [1, 0, 0, 1, 0, 0];
          live.setViewportTransform([1, 0, 0, 1, 0, 0]);
          const url = live.toDataURL({ format: 'png', multiplier: 1 });
          live.setViewportTransform(vpt);
          live.requestRenderAll();
          results.push(url);
          continue;
        } catch {
          // fall through to offscreen render
        }
      }
      const el = document.createElement('canvas');
      const canvas = createCanvas(el, canvasWidth, canvasHeight);
      try {
        await applyDesignToFrame(canvas, frame.design, frame.screenshotUrl, {
          canvasWidth,
          canvasHeight,
          themes,
          editable: false,
        });
        results.push(canvas.toDataURL({ format: 'png', multiplier: 1 }));
      } finally {
        canvas.dispose();
      }
    }
    return results;
  };

  const handlePreview = async () => {
    if (!frames.length) return;
    setProcessing(true);
    setProgress('Rendering frames...');
    try {
      const results = await renderFrames();
      setPreviews(results);
      setProgress(`Rendered ${results.length} frame(s)`);
    } catch (err) {
      setProgress(`Error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleExportZip = async () => {
    if (!frames.length) return;
    setProcessing(true);
    try {
      let results = previews;
      if (!results.length) {
        setProgress('Rendering frames...');
        results = await renderFrames();
        setPreviews(results);
      }
      const prefix = preset.filename ?? 'screen';
      const filenames = results.map((_, i) => `${prefix}_${i + 1}.png`);
      await downloadBatchZip(results, filenames, zipFileName(appName));
      setProgress(`Exported ${results.length} screenshot(s) as ZIP (${preset.label})`);
    } catch (err) {
      setProgress(`Error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-glint-text">Export Frames</h3>
      <p className="text-xs text-glint-text-secondary">
        {frames.length} frame(s) · {preset.label}
      </p>
      <button
        onClick={handlePreview}
        disabled={!frames.length || processing}
        className="w-full px-4 py-2.5 glint-btn-primary rounded-xl text-sm"
      >
        {processing ? 'Processing...' : 'Preview All Frames'}
      </button>
      <button
        onClick={handleExportZip}
        disabled={!frames.length || processing}
        className="w-full px-4 py-2.5 bg-glint-success text-white rounded-xl hover:opacity-90 disabled:opacity-50 text-sm font-semibold"
      >
        Export All as ZIP
      </button>
      {progress && <p className="text-xs text-glint-text-secondary">{progress}</p>}
      {previews.length > 0 && (
        <div className="grid grid-cols-5 gap-1">
          {previews.map((url, i) => (
            <img key={i} src={url} alt={`Frame ${i + 1}`} className="rounded border border-glint-border" />
          ))}
        </div>
      )}
    </div>
  );
}
