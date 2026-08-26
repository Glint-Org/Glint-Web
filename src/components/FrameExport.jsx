import { useState } from 'react';
import { applyDesignToFrame } from '../utils/templateEngine';
import { createCanvas } from '../utils/canvasEngine';
import {
  downloadBatchZip,
  EXPORT_PRESETS,
  zipFileName,
  buildExportFilenames,
} from '../utils/exportHelper';

/**
 * Export each Frame as an ordered store PNG in a ZIP.
 * Prefers live Fabric canvases so in-editor edits stick.
 */
export default function FrameExport({
  frames,
  getLiveCanvases,
  exportPreset = 'play/phone',
  appName = '',
  themes = {},
  canvasWidth = 1080,
  canvasHeight = 1920,
  onPreviewsReady,
  locale = 'en-US',
}) {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [previews, setPreviews] = useState([]);
  const [layout, setLayout] = useState('flat');

  const preset = EXPORT_PRESETS[exportPreset] ?? EXPORT_PRESETS['play/phone'];

  const renderFrames = async () => {
    const results = [];
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const live = getLiveCanvases?.()?.[i];
      if (live) {
        try {
          const vpt = live.viewportTransform?.slice?.() || [1, 0, 0, 1, 0, 0];
          live.setViewportTransform([1, 0, 0, 1, 0, 0]);
          const url = live.toDataURL({ format: 'png', multiplier: 1 });
          live.setViewportTransform(vpt);
          live.requestRenderAll();
          results.push(url);
          continue;
        } catch {
          // fall through
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

  const publishPreviews = (results) => {
    setPreviews(results);
    onPreviewsReady?.(results);
  };

  const handlePreview = async () => {
    if (!frames.length) return;
    setProcessing(true);
    setProgress('Rendering frames...');
    try {
      const results = await renderFrames();
      publishPreviews(results);
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
        publishPreviews(results);
      }
      const filenames = buildExportFilenames(results.length, {
        exportPreset,
        layout,
        locale,
      });
      await downloadBatchZip(results, filenames, zipFileName(appName));
      setProgress(
        `Exported ${results.length} screenshot(s) as ZIP (${preset.label}${layout === 'fastlane' ? ', Fastlane' : ''})`,
      );
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
      <label className="flex items-center justify-between gap-2 text-xs text-glint-text-secondary">
        <span>ZIP layout</span>
        <select
          value={layout}
          onChange={(e) => setLayout(e.target.value)}
          className="px-2 py-1 rounded-lg border border-glint-border bg-glint-surface text-glint-text"
        >
          <option value="flat">Flat (screen_N.png)</option>
          <option value="fastlane">Fastlane folders</option>
        </select>
      </label>
      <button
        type="button"
        onClick={handlePreview}
        disabled={!frames.length || processing}
        className="w-full px-4 py-2.5 glint-btn-primary rounded-xl text-sm"
      >
        {processing ? 'Processing...' : 'Preview All Frames'}
      </button>
      <button
        type="button"
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
