import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, PanelLeftClose, PanelLeft, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
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
  const [zoom, setZoom] = useState(100);
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
    <div className="h-screen bg-glint-bg flex flex-col overflow-hidden select-none">
      {/* ── Navbar ── */}
      <header className="h-12 bg-glint-surface border-b border-glint-border px-3 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/')} className="hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="Glint" className="w-7 h-7 rounded-md" />
          </button>
          <div className="w-px h-4 bg-glint-border-strong" />
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-md hover:bg-glint-surface-2 transition-colors text-glint-text-secondary hover:text-glint-text" title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
            {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
          </button>
          <span className="text-xs font-semibold text-glint-text">Editor</span>
        </div>
        <div className="flex items-center gap-2">
          {bridge.error && !bridge.connected && (
            <div className="flex items-center gap-1.5">
              <input type="text" placeholder="Bridge token" value={bridgeToken} onChange={(e) => setBridgeToken(e.target.value)} className="px-2 py-1 border border-glint-border rounded text-[11px] w-24 bg-glint-surface text-glint-text" />
              <button onClick={() => bridge.connect(bridgeToken)} className="px-2 py-1 bg-glint-accent text-glint-text-on-accent rounded text-[11px] hover:bg-glint-accent-hover">Pair</button>
            </div>
          )}
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${bridge.connected ? 'bg-green-500/15 text-green-600 dark:text-green-400' : bridge.pairing ? 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400' : 'bg-glint-surface-2 text-glint-text-secondary'}`}>
            {bridge.connected ? 'Connected' : bridge.pairing ? 'Pairing...' : 'Offline'}
          </span>
          <button onClick={toggle} className="p-1.5 rounded-md hover:bg-glint-surface-2 transition-colors" title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            {theme === 'dark' ? <Sun size={15} className="text-glint-text-secondary" /> : <Moon size={15} className="text-glint-text-secondary" />}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ── */}
        <aside
          className="bg-glint-surface border-r border-glint-border flex flex-col overflow-hidden shrink-0 transition-all duration-300 ease-in-out"
          style={{ width: sidebarOpen ? '272px' : '0px', opacity: sidebarOpen ? 1 : 0, borderRightWidth: sidebarOpen ? '1px' : '0px' }}
        >
          <div className="w-68 flex flex-col h-full">
            <div className="flex border-b border-glint-border">
              {[{ id: 'templates', label: 'Templates' }, { id: 'design', label: 'Design' }, { id: 'export', label: 'Export' }].map((tab) => (
                <button key={tab.id} onClick={() => setSidebarTab(tab.id)}
                  className={`flex-1 px-2 py-2 text-[11px] font-medium transition-colors ${sidebarTab === tab.id ? 'text-glint-accent border-b-2 border-glint-accent' : 'text-glint-text-secondary hover:text-glint-text'}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {sidebarTab === 'templates' && (
                <>
                  <TemplateGallery selected={template} onChange={setTemplate} />
                  {template && screenshots.length > 1 && (
                    <div className="space-y-1.5">
                      <h3 className="font-semibold text-glint-text-secondary text-[10px] uppercase tracking-wider">Preview Screen</h3>
                      <div className="flex gap-1 flex-wrap">
                        {screenshots.map((_, i) => (
                          <button key={i} onClick={() => setPreviewIndex(i)}
                            className={`w-7 h-7 rounded text-[10px] font-medium ${previewIndex === i ? 'bg-glint-accent text-glint-text-on-accent' : 'bg-glint-surface-2 text-glint-text-secondary hover:bg-glint-surface-2'}`}>
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
                    <button onClick={() => bridge.captureSingle()} className="w-full px-3 py-1.5 glint-btn-primary rounded-lg text-xs">
                      Capture from Device
                    </button>
                  )}
                  <ScreenshotReorder screenshots={screenshots} onReorder={setScreenshots} />
                  {!template && (
                    <>
                      <FrameSelector selected={frame} onChange={setFrame} />
                      <ThemeSelector selected={background} onChange={setBackground} />
                      <div className="space-y-1.5">
                        <h3 className="font-semibold text-glint-text-secondary text-[10px] uppercase tracking-wider">Text Overlay</h3>
                        <input type="text" placeholder="App name or tagline" value={textOverlay.text} onChange={(e) => setTextOverlay((p) => ({ ...p, text: e.target.value }))} className="w-full px-2.5 py-1.5 border border-glint-border rounded-lg text-xs bg-glint-surface text-glint-text" />
                      </div>
                    </>
                  )}
                  <div className="space-y-1.5">
                    <h3 className="font-semibold text-glint-text-secondary text-[10px] uppercase tracking-wider">App Info</h3>
                    <input type="text" placeholder="App name" value={appName} onChange={(e) => setAppName(e.target.value)} className="w-full px-2.5 py-1.5 border border-glint-border rounded-lg text-xs bg-glint-surface text-glint-text" />
                    <input type="text" placeholder="Tagline / headline" value={tagline} onChange={(e) => setTagline(e.target.value)} className="w-full px-2.5 py-1.5 border border-glint-border rounded-lg text-xs bg-glint-surface text-glint-text" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-semibold text-glint-text-secondary text-[10px] uppercase tracking-wider">Export Preset</h3>
                    <select value={exportPreset} onChange={(e) => setExportPreset(e.target.value)} className="w-full px-2.5 py-1.5 border border-glint-border rounded-lg text-xs bg-glint-surface text-glint-text">
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

        {/* ── Canvas viewport ── */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Canvas background with dot grid */}
          <div className="flex-1 overflow-hidden relative bg-glint-surface-2">
            {/* Dot grid pattern */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{
              backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }} />

            {/* Canvas content - centered */}
            <div className="absolute inset-0 flex items-center justify-center overflow-auto">
              {!hasScreenshots && !template ? (
                <div className="text-center space-y-3 max-w-xs relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-glint-accent-muted flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-glint-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <p className="text-glint-text-tertiary text-sm">Upload screenshots or select a template to start.</p>
                </div>
              ) : (
                <div className="relative z-10" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center', transition: 'transform 150ms ease' }}>
                  <FrameEditor screenshots={template ? [screenshots[previewIndex]] : screenshots} background={background} textOverlay={textOverlay} frame={frame} onCanvasReady={setCanvas} templateMode={!!template} />
                </div>
              )}
            </div>

            {/* Zoom controls - bottom right */}
            {hasScreenshots && (
              <div className="absolute bottom-3 right-3 z-10 flex items-center gap-0.5 bg-glint-surface/90 backdrop-blur border border-glint-border rounded-lg px-1 py-0.5 shadow-lg">
                <button onClick={() => setZoom((z) => Math.max(25, z - 25))} className="p-1 rounded hover:bg-glint-surface-2 text-glint-text-secondary transition-colors"><ZoomOut size={14} /></button>
                <span className="text-[10px] font-medium text-glint-text-secondary w-9 text-center">{zoom}%</span>
                <button onClick={() => setZoom((z) => Math.min(200, z + 25))} className="p-1 rounded hover:bg-glint-surface-2 text-glint-text-secondary transition-colors"><ZoomIn size={14} /></button>
                <div className="w-px h-3 bg-glint-border-strong mx-0.5" />
                <button onClick={() => setZoom(100)} className="p-1 rounded hover:bg-glint-surface-2 text-glint-text-secondary transition-colors" title="Reset zoom"><RotateCcw size={12} /></button>
              </div>
            )}
          </div>

          {/* Filmstrip - bottom */}
          {hasScreenshots && screenshots.length > 1 && (
            <div className="h-28 bg-glint-surface border-t border-glint-border shrink-0 px-4 py-2 flex items-center">
              <div className="flex gap-2 overflow-x-auto mx-auto">
                {screenshots.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setPreviewIndex(i)}
                    className={`shrink-0 w-16 h-full rounded-lg border-2 overflow-hidden transition-all ${previewIndex === i ? 'border-glint-accent ring-1 ring-glint-accent/30' : 'border-glint-border hover:border-glint-border-strong'}`}
                  >
                    <img src={url} alt={`Screen ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
