import { Smartphone, Tablet, Minus } from 'lucide-react';

/** Curated frames only — most-used Play / App Store devices. */
export const FRAME_OPTIONS = [
  { id: null, label: 'None', icon: Minus },
  { id: 'pixel9', label: 'Pixel 9', icon: Smartphone },
  { id: 'galaxy-s24', label: 'Galaxy S24', icon: Smartphone },
  { id: 'iphone16-pro-max', label: 'iPhone 16 Pro Max', icon: Smartphone },
  { id: 'iphone16-pro', label: 'iPhone 16 Pro', icon: Smartphone },
  { id: 'ipad-pro-13', label: 'iPad Pro 13"', icon: Tablet },
  { id: 'ipad-pro', label: 'iPad Pro 11"', icon: Tablet },
];

export default function FrameSelector({ selected, onChange, compact = false }) {
  if (compact) {
    return (
      <div className="space-y-1">
        <span className="text-[10px] text-glint-text-tertiary">Device frame</span>
        <select
          value={selected ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="w-full px-2 py-1.5 border border-glint-border rounded-lg text-xs bg-glint-surface text-glint-text"
        >
          {FRAME_OPTIONS.map((f) => (
            <option key={f.id ?? 'none'} value={f.id ?? ''}>
              {f.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-[10px] font-semibold text-glint-text-secondary uppercase tracking-wider">
        Device frame
      </h3>
      <div className="grid grid-cols-3 gap-1.5">
        {FRAME_OPTIONS.map((f) => {
          const Icon = f.icon;
          const active = selected === f.id;
          return (
            <button
              key={f.id ?? 'none'}
              type="button"
              onClick={() => onChange(f.id)}
              title={f.label}
              className={`px-1.5 py-2 rounded-lg text-[10px] border transition-all text-center leading-tight ${
                active
                  ? 'border-glint-accent ring-1 ring-glint-accent/30 bg-glint-accent-muted text-glint-accent font-semibold'
                  : 'border-glint-border hover:border-glint-border-strong bg-glint-surface text-glint-text-secondary'
              }`}
            >
              <Icon size={14} className="mx-auto mb-0.5 opacity-80" />
              {f.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
