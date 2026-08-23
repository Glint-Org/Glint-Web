import { Smartphone, Tablet, Minus } from 'lucide-react';

const FRAMES = [
  { id: null, label: 'No Frame', icon: Minus },
  { id: 'generic', label: 'Generic Android', icon: Smartphone },
  { id: 'pixel7', label: 'Pixel 7', icon: Smartphone },
  { id: 'galaxy-s23', label: 'Galaxy S23', icon: Smartphone },
  { id: 'samsung-m12', label: 'Samsung M12', icon: Smartphone },
  { id: 'iphone15', label: 'iPhone 15', icon: Smartphone },
  { id: 'iphone14-pro', label: 'iPhone 14 Pro', icon: Smartphone },
  { id: 'ipad-pro', label: 'iPad Pro', icon: Tablet },
  { id: 'ipad-10', label: 'iPad 10th Gen', icon: Tablet },
];

export default function FrameSelector({ selected, onChange }) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-glint-text-secondary text-sm">Device Frame</h3>
      <div className="grid grid-cols-3 gap-1.5">
        {FRAMES.map((f) => {
          const Icon = f.icon;
          return (
            <button key={f.id ?? 'none'} onClick={() => onChange(f.id)}
              className={`px-2 py-2 rounded-lg text-xs border transition-all text-center ${selected === f.id ? 'border-glint-accent ring-2 ring-glint-accent/30 bg-glint-accent-muted' : 'border-glint-border hover:border-glint-border-strong bg-glint-surface'}`}>
              <Icon size={16} className="mx-auto mb-0.5 text-glint-text-secondary" />
              <div className="text-glint-text-secondary leading-tight">{f.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
