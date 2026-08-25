import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sun, Moon, PanelLeftClose, PanelLeft, PanelRightClose, PanelRight,
  ZoomIn, ZoomOut, RotateCcw, Type, Trash2, Download,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import FrameBoard from '../components/FrameBoard';
import TemplateGallery from '../components/TemplateGallery';
import SessionImporter from '../components/SessionImporter';
import FrameScreenshotsPanel from '../components/FrameScreenshotsPanel';
import FramesPanel from '../components/FramesPanel';
import ExportPanel from '../components/ExportPanel';
import PropertiesPanel from '../components/PropertiesPanel';
import UploadZone from '../components/UploadZone';
import DeviceContextMenu from '../components/DeviceContextMenu';
import { useGLINTBridge } from '../hooks/useGlintBridge';
import {
  useFrames,
  framesFromTemplate,
  framesFromScreenshots,
} from '../hooks/useFrames';
import { loadThemePresets } from '../utils/templateLoader';
import {
  addTextOverlay,
  deleteActiveObjects,
  setBackground,
  replaceDeviceScreenshot,
  replaceDeviceFrame,
} from '../utils/canvasEngine';
import { DEFAULT_SCREENSHOT_STYLE } from '../utils/frameMeta';
import { EXPORT_PRESETS } from '../utils/exportHelper';
import { getWhiteScreenshot } from '../utils/placeholderScreenshots';
import { clampBoardZoom, computeBoardFitZoom } from '../utils/boardZoom';

const LEFT_W = 280;
const RIGHT_W = 300;

