import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import FrameEditor from '../components/FrameEditor';
import FrameSelector from '../components/FrameSelector';
import ThemeSelector from '../components/ThemeSelector';
import ExportManager from '../components/ExportManager';
import TemplateGallery from '../components/TemplateGallery';
import SessionImporter from '../components/SessionImporter';
import ScreenshotReorder from '../components/ScreenshotReorder';
import BatchProcessor from '../components/BatchProcessor';
import QRExporter from '../components/QRExporter';
import AdSlot from '../components/AdSlot';
import { useGLINTBridge } from '../hooks/useGLINTBridge';
import { applyTemplate } from '../utils/templateEngine';
import { loadThemePresets } from '../utils/templateLoader';

export default function Editor() {
  const location = useLocation();
  const [screenshots, setScreenshots] = useState(location.state?.screenshots || []);
  const [session, setSession] = useState(location.state?.session || null);
  const [background, setBackground] = useState(null);
  const [frame, setFrame] = useState(null);
  const [template, setTemplate] = useState(null);
  const [textOverlay, setTextOverlay] = useState({ text: '', style: {} });
  const [appName, setAppName] = useState(session?.app ?? '');
  const [tagline, setTagline] = useState(session?.tagline ?? '');
  const [exportPreset, setExportPreset] = useState(session?.store ?? 'play');
  const [canvas, setCanvas] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [themes, setThemes] = useState({});
  const bridge = useGLINTBridge();

  useEffect(() => {
    loadThemePresets().then(setThemes);
  }, []);

  useEffect(() => {
    if (bridge.screenshots.length > 0) {
      setScreenshots((prev) => [...prev, ...bridge.screenshots]);
    }
  }, [bridge.screenshots]);

  useEffect(() => {
    if (!canvas || !template || !screenshots.length) return;
    const meta = { headline: textOverlay.text || tagline, tagline, app: appName };
    applyTemplate(canvas, template, screenshots[previewIndex], meta, themes);
  }, [canvas, template, screenshots, previewIndex, textOverlay, tagline, appName, themes]);

  const handleSessionImport = ({ screenshots: imported, session: importedSession }) => {
    setScreenshots(imported);
    setSession(importedSession);
    setAppName(importedSession.app ?? '');
    setTagline(importedSession.tagline ?? '');
    setExportPreset(importedSession.store ?? 'play');
    setPreviewIndex(0);
  };

  return (
    <div className="min-h-screen glint-gradient-bg flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-violet-100/60 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">T</div>
          <h1 className="text-lg font-bold text-gray-900">Glint Editor</h1>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          bridge.connected ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {bridge.connected ? '● Bridge Connected' : '○ Bridge Offline'}
        </span>
      </header>

      <AdSlot slot="editor-banner" />

      <div className="flex flex-1">
        <aside className="w-72 bg-white/90 backdrop-blur-sm border-r border-violet-100/60 p-4 space-y-6 overflow-y-auto">
          <SessionImporter onImport={handleSessionImport} />

          {bridge.connected && (
            <button
              onClick={() => bridge.captureSingle()}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Capture from Device
            </button>
          )}

          <TemplateGallery selected={template} onChange={setTemplate} />

          <ScreenshotReorder screenshots={screenshots} onReorder={setScreenshots} />

          <div className="space-y-2">
            <h3 className="font-semibold text-gray-700">App Info</h3>
            <input
              type="text"
              placeholder="App name"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
            <input
              type="text"
              placeholder="Tagline / headline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-gray-700">Export Preset</h3>
            <select
              value={exportPreset}
              onChange={(e) => setExportPreset(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="play">Play Store (1080×1920)</option>
              <option value="ios">App Store Phone (1290×2796)</option>
              <option value="ios-tablet">App Store Tablet (2048×2732)</option>
            </select>
          </div>

          {!template && (
            <>
              <FrameSelector selected={frame} onChange={setFrame} />
              <ThemeSelector selected={background} onChange={setBackground} />
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-700">Text Overlay</h3>
                <input
                  type="text"
                  placeholder="App name"
                  value={textOverlay.text}
                  onChange={(e) => setTextOverlay((p) => ({ ...p, text: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <ExportManager canvas={canvas} screenshots={screenshots} />
            </>
          )}

          {template && (
            <BatchProcessor
              screenshots={screenshots}
              template={template}
              metadata={{ headline: tagline, tagline, app: appName }}
              exportPreset={exportPreset}
            />
          )}

          <QRExporter session={session ?? { app: appName, tagline, store: exportPreset }} />
        </aside>

        <main className="flex-1 p-6 overflow-auto">
          {screenshots.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>Upload screenshots, import a session folder, or connect to Glint Bridge</p>
            </div>
          ) : (
            <div className="space-y-4">
              {template && screenshots.length > 1 && (
                <div className="flex gap-2 justify-center flex-wrap">
                  {screenshots.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPreviewIndex(i)}
                      className={`px-3 py-1 rounded text-sm ${
                        previewIndex === i ? 'bg-purple-600 text-white' : 'bg-gray-200'
                      }`}
                    >
                      Screen {i + 1}
                    </button>
                  ))}
                </div>
              )}
              <FrameEditor
                screenshots={template ? [screenshots[previewIndex]] : screenshots}
                background={background}
                textOverlay={textOverlay}
                frame={frame}
                onCanvasReady={setCanvas}
                templateMode={!!template}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
