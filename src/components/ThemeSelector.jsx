const THEMES = [
  { label: 'Dark Solid', type: 'solid', value: '#1a1a2e' },
  { label: 'Light Solid', type: 'solid', value: '#ffffff' },
  { label: 'Ocean Gradient', type: 'gradient', value: [
    { offset: 0, color: '#0f2027' },
    { offset: 0.5, color: '#203a43' },
    { offset: 1, color: '#2c5364' },
  ]},
  { label: 'Sunset Gradient', type: 'gradient', value: [
    { offset: 0, color: '#ff7e5f' },
    { offset: 1, color: '#feb47b' },
  ]},
  { label: 'Blur Glass', type: 'solid', value: 'rgba(255,255,255,0.15)' },
];

export default function ThemeSelector({ selected, onChange }) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-gray-700">Background Theme</h3>
      <div className="grid grid-cols-2 gap-2">
        {THEMES.map((t) => (
          <button
            key={t.label}
            onClick={() => onChange(t)}
            className={`px-3 py-2 rounded-lg text-sm border transition-all ${
              selected?.label === t.label
                ? 'border-blue-500 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