export default function Editor() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialTemplate = location.state?.template || null;
  const initialScreenshots = location.state?.screenshots || [];

  const initialFrames = useMemo(() => {
    if (initialTemplate) return framesFromTemplate(initialTemplate, initialScreenshots);
    if (initialScreenshots.length) return framesFromScreenshots(initialScreenshots);
    return framesFromScreenshots([]);
  }, []);

  const {
    frames,
    activeIndex,
    setActiveIndex,
    activeFrame,
    addFrame,
    duplicateFrame,
    deleteFrame,
    moveFrame,
    updateFrame,
    applyTemplatePack,
    mapScreenshots,
  } = useFrames(initialFrames);

  const [session, setSession] = useState(location.state?.session || null);
  const [background, setBackgroundState] = useState({ label: 'Charcoal', type: 'solid', value: '#1C1C1E' });
  const [deviceFrame, setDeviceFrame] = useState(null);
  const [screenshotStyle, setScreenshotStyle] = useState({ ...DEFAULT_SCREENSHOT_STYLE });
  const [template, setTemplate] = useState(initialTemplate);
  const [pendingTemplate, setPendingTemplate] = useState(null);
  const [textOverlay, setTextOverlay] = useState({ text: '', style: {} });
  const [appName, setAppName] = useState(session?.app ?? '');
  const [tagline, setTagline] = useState(session?.tagline ?? '');
  const [exportPreset, setExportPreset] = useState(
    session?.store ?? initialTemplate?.store ?? 'play',
  );
  const [fontFamily, setFontFamily] = useState('Inter');
  const [themes, setThemes] = useState({});
  const [bridgeToken, setBridgeToken] = useState('');
  const [leftTab, setLeftTab] = useState('templates');
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [zoom, setZoom] = useState(16);
  const [fitZoom, setFitZoom] = useState(16);
  const [deviceMenu, setDeviceMenu] = useState(null);
  const canvasMapRef = useRef({});
  const [activeCanvas, setActiveCanvas] = useState(null);
  const deviceFileRef = useRef(null);
  const boardRef = useRef(null);
  const bridge = useGLINTBridge();
  const { theme, toggle } = useTheme();

  const preset = EXPORT_PRESETS[exportPreset] ?? EXPORT_PRESETS.play;
  const canvasW = template?.canvas?.width ?? preset.width;
  const canvasH = template?.canvas?.height ?? preset.height;

  useEffect(() => {
    loadThemePresets().then(setThemes);
  }, []);

  useEffect(() => {
    if (bridge.screenshots.length > 0) {
      mapScreenshots(bridge.screenshots);
    }
  }, [bridge.screenshots, mapScreenshots]);

  const handleCanvasReady = useCallback((frameId, canvas) => {
    if (!frameId) return;
    if (canvas) canvasMapRef.current[frameId] = canvas;
    else delete canvasMapRef.current[frameId];
  }, []);

  useEffect(() => {
    const id = frames[activeIndex]?.id;
    setActiveCanvas(id ? canvasMapRef.current[id] || null : null);
  }, [activeIndex, frames]);

  const loadTemplate = (t) => {
    setTemplate(t);
    if (t?.store) setExportPreset(t.store === 'ios-tablet' ? 'ios-tablet' : t.store);
    if (t) applyTemplatePack(t, { resizeToPack: true });
  };

  const handleSelectTemplate = (t) => {
    if (!t) return;
    const hasDesigns = frames.some((f) => f.design);
    if (hasDesigns && template?.id !== t.id) {
      setPendingTemplate(t);
      return;
    }
    loadTemplate(t);
  };

  const confirmReplaceTemplate = () => {
    if (pendingTemplate) loadTemplate(pendingTemplate);
    setPendingTemplate(null);
  };

  const cancelReplaceTemplate = () => setPendingTemplate(null);

  const handleBackgroundChange = (bg) => {
    setBackgroundState(bg);
    if (activeCanvas && bg) setBackground(activeCanvas, bg.type, bg.value);
  };

  const handleScreenshotStyleChange = (patch) => {
    setScreenshotStyle((prev) => ({ ...prev, ...patch }));
  };

  const handleAddText = useCallback(() => {
    if (!activeCanvas) return;
    addTextOverlay(activeCanvas, tagline || 'Your headline', {
      fill: background?.type === 'solid' && isLight(background.value) ? '#1A1A1A' : '#FFFFFF',
      fontFamily,
      fontSize: 48,
    });
  }, [activeCanvas, tagline, background, fontFamily]);

  const handleDelete = useCallback(() => {
    if (!activeCanvas) return;
    deleteActiveObjects(activeCanvas);
  }, [activeCanvas]);

  const handleDeviceFrameChange = useCallback(async (nextId) => {
    setDeviceFrame(nextId);
    if (!nextId) return;

    // Replace every device bezel on the board; keep each frame's screenshot (cover-filled).
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const canvas = canvasMapRef.current[frame.id];
      if (!canvas) continue;

      const devices = canvas
        .getObjects()
        .filter((o) => o.glintRole === 'framed-screenshot');
      const shotUrl = frame.screenshotUrl;

      for (const device of [...devices]) {
        if (!device.glintScreenshotUrl && shotUrl) {
          device.set({ glintScreenshotUrl: shotUrl });
        }
        const ok = await replaceDeviceFrame(device, nextId, shotUrl || device.glintScreenshotUrl);
        if (!ok && shotUrl) {
          // Fallback: force screenshot onto device then retry once.
          device.set({ glintScreenshotUrl: shotUrl });
          await replaceDeviceFrame(device, nextId, shotUrl);
        }
      }
    }

    if (activeCanvas && nextId) {
      const refreshed = activeCanvas
        .getObjects()
        .find((o) => o.glintRole === 'framed-screenshot' && o.glintFrameId === nextId);
      if (refreshed) {
        activeCanvas.setActiveObject(refreshed);
        activeCanvas.requestRenderAll();
      }
    }
  }, [activeCanvas, frames]);

  const handleSessionImport = ({ screenshots: imported, session: importedSession }) => {
    setSession(importedSession);
    setAppName(importedSession.app ?? '');
    setTagline(importedSession.tagline ?? '');
    setExportPreset(importedSession.store ?? 'play');
    mapScreenshots(imported);
  };

  const handleUpload = (files) => {
    const urls = files.map((f) => URL.createObjectURL(f));
    mapScreenshots(urls);
  };

  const swapFrameDevices = async (index, url) => {
    updateFrame(index, { screenshotUrl: url });
    const frame = frames[index];
    const canvas = frame ? canvasMapRef.current[frame.id] : null;
    if (!canvas) return;
    const devices = canvas.getObjects().filter((o) => o.glintRole === 'framed-screenshot');
    if (!devices.length) return;
    if (devices.length === 1) {
      await replaceDeviceScreenshot(devices[0], url);
      return;
    }
    // Multi-device frames: replace slot 0 by default (assets list is 1:1 with frames)
    const primary = devices.find((d) => (d.glintSlot ?? 0) === 0) || devices[0];
    await replaceDeviceScreenshot(primary, url);
  };

  const handleReplaceScreenshot = async (index, file) => {
    await swapFrameDevices(index, URL.createObjectURL(file));
  };

  const handleClearScreenshot = async (index) => {
    await swapFrameDevices(index, getWhiteScreenshot());
  };

  const screenshotList = frames.map((f) => f.screenshotUrl).filter(Boolean);
  const userZoomRef = useRef(false);

  const recomputeFitZoom = useCallback(() => {
    const el = boardRef.current;
    if (!el) return 16;
    const leftPad = leftOpen ? LEFT_W : 0;
    const rightPad = rightOpen ? RIGHT_W : 0;
    const next = computeBoardFitZoom({
      boardWidth: el.clientWidth - leftPad - rightPad,
      boardHeight: el.clientHeight,
      canvasWidth: canvasW,
      canvasHeight: canvasH,
      frameCount: frames.length,
    });
    setFitZoom(next);
    return next;
  }, [leftOpen, rightOpen, canvasW, canvasH, frames.length]);

  const zoomIn = () => {
    userZoomRef.current = true;
    setZoom((z) => clampBoardZoom(z + 2));
  };
  const zoomOut = () => {
    userZoomRef.current = true;
    setZoom((z) => clampBoardZoom(z - 2));
  };
  const zoomReset = () => {
    userZoomRef.current = false;
    setZoom(recomputeFitZoom());
  };

  // Re-fit when sidebars / frame pack / export size change (after layout paints)
  useEffect(() => {
    userZoomRef.current = false;
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      setZoom(recomputeFitZoom());
    };
    run();
    const raf = requestAnimationFrame(() => requestAnimationFrame(run));
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [recomputeFitZoom]);

  // Keep fit updated on window/board resize (respect manual zoom)
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const next = recomputeFitZoom();
      if (!userZoomRef.current) setZoom(next);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [recomputeFitZoom]);

  // Zoom only the frame board - block browser page zoom over the canvas
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      userZoomRef.current = true;
      setZoom((z) => clampBoardZoom(z + (e.deltaY > 0 ? -2 : 2)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const handleDeviceContextMenu = useCallback((payload) => {
    const idx = frames.findIndex((f) => f.id === payload.frameId);
    if (idx >= 0) setActiveIndex(idx);
    setDeviceMenu(payload);
  }, [frames, setActiveIndex]);

  const closeDeviceMenu = () => setDeviceMenu(null);
  const pendingDeviceRef = useRef(null);

  const handleDeviceImportClick = () => {
    pendingDeviceRef.current = deviceMenu;
    closeDeviceMenu();
    // Defer so the menu unmounts before the file dialog opens
    requestAnimationFrame(() => deviceFileRef.current?.click());
  };

  const handleDeviceFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    const ctx = pendingDeviceRef.current || deviceMenu;
    pendingDeviceRef.current = null;
    if (!file || !ctx?.device) return;
    const url = URL.createObjectURL(file);
    const idx = frames.findIndex((f) => f.id === ctx.frameId);
    await replaceDeviceScreenshot(ctx.device, url);
    if (idx >= 0) updateFrame(idx, { screenshotUrl: url });
  };

  const handleDeviceClear = async () => {
    if (!deviceMenu?.device) return;
    const url = getWhiteScreenshot();
    const idx = frames.findIndex((f) => f.id === deviceMenu.frameId);
    await replaceDeviceScreenshot(deviceMenu.device, url);
    if (idx >= 0) updateFrame(idx, { screenshotUrl: url });
    closeDeviceMenu();
  };

  const handleDeviceResetTransform = () => {
    const device = deviceMenu?.device;
    if (!device) return;
    device.set({ scaleX: 1, scaleY: 1, angle: 0 });
    device.setCoords?.();
    device.canvas?.requestRenderAll?.();
    closeDeviceMenu();
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if ((e.key === 'Delete' || e.key === 'Backspace') && !typing && activeCanvas?.getActiveObjects()?.length) {
        e.preventDefault();
        deleteActiveObjects(activeCanvas);
      }
      if (typing) return;
      if ((e.key === 't' || e.key === 'T') && !e.metaKey && !e.ctrlKey) handleAddText();
      if (e.key === '\\' && !e.metaKey && !e.ctrlKey) {
        setLeftOpen((v) => !v);
        setRightOpen((v) => !v);
      }
      if (e.key === 'ArrowLeft' && !e.metaKey) setActiveIndex((i) => Math.max(0, i - 1));
      if (e.key === 'ArrowRight' && !e.metaKey) setActiveIndex((i) => Math.min(frames.length - 1, i + 1));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeCanvas, handleAddText, frames.length, setActiveIndex]);

  const getLiveCanvases = () =>
    frames.map((f) => canvasMapRef.current[f.id]).filter(Boolean);

  const getCanvasForFrame = useCallback((frameId) => canvasMapRef.current[frameId] || null, []);

  const openExportSidebar = () => {
    setLeftOpen(true);
    setLeftTab('export');
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-glint-bg flex flex-col">
      <header className="h-12 bg-glint-surface border-b border-glint-border px-3 flex items-center justify-between shrink-0 z-40">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/')} className="hover:opacity-80 transition-opacity" title="Home">
            <img src="/logo.png" alt="Glint" className="w-7 h-7 rounded-md" />
          </button>
          <div className="w-px h-4 bg-glint-border-strong" />
          <button
            onClick={() => setLeftOpen((v) => !v)}
            className="p-1.5 rounded-md hover:bg-glint-surface-2 text-glint-text-secondary hover:text-glint-text"
            title={leftOpen ? 'Collapse left panel' : 'Expand left panel'}
          >
            {leftOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
          </button>
          <span className="text-sm font-semibold text-glint-text">Editor</span>
          <span className="text-[10px] text-glint-text-tertiary">
            {frames.length} frame{frames.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {bridge.error && !bridge.connected && (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="Bridge token"
                value={bridgeToken}
                onChange={(e) => setBridgeToken(e.target.value)}
                className="px-2 py-1 border border-glint-border rounded text-[11px] w-24 bg-glint-bg text-glint-text"
              />
              <button
                onClick={() => bridge.connect(bridgeToken)}
                className="px-2 py-1 bg-glint-accent text-glint-text-on-accent rounded text-[11px] hover:bg-glint-accent-hover"
              >
                Pair
              </button>
            </div>
          )}
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              bridge.connected
                ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                : bridge.pairing
                  ? 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400'
                  : 'bg-glint-surface-2 text-glint-text-secondary'
            }`}
          >
            {bridge.connected ? 'Connected' : bridge.pairing ? 'Pairing...' : 'Offline'}
          </span>
          <button
            type="button"
            onClick={openExportSidebar}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold glint-btn-primary"
            title="Export"
          >
            <Download size={14} />
            Export
          </button>
          <button
            onClick={toggle}
            className="p-1.5 rounded-md hover:bg-glint-surface-2"
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <Sun size={15} className="text-glint-text-secondary" /> : <Moon size={15} className="text-glint-text-secondary" />}
          </button>
          <button
            onClick={() => setRightOpen((v) => !v)}
            className="p-1.5 rounded-md hover:bg-glint-surface-2 text-glint-text-secondary hover:text-glint-text"
            title={rightOpen ? 'Collapse right panel' : 'Expand right panel'}
          >
            {rightOpen ? <PanelRightClose size={16} /> : <PanelRight size={16} />}
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 relative overflow-hidden">
        <main ref={boardRef} className="absolute inset-0 overflow-hidden bg-glint-bg">
          <FrameBoard
            frames={frames}
            activeIndex={activeIndex}
            onSelect={setActiveIndex}
            onAdd={addFrame}
            onDuplicate={duplicateFrame}
            onDelete={deleteFrame}
            onMove={moveFrame}
            onCanvasReady={handleCanvasReady}
            onDeviceContextMenu={handleDeviceContextMenu}
            canvasWidth={canvasW}
            canvasHeight={canvasH}
            themes={themes}
            zoom={zoom}
            padLeft={leftOpen ? LEFT_W : 0}
            padRight={rightOpen ? RIGHT_W : 0}
          />

          <div
            className="absolute bottom-4 z-20 flex items-center gap-0.5 bg-glint-surface/95 backdrop-blur-md border border-glint-border rounded-xl px-1.5 py-1 shadow-2xl pointer-events-auto transition-[left,transform] duration-200 ease-out"
            style={{
              left: `calc(50% + ${(leftOpen ? LEFT_W : 0) / 2}px - ${(rightOpen ? RIGHT_W : 0) / 2}px)`,
              transform: 'translateX(-50%)',
            }}
          >
            <ToolBtn onClick={handleAddText} title="Add text (T)">
              <Type size={15} />
            </ToolBtn>
            <ToolBtn onClick={handleDelete} title="Delete selected">
              <Trash2 size={15} />
            </ToolBtn>
            <Sep />
            <ToolBtn onClick={zoomOut} title="Zoom out">
              <ZoomOut size={15} />
            </ToolBtn>
            <button
              onClick={zoomReset}
              className="px-2 py-1 rounded-lg text-[11px] font-semibold text-glint-text-secondary hover:bg-glint-surface-2 w-14 tabular-nums"
              title={`Fit to view (${Math.round(fitZoom)}%)`}
            >
              {Math.round(zoom)}%
            </button>
            <ToolBtn onClick={zoomIn} title="Zoom in">
              <ZoomIn size={15} />
            </ToolBtn>
            <Sep />
            <ToolBtn onClick={zoomReset} title="Fit to view">
              <RotateCcw size={14} />
            </ToolBtn>
          </div>
        </main>

        <aside
          className="absolute left-0 top-0 bottom-0 z-30 bg-glint-surface/95 backdrop-blur-md border-r border-glint-border shadow-2xl flex flex-col overflow-hidden transition-[width,opacity] duration-200 ease-out"
          style={{
            width: leftOpen ? LEFT_W : 0,
            opacity: leftOpen ? 1 : 0,
            pointerEvents: leftOpen ? 'auto' : 'none',
          }}
        >
          <div className="w-[280px] h-full flex flex-col">
            <div className="flex border-b border-glint-border shrink-0">
              {[
                { id: 'templates', label: 'Templates' },
                { id: 'assets', label: 'Assets' },
                { id: 'frames', label: 'Frames' },
                { id: 'export', label: 'Export' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setLeftTab(tab.id)}
                  className={`flex-1 px-1.5 py-2.5 text-[11px] font-medium transition-colors ${
                    leftTab === tab.id
                      ? 'text-glint-accent border-b-2 border-glint-accent'
                      : 'text-glint-text-secondary hover:text-glint-text'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-4 hide-scrollbar">
              {leftTab === 'templates' && (
                <TemplateGallery onChange={handleSelectTemplate} />
              )}
              {leftTab === 'assets' && (
                <>
                  <p className="text-[10px] text-glint-text-tertiary">
                    Import screenshots or a Capture/Bridge session folder.
                  </p>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-glint-text-secondary text-[10px] uppercase tracking-wider">
                      Import
                    </h3>
                    <UploadZone onUpload={handleUpload} compact />
                  </div>
                  <SessionImporter onImport={handleSessionImport} />
                  {bridge.connected && (
                    <button
                      onClick={() => bridge.captureSingle()}
                      className="w-full px-3 py-1.5 glint-btn-primary rounded-lg text-xs"
                    >
                      Capture from Device
                    </button>
                  )}
                  <FrameScreenshotsPanel
                    frames={frames}
                    onReplace={handleReplaceScreenshot}
                    onClear={handleClearScreenshot}
                  />
                </>
              )}
              {leftTab === 'frames' && (
                <>
                  <p className="text-[10px] text-glint-text-tertiary">
                    Select a frame and reorder layers. Device bezels live in Design (right).
                  </p>
                  <FramesPanel
                    frames={frames}
                    activeIndex={activeIndex}
                    onSelectFrame={setActiveIndex}
                    canvas={activeCanvas}
                    getCanvasForFrame={getCanvasForFrame}
                    canvasWidth={canvasW}
                    canvasHeight={canvasH}
                  />
                </>
              )}
              {leftTab === 'export' && (
                <ExportPanel
                  frames={frames}
                  getLiveCanvases={getLiveCanvases}
                  exportPreset={exportPreset}
                  setExportPreset={setExportPreset}
                  appName={appName}
                  setAppName={setAppName}
                  tagline={tagline}
                  setTagline={setTagline}
                  setTextOverlay={setTextOverlay}
                  themes={themes}
                  canvasWidth={canvasW}
                  canvasHeight={canvasH}
                  session={session}
                  template={template}
                  activeCanvas={activeCanvas}
                  screenshotList={screenshotList}
                  background={background}
                  deviceFrame={deviceFrame}
                  screenshotStyle={screenshotStyle}
                  textOverlay={textOverlay}
                />
              )}
            </div>
          </div>
        </aside>

        <aside
          className="absolute right-0 top-0 bottom-0 z-30 bg-glint-surface/95 backdrop-blur-md border-l border-glint-border shadow-2xl overflow-hidden transition-[width,opacity] duration-200 ease-out"
          style={{
            width: rightOpen ? RIGHT_W : 0,
            opacity: rightOpen ? 1 : 0,
            pointerEvents: rightOpen ? 'auto' : 'none',
          }}
        >
          <div className="w-[300px] h-full">
            <PropertiesPanel
              canvas={activeCanvas}
              background={background}
              onBackgroundChange={handleBackgroundChange}
              frame={deviceFrame}
              onFrameChange={handleDeviceFrameChange}
              onFrameHighlight={setDeviceFrame}
              screenshotStyle={screenshotStyle}
              onScreenshotStyleChange={handleScreenshotStyleChange}
              fontFamily={fontFamily}
              onFontFamilyChange={setFontFamily}
              onAddText={handleAddText}
              onDelete={handleDelete}
              templateActive={!!activeFrame?.design}
            />
          </div>
        </aside>
      </div>

      {deviceMenu && (
        <DeviceContextMenu
          x={deviceMenu.clientX}
          y={deviceMenu.clientY}
          onImport={handleDeviceImportClick}
          onClear={handleDeviceClear}
          onResetTransform={handleDeviceResetTransform}
          onClose={closeDeviceMenu}
        />
      )}
      <input
        ref={deviceFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleDeviceFileChange}
      />

      {pendingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-glint-surface border border-glint-border shadow-2xl p-5 space-y-4">
            <h3 className="text-base font-semibold text-glint-text">Replace template?</h3>
            <p className="text-sm text-glint-text-secondary leading-relaxed">
              Loading this template will replace the designs on your current frames. Your screenshots stay in place.
            </p>
            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={cancelReplaceTemplate}
                className="px-3 py-1.5 text-sm rounded-lg border border-glint-border text-glint-text-secondary hover:bg-glint-surface-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmReplaceTemplate}
                className="px-3 py-1.5 text-sm rounded-lg glint-btn-primary"
              >
                Replace
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function ToolBtn({ children, onClick, active, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg transition-colors ${
        active
          ? 'bg-glint-accent text-glint-text-on-accent'
          : 'text-glint-text-secondary hover:bg-glint-surface-2'
      }`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-5 bg-glint-border-strong mx-1" />;
}

function isLight(hex) {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return false;
  const c = hex.slice(1);
  if (c.length !== 6) return false;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}
