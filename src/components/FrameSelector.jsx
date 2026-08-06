const FRAMES = [
  { id: null, label: 'No Frame' },
  { id: 'generic', label: 'Generic Android' },
  { id: 'pixel7', label: 'Pixel 7' },
  { id: 'galaxy-s23', label: 'Galaxy S23' },
];

export default function FrameSelector({ selected, onChange }) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-gray-700">Device Frame</h3>
      <div className="grid grid-cols-2 gap-2">
        {FRAMES.map((f) => (
          <button
            key={f.id ?? 'none'}
            onClick={() => onChange(f.id)}
            className={`px-3 py-2 rounded-lg text-sm border transition-all ${
              selected === f.id
                ? 'border-blue-500 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
