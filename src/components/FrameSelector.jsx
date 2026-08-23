const FRAMES = [
  { id: null, label: 'No Frame', preview: '—' },
  { id: 'generic', label: 'Generic Android', preview: '🤖' },
  { id: 'pixel7', label: 'Pixel 7', preview: '📱' },
  { id: 'galaxy-s23', label: 'Galaxy S23', preview: '📱' },
  { id: 'samsung-m12', label: 'Samsung M12', preview: '📱' },
  { id: 'iphone15', label: 'iPhone 15', preview: '📱' },
  { id: 'iphone14-pro', label: 'iPhone 14 Pro', preview: '📱' },
  { id: 'ipad-pro', label: 'iPad Pro', preview: '📋' },
  { id: 'ipad-10', label: 'iPad 10th Gen', preview: '📋' },
];

export default function FrameSelector({ selected, onChange }) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-gray-700 text-sm">Device Frame</h3>
      <div className="grid grid-cols-3 gap-1.5">
        {FRAMES.map((f) => (
          <button key={f.id ?? 'none'} onClick={() => onChange(f.id)}
            className={`px-2 py-2 rounded-lg text-xs border transition-all text-center ${selected === f.id ? 'border-glint-accent ring-2 ring-glint-accent/30 bg-glint-accent-muted' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
            <div className="text-base mb-0.5">{f.preview}</div>
            <div className="text-gray-700 leading-tight">{f.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
