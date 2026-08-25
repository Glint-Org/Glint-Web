import { Minus } from 'lucide-react';

/** Curated frames only — most-used Play / App Store devices. */
export const FRAME_OPTIONS = [
  { id: null, label: 'None' },
  { id: 'pixel9', label: 'Pixel 9' },
  { id: 'galaxy-s24', label: 'Galaxy S24' },
  { id: 'simple-dark', label: 'Simple Dark' },
  { id: 'iphone16-pro-max', label: 'iPhone 16 Pro Max' },
  { id: 'iphone16-pro', label: 'iPhone 16 Pro' },
  { id: 'ipad-pro-13', label: 'iPad Pro 13"' },
  { id: 'ipad-pro', label: 'iPad Pro 11"' },
];

/**
 * Visual device frame picker — SVG tiles with clear selected state.
 */
export default function FrameSelector({ selected, onChange }) {
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-2 gap-1.5">
        {FRAME_OPTIONS.map((f) => {
          const active = selected === f.id;
          return (
            <button
              key={f.id ?? 'none'}
              type="button"
              title={f.label}
              onClick={() => onChange(f.id)}
              className={`group relative aspect-[3/4] rounded-lg border overflow-hidden transition-all text-left ${
                active
                  ? 'border-glint-accent ring-2 ring-glint-accent/40 bg-glint-accent-muted'
                  : 'border-glint-border bg-glint-surface-2 hover:border-glint-accent/50'
              }`}
            >
              {f.id ? (
                <img
                  src={`/frames/${f.id}.svg`}
                  alt={f.label}
                  className="absolute inset-2 w-[calc(100%-1rem)] h-[calc(100%-2.25rem)] object-contain pointer-events-none"
                  draggable={false}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-glint-text-tertiary">
                  <Minus size={18} />
                  <span className="text-[10px]">No bezel</span>
                </div>
              )}
              <span
                className={`absolute inset-x-0 bottom-0 px-1 py-0.5 text-[9px] font-medium text-center truncate ${
                  active ? 'bg-glint-accent text-glint-text-on-accent' : 'bg-black/45 text-white'
                }`}
              >
                {f.label}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-glint-text-tertiary leading-relaxed">
        Click a bezel to replace every device on the board. Your screenshots stay and cover-fill the new screen.
      </p>
    </div>
  );
}
