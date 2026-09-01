import {
  Plus, Copy, Trash2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import FrameCanvas from './FrameCanvas';
import { MAX_FRAMES, MIN_FRAMES } from '../hooks/useFrames';
import { readDroppedScreenshotUrl } from '../utils/assetLibrary';

/**
 * AppLaunchpad-style board: horizontal row of clipped Frame artboards.
 */
export default function FrameBoard({
  frames,
  activeIndex,
  onSelect,
  onAdd,
  onDuplicate,
  onDelete,
  onMove,
  onCanvasReady,
  onDeviceContextMenu,
  canvasWidth = 1080,
  canvasHeight = 1920,
  themes = {},
  zoom = 16,
  padLeft = 0,
  padRight = 0,
  onDropScreenshot,
}) {
  const sizeLabel = `${canvasWidth}×${canvasHeight}`;
  const scale = zoom / 100;
  const [dropTarget, setDropTarget] = useState(null);

  const handleFrameDragOver = (e, index) => {
    const types = Array.from(e.dataTransfer?.types || []);
    const hasShot = types.includes('application/x-glint-screenshot');
    const hasFiles = types.includes('Files');
    if (!hasShot && !hasFiles) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setDropTarget(index);
  };

  const handleFrameDrop = async (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTarget(null);
    const url = readDroppedScreenshotUrl(e.dataTransfer);
    if (url) {
      await onDropScreenshot?.(index, url);
      return;
    }
    const file = Array.from(e.dataTransfer.files || []).find((f) => f.type.startsWith('image/'));
    if (file && onDropScreenshot) {
      const blobUrl = URL.createObjectURL(file);
      await onDropScreenshot(index, blobUrl, { id: `drop-${Date.now()}`, name: file.name, url: blobUrl });
    }
  };

  return (
    <div className="h-full w-full overflow-auto frame-board-scroll">
      <div
        className="flex items-center gap-6 py-10 min-h-full transition-[padding] duration-200 ease-out"
        style={{
          width: 'max-content',
          margin: '0 auto',
          paddingLeft: Math.max(32, padLeft + 32),
          paddingRight: Math.max(32, padRight + 32),
        }}
      >
        {frames.map((frame, i) => {
          const selected = i === activeIndex;
          return (
            <div
              key={frame.id}
              className="relative flex flex-col items-center group"
              onClick={() => onSelect(i)}
              onDragLeave={() => setDropTarget((t) => (t === i ? null : t))}
              onDragOver={(e) => handleFrameDragOver(e, i)}
              onDrop={(e) => handleFrameDrop(e, i)}
            >
              <div
                className={`flex items-center gap-0.5 mb-2 transition-opacity ${
                  selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                <CtrlBtn
                  title="Add frame after"
                  disabled={frames.length >= MAX_FRAMES}
                  onClick={(e) => { e.stopPropagation(); onAdd(i); }}
                >
                  <Plus size={14} />
                </CtrlBtn>
                <CtrlBtn
                  title="Duplicate"
                  disabled={frames.length >= MAX_FRAMES}
                  onClick={(e) => { e.stopPropagation(); onDuplicate(i); }}
                >
                  <Copy size={14} />
                </CtrlBtn>
                <CtrlBtn
                  title="Delete"
                  disabled={frames.length <= MIN_FRAMES}
                  onClick={(e) => { e.stopPropagation(); onDelete(i); }}
                >
                  <Trash2 size={14} />
                </CtrlBtn>
                <CtrlBtn
                  title="Move left"
                  disabled={i === 0}
                  onClick={(e) => { e.stopPropagation(); onMove(i, -1); }}
                >
                  <ChevronLeft size={14} />
                </CtrlBtn>
                <CtrlBtn
                  title="Move right"
                  disabled={i === frames.length - 1}
                  onClick={(e) => { e.stopPropagation(); onMove(i, 1); }}
                >
                  <ChevronRight size={14} />
                </CtrlBtn>
              </div>

              <div
                className={`relative overflow-hidden rounded-md bg-glint-surface transition-[box-shadow,opacity,ring] duration-150 ${
                  dropTarget === i
                    ? 'ring-2 ring-glint-accent ring-offset-2 ring-offset-glint-bg shadow-lg shadow-glint-accent/30'
                    : selected
                      ? 'ring-2 ring-glint-accent shadow-lg shadow-glint-accent/25'
                      : 'ring-1 ring-glint-border shadow-xl opacity-90 hover:opacity-100'
                }`}
              >
                <FrameCanvas
                  frameId={frame.id}
                  design={frame.design}
                  screenshotUrl={frame.screenshotUrl}
                  fabricJson={frame.fabricJson || null}
                  canvasWidth={canvasWidth}
                  canvasHeight={canvasHeight}
                  displayScale={scale}
                  themes={themes}
                  editable={selected}
                  onCanvasReady={onCanvasReady}
                  onDeviceContextMenu={onDeviceContextMenu}
                  paintKey={frame.fabricRestoreKey || frame.design?.id || 'nodesign'}
                />
              </div>

              <div className="mt-2 text-center">
                <div className={`text-xs font-semibold ${selected ? 'text-glint-accent' : 'text-glint-text-secondary'}`}>
                  #{i + 1}
                </div>
                <div className="text-[10px] text-glint-text-tertiary tabular-nums">{sizeLabel}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CtrlBtn({ children, onClick, disabled, title }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="p-1.5 rounded-md bg-glint-surface border border-glint-border text-glint-text-secondary hover:text-glint-text hover:bg-glint-surface-2 disabled:opacity-30 disabled:pointer-events-none"
    >
      {children}
    </button>
  );
}
