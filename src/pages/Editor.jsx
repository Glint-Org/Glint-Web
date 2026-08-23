import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, PanelLeftClose, PanelLeft, ZoomIn, ZoomOut, RotateCcw, Hand, MousePointer } from 'lucide-react';
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
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panMode, setPanMode] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const spaceRef = useRef(false);
  const canvasViewportRef = useRef(null);
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

  // ── Zoom helpers ──
  const clampZoom = (z) => Math.min(500, Math.max(5, z));
  const zoomIn = () => setZoom((z) => clampZoom(z + 10));
  const zoomOut = () => setZoom((z) => clampZoom(z - 10));
  const zoomReset = () => { setZoom(100); setPan({ x: 0, y: 0 }); };

  // ── Wheel zoom (Ctrl+scroll) ──
  const handleWheel = useCallback((e) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -5 : 5;
    setZoom((z) => clampZoom(z + delta));
  }, []);

  useEffect(() => {
    const el = canvasViewportRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // ── Pan ──
  const handleMouseDown = useCallback((e) => {
    const isMiddle = e.button === 1;
    const isSpaceDrag = spaceRef.current && e.button === 0;
    const isHandTool = panMode && e.button === 0;
    if (!isMiddle && !isSpaceDrag && !isHandTool) return;
    e.preventDefault();
    setIsPanning(true);
    panStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  }, [pan.x, pan.y, panMode]);

  const handleMouseMove = useCallback((e) => {
    if (!isPanning) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    setPan({ x: panStartRef.current.panX + dx, y: panStartRef.current.panY + dy });
  }, [isPanning]);

  const handleMouseUp = useCallback(() => { setIsPanning(false); }, []);

  useEffect(() => {
    if (isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isPanning, handleMouseMove, handleMouseUp]);

  // ── Space key for pan ──
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code === 'Space' && !e.repeat && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        spaceRef.current = true;
      }
    };
    const onKeyUp = (e) => { if (e.code === 'Space') spaceRef.current = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
  }, []);

  const hasScreenshots = screenshots.length > 0;
  const hasFilmstrip = hasScreenshots && screenshots.length > 1;

  return (
    <div className="h-screen w-screen overflow-hidden bg-glint-bg flex flex-col select-none" style={{ cursor: isPanning ? 'grabbing' : spaceRef.current || panMode ? 'grab' : 'default' }}>
      {/* ── Navbar ── */}
      <header className="h-14 bg-glint-surface border-b border-glint-border px-4 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-2.5">
          <button onClick={() => navigate('/')} className="hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="Glint" className="w-8 h-8 rounded-lg" />
          </button>
          <div className="w-px h-5 bg-glint-border-strong" />
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-md hover:bg-glint-surface-2 transition-colors text-glint-text-secondary hover:text-glint-text" title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
          </button>
          <span className="text-sm font-semibold text-glint-text">Editor</span>
        </div>
        <div className="flex items-center gap-2.5">
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
            {theme === 'dark' ? <Sun size={16} className="text-glint-text-secondary" /> : <Moon size={16} className="text-glint-text-secondary" />}
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── Sidebar (overlay on canvas, doesn't shrink canvas) ── */}
        <aside
          className="bg-glint-surface border-r border-glint-border shrink-0 transition-all duration-300 ease-in-out overflow-hidden z-20 absolute left-0 top-14 bottom-0"
          style={{ width: sidebarOpen ? '272px' : '0px', opacity: sidebarOpen ? 1 : 0, borderRightWidth: sidebarOpen ? '1px' : '0px' }}
        >
          <div className="w-[272px] h-full flex flex-col">
            <div className="flex border-b border-glint-border shrink-0">
              {[{ id: 'templates', label: 'Templates' }, { id: 'design', label: 'Design' }, { id: 'export', label: 'Export' }].map((tab) => (
                <button key={tab.id} onClick={() => setSidebarTab(tab.id)}
                  className={`flex-1 px-2 py-2.5 text-[11px] font-medium transition-colors ${sidebarTab === tab.id ? 'text-glint-accent border-b-2 border-glint-accent' : 'text-glint-text-secondary hover:text-glint-text'}`}>
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
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

        {/* ── Canvas: ALWAYS fills full body, sidebar overlays on top ── */}
        <main
          ref={canvasViewportRef}
          className="flex-1 relative overflow-hidden"
          onMouseDown={handleMouseDown}
          style={{ cursor: isPanning ? 'grabbing' : spaceRef.current || panMode ? 'grab' : 'default' }}
        >
          {/* Infinite canvas with dot grid */}
          <div
            className="absolute inset-0"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
              transformOrigin: 'center center',
              transition: isPanning ? 'none' : 'transform 60ms linear',
            }}
          >
            {/* Dot grid - infinite */}
            <div
              className="absolute opacity-[0.04] dark:opacity-[0.06]"
              style={{
                width: '300%',
                height: '300%',
                left: '-100%',
                top: '-100%',
                backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />

            {/* Canvas content - centered */}
            <div className="absolute inset-0 flex items-center justify-center">
              {!hasScreenshots && !template ? (
                <div className="text-center space-y-4 max-w-sm relative z-10">
                  <div className="w-20 h-20 rounded-2xl bg-glint-accent-muted flex items-center justify-center mx-auto">
                    <svg className="w-10 h-10 text-glint-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <p className="text-glint-text-secondary text-base font-medium">Your canvas is empty</p>
                    <p className="text-glint-text-tertiary text-sm mt-1">Upload screenshots or pick a template to begin.</p>
                  </div>
                  <p className="text-glint-text-tertiary text-[11px]">
                    <kbd className="px-1.5 py-0.5 rounded bg-glint-surface border border-glint-border text-[10px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-glint-surface border border-glint-border text-[10px]">Scroll</kbd> to zoom
                    <span className="mx-1.5">|</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-glint-surface border border-glint-border text-[10px]">Space</kbd> + drag to pan
                  </p>
                </div>
              ) : (
                <div className="relative z-10">
                  <FrameEditor screenshots={template ? [screenshots[previewIndex]] : screenshots} background={background} textOverlay={textOverlay} frame={frame} onCanvasReady={setCanvas} templateMode={!!template} />
                </div>
              )}
            </div>
          </div>

          {/* ── Toolbar (bottom center) ── */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-glint-surface/95 backdrop-blur-md border border-glint-border rounded-xl px-1.5 py-1 shadow-2xl">
            <button onClick={() => setPanMode(false)} className={`p-2 rounded-lg transition-colors ${!panMode ? 'bg-glint-accent text-glint-text-on-accent' : 'text-glint-text-secondary hover:bg-glint-surface-2'}`} title="Select tool (V)">
              <MousePointer size={15} />
            </button>
            <button onClick={() => setPanMode(true)} className={`p-2 rounded-lg transition-colors ${panMode ? 'bg-glint-accent text-glint-text-on-accent' : 'text-glint-text-secondary hover:bg-glint-surface-2'}`} title="Hand tool (H)">
              <Hand size={15} />
            </button>
            <div className="w-px h-5 bg-glint-border-strong mx-1" />
            <button onClick={zoomOut} className="p-2 rounded-lg text-glint-text-secondary hover:bg-glint-surface-2 transition-colors" title="Zoom out">
              <ZoomOut size={15} />
            </button>
            <button className="px-2 py-1 rounded-lg text-[11px] font-semibold text-glint-text-secondary hover:bg-glint-surface-2 transition-colors w-12 text-center tabular-nums">
              {Math.round(zoom)}%
            </button>
            <button onClick={zoomIn} className="p-2 rounded-lg text-glint-text-secondary hover:bg-glint-surface-2 transition-colors" title="Zoom in">
              <ZoomIn size={15} />
            </button>
            <div className="w-px h-5 bg-glint-border-strong mx-1" />
            <button onClick={zoomReset} className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-glint-text-secondary hover:bg-glint-surface-2 transition-colors" title="Reset zoom">
              <RotateCcw size={14} />
            </button>
          </div>

          {/* ── Filmstrip (overlaid bottom) ── */}
          {hasFilmstrip && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex items-center bg-glint-surface/95 backdrop-blur-md border border-glint-border rounded-xl px-3 py-2 shadow-2xl">
              <div className="flex gap-2 overflow-x-auto">
                {screenshots.map((url, i) => (
                  <button key={i} onClick={() => setPreviewIndex(i)}
                    className={`shrink-0 w-14 h-20 rounded-lg border-2 overflow-hidden transition-all ${previewIndex === i ? 'border-glint-accent ring-1 ring-glint-accent/30' : 'border-glint-border hover:border-glint-border-strong'}`}>
                    <img src={url} alt={`Screen ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
