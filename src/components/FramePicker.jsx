import { useState, useRef, useMemo } from 'react';
import { Smartphone, Tablet, Tv, Watch, Image, Minus, Monitor } from 'lucide-react';
import { framesForStore } from '../utils/frameMeta';

const ICONS = {
  null: Minus,
  pixel9: Smartphone,
  'galaxy-s24': Smartphone,
  tv: Tv,
  'iphone16-pro-max': Smartphone,
  'iphone16-pro': Smartphone,
  'phone-3d': Smartphone,
  'ipad-pro-13': Tablet,
  'ipad-pro': Tablet,
  'tablet-3d': Tablet,
  wear: Watch,
  chromebook: Monitor,
};

export default function FramePicker({ selected, onChange, store }) {
  const [customFrames, setCustomFrames] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const builtin = useMemo(() => framesForStore(store), [store]);
  const allFrames = [
    ...builtin.map((f) => ({
      id: f.id,
      label: f.label,
      Icon: ICONS[f.id] || (f.id == null ? Minus : Smartphone),
    })),
    ...customFrames.map((f) => ({ id: f.id, label: f.name, Icon: Image })),
  ];

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    setUploading(true);

    for (const file of files) {
      const name = file.name.replace(/\.(svg|png|jpg|jpeg)$/i, '');
      const url = URL.createObjectURL(file);
      const content = file.name.endsWith('.svg') ? await file.text() : null;

      setCustomFrames((prev) => [...prev, {
        id: `custom-${Date.now()}-${name}`,
        name,
        url,
        svgContent: content,
      }]);
    }

    setUploading(false);
    e.target.value = '';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-glint-text-secondary text-sm">Device Frame</h3>
        <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
          className="text-xs text-glint-accent hover:text-glint-accent-hover font-medium disabled:opacity-50">
          {uploading ? 'Uploading...' : '+ Upload SVG/PNG'}
        </button>
        <input ref={fileInputRef} type="file" accept=".svg,.png,.jpg,.jpeg" multiple onChange={handleUpload} className="hidden" />
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {allFrames.map((f) => {
          const Icon = f.Icon;
          return (
            <button key={f.id ?? 'none'} onClick={() => onChange(f.id)}
              className={`px-2 py-2 rounded-lg text-xs border transition-all text-center ${selected === f.id ? 'border-glint-accent ring-2 ring-glint-accent/30 bg-glint-accent-muted' : 'border-glint-border hover:border-glint-border-strong bg-glint-surface'}`}>
              <Icon size={16} className="mx-auto mb-0.5 text-glint-text-secondary" />
              <div className="text-glint-text-secondary leading-tight truncate">{f.label}</div>
            </button>
          );
        })}
      </div>

      {selected && selected.startsWith('custom-') && (
        <div className="p-2 bg-glint-surface-2 rounded-lg flex items-center gap-2">
          <div className="w-8 h-12 bg-glint-surface border border-glint-border rounded flex items-center justify-center text-xs">
            <Image size={14} className="text-glint-text-tertiary" />
          </div>
          <div className="flex-1 text-xs text-glint-text-secondary truncate">{allFrames.find((f) => f.id === selected)?.label}</div>
          <button onClick={() => onChange(null)} className="text-xs text-glint-danger hover:opacity-80">Remove</button>
        </div>
      )}
    </div>
  );
}
