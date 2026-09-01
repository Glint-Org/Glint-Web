import { useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { ingestScreenshotFiles } from '../utils/screenshotStore';

/**
 * Per-frame screenshot slots with replace progress %.
 */
export default function FrameScreenshotsPanel({ frames, onReplace, onClear, onAssetAdded }) {
  const inputRefs = useRef({});
  const [progress, setProgress] = useState({}); // frameId → pct

  if (!frames?.length) return null;

  const handlePick = async (index, frameId, file) => {
    if (!file) return;
    setProgress((p) => ({ ...p, [frameId]: 0 }));
    try {
      const [ingested] = await ingestScreenshotFiles([file], (_i, pct) => {
        setProgress((p) => ({ ...p, [frameId]: pct }));
      });
      onAssetAdded?.([ingested]);
      await onReplace?.(index, ingested.url);
    } finally {
      setTimeout(() => {
        setProgress((p) => {
          const next = { ...p };
          delete next[frameId];
          return next;
        });
      }, 350);
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-glint-text-secondary text-[10px] uppercase tracking-wider">
        Screenshots
      </h3>
      <div className="space-y-1.5">
        {frames.map((frame, i) => {
          const pct = progress[frame.id];
          return (
            <div
              key={frame.id}
              className="flex items-center gap-2 p-1.5 rounded-lg border border-glint-border bg-glint-surface"
            >
              <div className="w-9 h-14 rounded overflow-hidden border border-glint-border bg-white shrink-0 relative">
                {frame.screenshotUrl ? (
                  <img
                    src={frame.screenshotUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : null}
                {pct != null && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-[10px] font-semibold text-white tabular-nums">{pct}%</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <span className="text-xs text-glint-text-secondary tabular-nums">#{i + 1}</span>
                {pct != null && (
                  <div className="h-1 rounded-full bg-glint-border overflow-hidden">
                    <div
                      className="h-full bg-glint-accent transition-[width] duration-100"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </div>
              <input
                ref={(el) => { inputRefs.current[frame.id] = el; }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  handlePick(i, frame.id, file);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                title="Replace screenshot"
                disabled={pct != null}
                onClick={() => inputRefs.current[frame.id]?.click()}
                className="p-1.5 rounded-md border border-glint-border text-glint-text-secondary hover:text-glint-text hover:bg-glint-surface-2 disabled:opacity-40"
              >
                <ImagePlus size={14} />
              </button>
              <button
                type="button"
                title="Clear"
                disabled={pct != null}
                onClick={() => onClear?.(i)}
                className="p-1.5 rounded-md border border-glint-border text-glint-text-secondary hover:text-red-500 hover:bg-glint-surface-2 disabled:opacity-40"
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
