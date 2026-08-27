import { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, GripVertical, Trash2 } from 'lucide-react';
import { isProtectedLayer } from '../utils/layerGuards';

function layerName(obj, index) {
  if (obj?.glintRole === 'store-frame') return obj.glintFrameName || `Frame ${index + 1}`;
  if (obj?.glintRole === 'framed-screenshot') return 'Device + screenshot';
  if (obj?.glintRole === 'screenshot') return 'Screenshot';
  if (obj?.glintRole === 'text') return `Text: ${(obj?.text || 'Layer').slice(0, 20)}`;
  if (obj?.glintRole === 'graphic') return 'Graphic';
  if (obj?.glintRole === 'frame-label') return obj.text || 'Label';
  if (obj?.glintRole === 'slide-bg') return 'Background';
  if (obj?.type === 'i-text' || obj?.type === 'textbox' || obj?.type === 'text') {
    return `Text: ${(obj?.text || 'Layer').slice(0, 20)}`;
  }
  return `${obj?.type || 'Layer'} ${index + 1}`;
}

/** Reorder so display[0] is front-most (Figma-style). */
function applyDisplayOrder(canvas, displayOrder) {
  const bottomToTop = displayOrder.slice().reverse();
  bottomToTop.forEach((obj, i) => {
    if (typeof canvas.moveObjectTo === 'function') canvas.moveObjectTo(obj, i);
    else if (typeof obj.moveTo === 'function') obj.moveTo(i);
  });
  canvas.requestRenderAll();
}

function captureThumb(canvas) {
  if (!canvas) return null;
  try {
    return canvas.toDataURL({ format: 'png', multiplier: 0.1, enableRetinaScaling: false });
  } catch {
    return null;
  }
}

/**
 * Frames tab: pick a frame (live canvas thumbs), then drag layers to restack.
 * Device + screenshot layers are hide-only (no delete).
 */
