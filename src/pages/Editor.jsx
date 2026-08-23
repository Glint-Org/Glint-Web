import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import FrameEditor from '../components/FrameEditor';
import FrameSelector from '../components/FrameSelector';
import ThemeSelector from '../components/ThemeSelector';
import ExportManager from '../components/ExportManager';
import TemplateGallery from '../components/TemplateGallery';
import SessionImporter from '../components/SessionImporter';
import ScreenshotReorder from '../components/ScreenshotReorder';
import BatchProcessor from '../components/BatchProcessor';
import QRExporter from '../components/QRExporter';
import { useGLINTBridge } from '../hooks/useGLINTBridge';
import { applyTemplate } from '../utils/templateEngine';
import { loadThemePresets } from '../utils/templateLoader';

export default function Editor() {
  const location = useLocation();
  const navigate = useNavigate();
  const [screenshots, setScreenshots] = useState(location.state?.screenshots || []);
  const [session, setSession] = useState(location.state?.session || null);
  const [background, setBackground] = useState(null);
  const [frame, setFrame] = useState(null);
  const [template, setTemplate] = useState(location.state?.template || null);
  const [textOverlay, setTextOverlay] = useState({ text: '', style: {} });
  const [appName, setAppName] = useState(session?.app ?? '');
  const [tagline, setTagline] = useState(session?.tagline ?? '');
  const [exportPreset, setExportPreset] = useState(session?.store ?? 'play');
  const [canvas, setCanvas] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [themes, setThemes] = useState({});
  const [bridgeToken, setBridgeToken] = useState('');
  const [sidebarTab, setSidebarTab] = useState('templates');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bridge = useGLINTBridge();
  const { theme, toggle } = useTheme();

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

  const hasScreenshots = screenshots.length > 0;

  return (
    <div className="min-h-screen bg-glint-bg flex flex-col">
      <header className="bg-glint-surface border-b border-glint-border px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="Glint" className="w-8 h-8 rounded-lg" />
          </button>
          <div className="w-px h-5 bg-glint-border-strong" />
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-glint-surface-2 transition-colors text-glint-text-secondary hover:text-glint-text" title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
          </button>
          <h1 className="text-lg font-bold text-glint-text">Editor</h1>
        </div>
        <div className="flex items-center gap-3">
          {bridge.error && !bridge.connected && (
            <div className="flex items-center gap-2">
              <input type="text" placeholder="Bridge token" value={bridgeToken} onChange={(e) => setBridgeToken(e.target.value)} className="px-3 py-1 border border-glint-border rounded text-xs w-32 bg-glint-surface text-glint-text" />
              <button onClick={() => bridge.connect(bridgeToken)} className="px-3 py-1 bg-glint-accent text-glint-text-on-accent rounded text-xs hover:bg-glint-accent-hover">Pair</button>
            </div>
          )}
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${bridge.connected ? 'bg-green-500/15 text-green-600 dark:text-green-400' : bridge.pairing ? 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400' : 'bg-glint-surface-2 text-glint-text-secondary'}`}>
            {bridge.connected ? 'Connected' : bridge.pairing ? 'Pairing...' : 'Bridge Offline'}
          </span>
          <button onClick={toggle} className="p-2 rounded-lg hover:bg-glint-surface-2 transition-colors" title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            {theme === 'dark' ? <Sun size={18} className="text-glint-text-secondary" /> : <Moon size={18} className="text-glint-text-secondary" />}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside
          className="bg-glint-surface border-r border-glint-border flex flex-col overflow-hidden shrink-0 transition-all duration-300 ease-in-out"
          style={{ width: sidebarOpen ? '288px' : '0px', opacity: sidebarOpen ? 1 : 0, borderRightWidth: sidebarOpen ? '1px' : '0px' }}
        >
          <div className="w-72 flex flex-col h-full">
          <div className="flex border-b border-glint-border">
            {[{ id: 'templates', label: 'Templates' }, { id: 'design', label: 'Design' }, { id: 'export', label: 'Export' }].map((tab) => (
              <button key={tab.id} onClick={() => setSidebarTab(tab.id)}
                className={`flex-1 px-3 py-3 text-sm font-medium transition-colors ${sidebarTab === tab.id ? 'text-glint-accent border-b-2 border-glint-accent' : 'text-glint-text-secondary hover:text-glint-text'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {sidebarTab === 'templates' && (
              <>
                <TemplateGallery selected={template} onChange={setTemplate} />
                {template && screenshots.length > 1 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-glint-text-secondary text-sm">Preview Screen</h3>
                    <div className="flex gap-1 flex-wrap">
                      {screenshots.map((_, i) => (
                        <button key={i} onClick={() => setPreviewIndex(i)}
                          className={`px-3 py-1 rounded text-xs ${previewIndex === i ? 'bg-glint-accent text-glint-text-on-accent' : 'bg-glint-surface-2 text-glint-text-secondary hover:bg-glint-surface-2'}`}>
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {sidebarTab === 'design' && (
              <>
                <SessionImporter onImport={handleSessionImport} />
                {bridge.connected && (
                  <button onClick={() => bridge.captureSingle()} className="w-full px-4 py-2 glint-btn-primary rounded-lg text-sm">
                    Capture from Device
                  </button>
                )}
                <ScreenshotReorder screenshots={screenshots} onReorder={setScreenshots} />
                {!template && (
                  <>
                    <FrameSelector selected={frame} onChange={setFrame} />
                    <ThemeSelector selected={background} onChange={setBackground} />
                    <div className="space-y-2">
                      <h3 className="font-semibold text-glint-text-secondary text-sm">Text Overlay</h3>
                      <input type="text" placeholder="App name or tagline" value={textOverlay.text} onChange={(e) => setTextOverlay((p) => ({ ...p, text: e.target.value }))} className="w-full px-3 py-2 border border-glint-border rounded-lg text-sm bg-glint-surface text-glint-text" />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <h3 className="font-semibold text-glint-text-secondary text-sm">App Info</h3>
                  <input type="text" placeholder="App name" value={appName} onChange={(e) => setAppName(e.target.value)} className="w-full px-3 py-2 border border-glint-border rounded-lg text-sm bg-glint-surface text-glint-text" />
                  <input type="text" placeholder="Tagline / headline" value={tagline} onChange={(e) => setTagline(e.target.value)} className="w-full px-3 py-2 border border-glint-border rounded-lg text-sm bg-glint-surface text-glint-text" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-glint-text-secondary text-sm">Export Preset</h3>
                  <select value={exportPreset} onChange={(e) => setExportPreset(e.target.value)} className="w-full px-3 py-2 border border-glint-border rounded-lg text-sm bg-glint-surface text-glint-text">
                    <option value="play">Play Store (1080x1920)</option>
                    <option value="ios">App Store Phone (1290x2796)</option>
                    <option value="ios-tablet">App Store Tablet (2048x2732)</option>
                  </select>
                </div>
              </>
            )}

            {sidebarTab === 'export' && (
              <>
                {template ? (
                  <BatchProcessor screenshots={screenshots} template={template} metadata={{ headline: tagline, tagline, app: appName }} exportPreset={exportPreset} />
                ) : (
                  <ExportManager canvas={canvas} screenshots={screenshots} />
                )}
                <QRExporter session={session ?? { app: appName, tagline, store: exportPreset }} />
              </>
            )}
          </div>
          </div>
        </aside>

        <main className="flex-1 p-6 overflow-auto flex items-center justify-center bg-glint-surface-2">
          {!hasScreenshots && !template ? (
            <div className="text-center space-y-4 max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-glint-accent-muted flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-glint-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <p className="text-glint-text-secondary">Upload screenshots, import a session, or select a template to get started.</p>
            </div>
          ) : (
            <div className="space-y-4 w-full max-w-2xl">
              {template && screenshots.length > 1 && (
                <div className="flex gap-2 justify-center">
                  {screenshots.map((_, i) => (
                    <button key={i} onClick={() => setPreviewIndex(i)} className={`w-12 h-20 rounded-lg border-2 overflow-hidden ${previewIndex === i ? 'border-glint-accent' : 'border-glint-border-strong'}`}>
                      <img src={screenshots[i]} alt={`Screen ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              <FrameEditor screenshots={template ? [screenshots[previewIndex]] : screenshots} background={background} textOverlay={textOverlay} frame={frame} onCanvasReady={setCanvas} templateMode={!!template} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
