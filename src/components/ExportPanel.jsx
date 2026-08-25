import { useState } from 'react';
import FrameExport from './FrameExport';
import QRExporter from './QRExporter';
import ExportManager from './ExportManager';
import { storeExportLabel } from '../utils/exportHelper';

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
}) {
  const [exportedUrls, setExportedUrls] = useState([]);
  const sizeLabel = storeExportLabel(
    template?.store || exportPreset,
    template?.canvas || { width: canvasWidth, height: canvasHeight },
  );

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h3 className="font-semibold text-glint-text-secondary text-[10px] uppercase tracking-wider">
          Store metadata
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
          placeholder="Tagline / headline"
          value={tagline}
          onChange={(e) => {
            setTagline(e.target.value);
            setTextOverlay((p) => ({ ...p, text: e.target.value }));
          }}
          className="w-full px-2.5 py-1.5 border border-glint-border rounded-lg text-xs bg-glint-bg text-glint-text"
        />
        <div className="rounded-lg border border-glint-border bg-glint-bg px-2.5 py-2 space-y-0.5">
          <p className="text-[10px] uppercase tracking-wider text-glint-text-tertiary">Export size</p>
          <p className="text-xs font-medium text-glint-text">{sizeLabel}</p>
          <p className="text-[10px] text-glint-text-tertiary leading-relaxed">
            {template
              ? 'Locked to your template. Change store under Templates (Play / App Store / iPad).'
              : 'Pick a Play / App Store / iPad template to set export size.'}
          </p>
        </div>
        <p className="text-[10px] text-glint-text-tertiary">
          ZIP is named from app name, or glint.zip if empty.
        </p>
      </div>

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
