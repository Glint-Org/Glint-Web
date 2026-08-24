import FrameExport from './FrameExport';
import QRExporter from './QRExporter';
import ExportManager from './ExportManager';

/**
 * Export panel for the left design sidebar (metadata + ZIP).
 */
export default function ExportPanel({
  frames,
  getLiveCanvases,
  exportPreset,
  setExportPreset,
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
        <select
          value={exportPreset}
          onChange={(e) => setExportPreset(e.target.value)}
          className="w-full px-2.5 py-1.5 border border-glint-border rounded-lg text-xs bg-glint-bg text-glint-text"
        >
          <option value="play">Play Store (1080×1920)</option>
          <option value="ios">App Store Phone (1290×2796)</option>
          <option value="ios-tablet">App Store Tablet (2048×2732)</option>
        </select>
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

      <QRExporter session={session ?? { app: appName, tagline, store: exportPreset }} />
    </div>
  );
}
