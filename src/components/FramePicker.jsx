import { useState, useRef } from 'react';

const BUILTIN_FRAMES = [
  { id: null, label: 'No Frame', icon: '—' },
  { id: 'generic', label: 'Generic', icon: '📱' },
  { id: 'pixel7', label: 'Pixel 7', icon: '📱' },
  { id: 'galaxy-s23', label: 'Galaxy S23', icon: '📱' },
  { id: 'samsung-m12', label: 'Samsung M12', icon: '📱' },
  { id: 'iphone15', label: 'iPhone 15', icon: '📱' },
  { id: 'iphone14-pro', label: 'iPhone 14 Pro', icon: '📱' },
  { id: 'ipad-pro', label: 'iPad Pro', icon: '📋' },
  { id: 'ipad-10', label: 'iPad 10', icon: '📋' },
];

export default function FramePicker({ selected, onChange }) {
  const [customFrames, setCustomFrames] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const allFrames = [...BUILTIN_FRAMES, ...customFrames.map((f) => ({ id: f.id, label: f.name, icon: '🖼️' }))];

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
        <h3 className="font-semibold text-gray-700 text-sm">Device Frame</h3>
        <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
          className="text-xs text-glint-accent hover:text-glint-accent-hover font-medium disabled:opacity-50">
          {uploading ? 'Uploading...' : '+ Upload SVG/PNG'}
        </button>
        <input ref={fileInputRef} type="file" accept=".svg,.png,.jpg,.jpeg" multiple onChange={handleUpload} className="hidden" />
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {allFrames.map((f) => (
          <button key={f.id ?? 'none'} onClick={() => onChange(f.id)}
            className={`px-2 py-2 rounded-lg text-xs border transition-all text-center ${selected === f.id ? 'border-glint-accent ring-2 ring-glint-accent/30 bg-glint-accent-muted' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
            <div className="text-base mb-0.5">{f.icon}</div>
            <div className="text-gray-700 leading-tight truncate">{f.label}</div>
          </button>
        ))}
      </div>

      {selected && selected.startsWith('custom-') && (
        <div className="p-2 bg-gray-50 rounded-lg flex items-center gap-2">
          <div className="w-8 h-12 bg-white border rounded flex items-center justify-center text-xs">SVG</div>
          <div className="flex-1 text-xs text-gray-600 truncate">{allFrames.find((f) => f.id === selected)?.label}</div>
          <button onClick={() => onChange(null)} className="text-xs text-red-500 hover:text-red-600">Remove</button>
        </div>
      )}
    </div>
  );
}
