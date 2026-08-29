import { useEffect, useRef } from 'react';
import { createCanvas, selectDeviceLayer } from '../utils/canvasEngine';
import { applyDesignToFrame, setFrameEditable } from '../utils/templateEngine';

function applyDisplayScale(canvas, canvasWidth, canvasHeight, scale) {
  const cssW = Math.max(1, Math.round(canvasWidth * scale));
  const cssH = Math.max(1, Math.round(canvasHeight * scale));
  if (typeof canvas.setDimensions === 'function') {
    canvas.setDimensions({ width: canvasWidth, height: canvasHeight });
    canvas.setDimensions({ width: cssW, height: cssH }, { cssOnly: true });
  }
  const els = [canvas.lowerCanvasEl, canvas.upperCanvasEl, canvas.wrapperEl, canvas.container].filter(Boolean);
  els.forEach((el) => {
    el.style.width = `${cssW}px`;
    el.style.height = `${cssH}px`;
    el.style.maxWidth = `${cssW}px`;
    el.style.maxHeight = `${cssH}px`;
  });
  canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
  canvas.calcOffset?.();
  canvas.requestRenderAll?.();
  return { cssW, cssH };
}

function findDeviceTarget(target) {
  let t = target;
  while (t) {
    if (t.glintRole === 'framed-screenshot') return t;
    t = t.group || t.parent;
  }
  return null;
}

/**
 * One Fabric canvas for a single Frame artboard.
 * Backing store = full store size; CSS display scaled for the board.
 * All frames share the same displayScale so board sizes stay uniform.
 */
export default function FrameCanvas({
  frameId,
  design,
  screenshotUrl,
  fabricJson = null,
  canvasWidth = 1080,
  canvasHeight = 1920,
  displayScale = 0.16,
  themes = {},
  editable = true,
  onCanvasReady,
  onDeviceContextMenu,
  paintKey,
}) {
  const elRef = useRef(null);
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const themesRef = useRef(themes);
  const editableRef = useRef(editable);
  const menuRef = useRef(onDeviceContextMenu);
  const screenshotRef = useRef(screenshotUrl);
  const scaleRef = useRef(Math.max(0.05, displayScale));
  const scale = Math.max(0.05, displayScale);
  scaleRef.current = scale;
  themesRef.current = themes;
  editableRef.current = editable;
  menuRef.current = onDeviceContextMenu;
  screenshotRef.current = screenshotUrl;

  const themesReady = Object.keys(themes).length > 0 ? 1 : 0;
  const cssW = Math.max(1, Math.round(canvasWidth * scale));
  const cssH = Math.max(1, Math.round(canvasHeight * scale));

  useEffect(() => {
    if (!elRef.current) return;
    const c = createCanvas(elRef.current, canvasWidth, canvasHeight);
    applyDisplayScale(c, canvasWidth, canvasHeight, scaleRef.current);
    setFrameEditable(c, editableRef.current);
    canvasRef.current = c;
    onCanvasReady?.(frameId, c);

    const onMouseDown = (opt) => {
      if (opt.e?.button !== 2) return;
      const device = findDeviceTarget(opt.target);
      if (!device) return;
      opt.e.preventDefault();
      opt.e.stopPropagation();
      c.setActiveObject(device);
      c.requestRenderAll();
      menuRef.current?.({
        frameId,
        device,
        canvas: c,
        clientX: opt.e.clientX,
        clientY: opt.e.clientY,
      });
    };

    const onMouseUp = (opt) => {
      if (opt.e?.button === 2) {
        opt.e.stopPropagation();
      }
    };

    const blockBrowserMenu = (e) => {
      const target = c.findTarget?.(e, false);
      if (findDeviceTarget(target)) e.preventDefault();
    };

    c.on('mouse:down', onMouseDown);
    c.on('mouse:up', onMouseUp);
    c.wrapperEl?.addEventListener('contextmenu', blockBrowserMenu);

    const onDblClick = (opt) => {
      if (!editableRef.current) return;
      const t = opt.target;
      if (!t) return;
      const isText =
        t.glintRole === 'text' ||
        typeof t.enterEditing === 'function' ||
        t.type === 'i-text' ||
        t.type === 'textbox';
      if (!isText) return;
      // Fabric enters editing on dblclick; force full text selection like Figma.
      requestAnimationFrame(() => {
        try {
          if (typeof t.enterEditing === 'function' && !t.isEditing) t.enterEditing();
          if (typeof t.selectAll === 'function') t.selectAll();
          c.requestRenderAll();
        } catch {
          /* ignore */
        }
      });
    };
    c.on('mouse:dblclick', onDblClick);

    return () => {
      c.off('mouse:down', onMouseDown);
      c.off('mouse:up', onMouseUp);
      c.off('mouse:dblclick', onDblClick);
      c.wrapperEl?.removeEventListener('contextmenu', blockBrowserMenu);
      onCanvasReady?.(frameId, null);
      c.dispose();
      canvasRef.current = null;
    };
  }, [canvasWidth, canvasHeight, frameId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    applyDisplayScale(canvas, canvasWidth, canvasHeight, scale);
  }, [scale, canvasWidth, canvasHeight]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setFrameEditable(canvas, editable);
    if (editable) selectDeviceLayer(canvas);
  }, [editable]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ac = new AbortController();
    (async () => {
      if (fabricJson) {
        try {
          if (typeof canvas.loadFromJSON === 'function') {
            await canvas.loadFromJSON(fabricJson);
          } else if (typeof canvas.loadFromObject === 'function') {
            await canvas.loadFromObject(fabricJson);
          }
          if (ac.signal.aborted) return;
          canvas.requestRenderAll?.();
        } catch (err) {
          console.warn('Glint pack fabric restore failed, falling back to design', err);
          await applyDesignToFrame(canvas, design, screenshotRef.current, {
            canvasWidth,
            canvasHeight,
            themes: themesRef.current,
            editable: editableRef.current,
            signal: ac.signal,
          });
        }
      } else {
        await applyDesignToFrame(canvas, design, screenshotRef.current, {
          canvasWidth,
          canvasHeight,
          themes: themesRef.current,
          editable: editableRef.current,
          signal: ac.signal,
        });
      }
      if (ac.signal.aborted) return;
      applyDisplayScale(canvas, canvasWidth, canvasHeight, scaleRef.current);
      setFrameEditable(canvas, editableRef.current);
      if (editableRef.current) selectDeviceLayer(canvas);
    })();
    return () => ac.abort();
  }, [design, fabricJson, canvasWidth, canvasHeight, paintKey, themesReady]);

  return (
    <div
      ref={wrapRef}
      className="relative overflow-hidden rounded-sm"
      style={{ width: cssW, height: cssH }}
    >
      <canvas ref={elRef} className="block" />
    </div>
  );
}
