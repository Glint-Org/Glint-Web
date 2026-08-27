import { useRef } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';

/**
 * Per-frame screenshot slots: import / replace / clear (no reorder - use frame move on canvas).
 */
export default function FrameScreenshotsPanel({ frames, onReplace, onClear }) {
  const inputRefs = useRef({});

  if (!frames?.length) return null;

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-glint-text-secondary text-[10px] uppercase tracking-wider">
        Screenshots
      </h3>
      <p className="text-[10px] text-glint-text-tertiary">
        Import one shot per frame — each fits the template slot automatically.
      </p>
      <div className="space-y-1.5">
        {frames.map((frame, i) => (
          <div
            key={frame.id}
            className="flex items-center gap-2 p-1.5 rounded-lg border border-glint-border bg-glint-surface"
          >
            <div className="w-9 h-14 rounded overflow-hidden border border-glint-border bg-white shrink-0">
              {frame.screenshotUrl ? (
                <img
                  src={frame.screenshotUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>
            <span className="flex-1 text-xs text-glint-text-secondary tabular-nums">#{i + 1}</span>
            <input
              ref={(el) => { inputRefs.current[frame.id] = el; }}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onReplace?.(i, file);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              title="Replace screenshot"
              onClick={() => inputRefs.current[frame.id]?.click()}
              className="p-1.5 rounded-md border border-glint-border text-glint-text-secondary hover:text-glint-text hover:bg-glint-surface-2"
            >
              <ImagePlus size={14} />
            </button>
            <button
              type="button"
              title="Clear to white"
              onClick={() => onClear?.(i)}
              className="p-1.5 rounded-md border border-glint-border text-glint-text-secondary hover:text-red-500 hover:bg-glint-surface-2"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
