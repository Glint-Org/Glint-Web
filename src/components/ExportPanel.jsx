import { useState } from 'react';
import FrameExport from './FrameExport';
import QRExporter from './QRExporter';
import ExportManager from './ExportManager';
import { storeExportLabel } from '../utils/exportHelper';
import { buildGlintPackBlob, downloadGlintPack } from '../utils/projectPack';

/**
 * Export panel — store size is locked to the selected template.
 */
export default function ExportPanel({
  frames,
  getLiveCanvases,
  exportPreset,
  appName,
  setAppName,
  tagline,
  setTagline,
  setTextOverlay,
  themes,
  canvasWidth,
  canvasHeight,
  session,
  template,
  activeCanvas,
  screenshotList,
  background,
  deviceFrame,
  screenshotStyle,
  textOverlay,
  fontFamily,
}) {
  const [exportedUrls, setExportedUrls] = useState([]);
  const [packing, setPacking] = useState(false);
  const sizeLabel = storeExportLabel(
    template?.store || exportPreset,
    template?.canvas || { width: canvasWidth, height: canvasHeight },
  );

  const handleDownloadPack = async () => {
    setPacking(true);
    try {
      const live = getLiveCanvases?.() || [];
      const blob = await buildGlintPackBlob({
        frames,
        liveCanvases: live,
        template,
        appName,
        tagline,
        store: exportPreset,
        background,
        deviceFrame,
        screenshotStyle,
        fontFamily,
        previewDataUrls: exportedUrls,
      });
      await downloadGlintPack(blob, appName);
    } catch (err) {
      console.error(err);
      alert(`Project pack failed: ${err.message || err}`);
    } finally {
      setPacking(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h3 className="font-semibold text-glint-text-secondary text-[10px] uppercase tracking-wider">
          Metadata
        </h3>
        <input
          type="text"
          placeholder="App name"
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
          className="w-full px-2.5 py-1.5 border border-glint-border rounded-lg text-xs bg-glint-bg text-glint-text"
        />
        <input
          type="text"
          placeholder="Tagline"
          value={tagline}
          onChange={(e) => {
            setTagline(e.target.value);
            setTextOverlay((p) => ({ ...p, text: e.target.value }));
          }}
          className="w-full px-2.5 py-1.5 border border-glint-border rounded-lg text-xs bg-glint-bg text-glint-text"
        />
        <p className="text-[11px] text-glint-text-secondary px-0.5">{sizeLabel}</p>
      </div>

      <button
        type="button"
        disabled={packing || !frames?.length}
        onClick={handleDownloadPack}
        className="w-full px-3 py-2 glint-btn-primary rounded-lg text-xs disabled:opacity-50"
      >
        {packing ? 'Building…' : 'Download .glintpack'}
      </button>

      <FrameExport
        frames={frames}
        getLiveCanvases={getLiveCanvases}
        exportPreset={exportPreset}
        appName={appName}
        themes={themes}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        onPreviewsReady={setExportedUrls}
      />

      {!template && activeCanvas && (
        <ExportManager
          canvas={activeCanvas}
          screenshots={screenshotList}
          background={background}
          frame={deviceFrame}
          screenshotStyle={screenshotStyle}
          textOverlay={textOverlay}
          appName={appName}
          exportPreset={exportPreset}
        />
      )}

      <QRExporter
        session={{
          ...(session ?? {}),
          app: appName || session?.app || 'My App',
          tagline: tagline ?? session?.tagline ?? '',
          store: exportPreset,
        }}
        exportedUrls={exportedUrls}
      />
    </div>
  );
}