export default function FramesPanel({
  frames,
  activeIndex,
  onSelectFrame,
  canvas,
  getCanvasForFrame,
  canvasWidth = 1080,
  canvasHeight = 1920,
}) {
  const [layers, setLayers] = useState([]);
  const [active, setActive] = useState(null);
  const [thumbs, setThumbs] = useState({});
  const dragFrom = useRef(null);
  const [dragOver, setDragOver] = useState(null);
  const [dragging, setDragging] = useState(false);

  const refreshThumbs = useCallback(() => {
    if (!frames?.length || !getCanvasForFrame) return;
    const next = {};
    frames.forEach((frame) => {
      const c = getCanvasForFrame(frame.id);
      const url = captureThumb(c);
      if (url) next[frame.id] = url;
    });
    setThumbs(next);
  }, [frames, getCanvasForFrame]);

  useEffect(() => {
    refreshThumbs();
    const t = setInterval(refreshThumbs, 2000);
    return () => clearInterval(t);
  }, [refreshThumbs]);

  useEffect(() => {
    if (!canvas) {
      setLayers([]);
      setActive(null);
      return;
    }
    const sync = () => {
      const objs = canvas.getObjects().slice().reverse();
      setLayers(objs);
      setActive(canvas.getActiveObject() || null);
      const frame = frames[activeIndex];
      if (frame) {
        const url = captureThumb(canvas);
        if (url) setThumbs((prev) => ({ ...prev, [frame.id]: url }));
      }
    };
    sync();
    canvas.on('object:added', sync);
    canvas.on('object:removed', sync);
    canvas.on('object:modified', sync);
    canvas.on('selection:created', sync);
    canvas.on('selection:updated', sync);
    canvas.on('selection:cleared', sync);
    return () => {
      canvas.off('object:added', sync);
      canvas.off('object:removed', sync);
      canvas.off('object:modified', sync);
      canvas.off('selection:created', sync);
      canvas.off('selection:updated', sync);
      canvas.off('selection:cleared', sync);
    };
  }, [canvas, frames, activeIndex]);

  const selectLayer = (obj) => {
    if (!canvas || !obj) return;
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
    setActive(obj);
  };

  const removeLayer = (obj) => {
    if (!canvas || !obj || isProtectedLayer(obj)) return;
    canvas.remove(obj);
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  };

  const toggleVisible = (obj) => {
    if (!canvas || !obj) return;
    obj.set('visible', obj.visible === false);
    canvas.requestRenderAll();
    setLayers(canvas.getObjects().slice().reverse());
  };

  const onDragStart = (e, index) => {
    dragFrom.current = index;
    setDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    if (e.currentTarget instanceof HTMLElement) {
      e.dataTransfer.setDragImage(e.currentTarget, 12, 16);
    }
  };

  const onDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOver !== index) setDragOver(index);
  };

  const onDrop = (e, toIndex) => {
    e.preventDefault();
    const fromIndex = dragFrom.current;
    setDragOver(null);
    setDragging(false);
    dragFrom.current = null;
    if (fromIndex == null || fromIndex === toIndex || !canvas) return;
    const next = layers.slice();
    const [item] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, item);
    setLayers(next);
    applyDisplayOrder(canvas, next);
  };

  const onDragEnd = () => {
    dragFrom.current = null;
    setDragOver(null);
    setDragging(false);
  };

  const thumbH = 88;
  const thumbW = Math.round(thumbH * (canvasWidth / canvasHeight));

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="font-semibold text-glint-text-secondary text-[10px] uppercase tracking-wider">
          Frames
        </h3>
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {frames.map((frame, i) => {
            const selected = i === activeIndex;
            const thumb = thumbs[frame.id];
            return (
              <button
                key={frame.id}
                type="button"
                onClick={() => onSelectFrame(i)}
                className={`shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                  selected
                    ? 'border-glint-accent shadow-sm shadow-glint-accent/20'
                    : 'border-glint-border hover:border-glint-border-strong'
                }`}
                style={{ width: thumbW }}
                title={`Frame ${i + 1}`}
              >
                <div
                  className="bg-glint-surface-2 relative"
                  style={{ width: thumbW, height: thumbH }}
                >
                  {thumb ? (
                    <img
                      src={thumb}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <div className="absolute inset-0 animate-pulse bg-glint-surface-2" />
                  )}
                  <span className="absolute bottom-0.5 left-0.5 text-[9px] font-semibold px-1 rounded bg-black/55 text-white tabular-nums">
                    #{i + 1}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-glint-text-secondary text-[10px] uppercase tracking-wider">
            Layers
          </h3>
          <span className="text-[10px] text-glint-text-tertiary">
            Frame #{activeIndex + 1}
          </span>
        </div>
        <p className="text-[10px] text-glint-text-tertiary">
          Drag to reorder · top = front · device is hide-only
        </p>

        {!canvas && (
          <p className="text-xs text-glint-text-tertiary">Select a frame on the canvas.</p>
        )}
        {canvas && !layers.length && (
          <p className="text-xs text-glint-text-tertiary">No layers yet.</p>
        )}

        <div className={`space-y-0.5 ${dragging ? 'select-none' : ''}`}>
          {layers.map((obj, i) => {
            const isActive = active === obj;
            const isOver = dragOver === i;
            const isSource = dragging && dragFrom.current === i;
            const protectedLayer = isProtectedLayer(obj);
            const hidden = obj.visible === false;
            return (
              <div
                key={obj.__uid ?? `${obj.type}-${i}`}
                draggable
                onDragStart={(e) => onDragStart(e, i)}
                onDragOver={(e) => onDragOver(e, i)}
                onDrop={(e) => onDrop(e, i)}
                onDragEnd={onDragEnd}
                className={`flex items-center gap-1.5 px-1.5 py-2 rounded-lg border text-xs transition-all ${
                  isOver && !isSource
                    ? 'border-glint-accent bg-glint-accent-muted/35 ring-1 ring-glint-accent/40 translate-y-0.5'
                    : ''
                } ${
                  isSource ? 'opacity-40 border-dashed border-glint-border' : ''
                } ${
                  isActive && !isOver && !isSource
                    ? 'border-glint-accent bg-glint-accent-muted/20'
                    : !isOver && !isSource
                      ? 'border-glint-border bg-glint-surface hover:bg-glint-surface-2'
                      : ''
                } ${hidden && !isSource ? 'opacity-55' : ''}`}
              >
                <span className="text-glint-text-tertiary cursor-grab active:cursor-grabbing shrink-0 touch-none">
                  <GripVertical size={14} />
                </span>
                <button
                  type="button"
                  onClick={() => selectLayer(obj)}
                  className="flex-1 text-left text-glint-text-secondary truncate min-w-0"
                >
                  {layerName(obj, i)}
                </button>
                {protectedLayer ? (
                  <button
                    type="button"
                    title={hidden ? 'Show layer' : 'Hide layer'}
                    onClick={() => toggleVisible(obj)}
                    className="p-1 rounded text-glint-text-tertiary hover:text-glint-accent hover:bg-glint-surface-2 shrink-0"
                  >
                    {hidden ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                ) : (
                  <button
                    type="button"
                    title="Delete"
                    onClick={() => removeLayer(obj)}
                    className="p-1 rounded text-glint-text-tertiary hover:text-red-500 hover:bg-glint-surface-2 shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
