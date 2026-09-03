import { X, Copy } from 'lucide-react';

/**
 * Modal showing all frames as thumbnails. Pick a frame to copy selected objects to.
 */
export default function CopyToFrameModal({
  open,
  frames,
  activeIndex,
  onCopy,
  onClose,
  getCanvasForFrame,
  canvasWidth = 1080,
  canvasHeight = 1920,
}) {
  if (!open) return null;

  const handleCopy = async (targetIndex) => {
    const targetFrame = frames[targetIndex];
    if (!targetFrame) return;
    await onCopy(targetFrame.id, targetIndex);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onMouseDown={onClose}>
      <div
        className="bg-glint-surface border border-glint-border rounded-xl shadow-2xl p-4 w-[520px] max-h-[80vh] overflow-y-auto"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-glint-text flex items-center gap-2">
            <Copy size={14} />
            Copy to frame
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-glint-surface-2 text-glint-text-secondary">
            <X size={14} />
          </button>
        </div>

        <p className="text-[11px] text-glint-text-tertiary mb-3">
          Select objects on the current frame, then pick a target frame to copy them to.
        </p>

        <div className="grid grid-cols-3 gap-2">
          {frames.map((frame, i) => {
            const isActive = i === activeIndex;
            const scale = 80 / canvasWidth;
            const thumbH = Math.round(canvasHeight * scale);

            return (
              <button
                key={frame.id}
                onClick={() => handleCopy(i)}
                className={`relative rounded-lg border overflow-hidden transition-all group ${
                  isActive
                    ? 'border-glint-accent ring-1 ring-glint-accent/30 opacity-50 cursor-not-allowed'
                    : 'border-glint-border hover:border-glint-accent hover:ring-1 hover:ring-glint-accent/30'
                }`}
                disabled={isActive}
              >
                {/* Mini frame preview */}
                <div
                  className="mx-auto mt-2 rounded-sm overflow-hidden bg-glint-bg"
                  style={{ width: 80, height: thumbH }}
                >
                  <CanvasThumbnail frameId={frame.id} getCanvasForFrame={getCanvasForFrame} />
                </div>

                <div className="px-1 py-1.5 text-center">
                  <span className="text-[10px] font-medium text-glint-text">
                    {isActive ? `Frame ${i + 1} (current)` : `Frame ${i + 1}`}
                  </span>
                  {frame.headline && (
                    <span className="block text-[9px] text-glint-text-tertiary truncate px-1">
                      {frame.headline}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Tiny canvas thumbnail that renders a static preview of the frame.
 */
function CanvasThumbnail({ frameId, getCanvasForFrame }) {
  const canvas = getCanvasForFrame?.(frameId);
  if (!canvas) {
    return <div className="w-full h-full bg-glint-surface-2" />;
  }

  const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 0.1 });
  return (
    <img
      src={dataUrl}
      alt=""
      className="w-full h-full object-contain"
      draggable={false}
    />
  );
}
