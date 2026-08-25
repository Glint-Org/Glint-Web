const THEMES = [
  { label: 'Charcoal', type: 'solid', value: '#1C1C1E' },
  { label: 'Midnight', type: 'solid', value: '#0B0D10' },
  { label: 'Slate', type: 'solid', value: '#2C2C2E' },
  { label: 'Ocean', type: 'solid', value: '#0F2744' },
  { label: 'Forest', type: 'solid', value: '#1A2F23' },
  { label: 'Snow', type: 'solid', value: '#F5F5F7' },
  { label: 'White', type: 'solid', value: '#FFFFFF' },
  { label: 'Sand', type: 'solid', value: '#F0EBE3' },
  {
    label: 'Graphite',
    type: 'gradient',
    value: [
      { offset: 0, color: '#2A2D34' },
      { offset: 1, color: '#12151A' },
    ],
  },
  {
    label: 'Soft Blue',
    type: 'gradient',
    value: [
      { offset: 0, color: '#E8F1F8' },
      { offset: 1, color: '#D4E4F0' },
    ],
  },
  {
    label: 'Warm',
    type: 'gradient',
    value: [
      { offset: 0, color: '#FF8A5C' },
      { offset: 1, color: '#FFB347' },
    ],
  },
  {
    label: 'Amber',
    type: 'gradient',
    value: [
      { offset: 0, color: '#2A2118' },
      { offset: 1, color: '#1A1510' },
    ],
  },
];

function getSwatchStyle(theme) {
  if (theme.type === 'gradient') {
    const stops = theme.value.map((s) => `${s.color} ${s.offset * 100}%`).join(', ');
    return { background: `linear-gradient(180deg, ${stops})` };
  }
  return { background: theme.value };
}

function isSelected(selected, theme) {
  if (!selected) return false;
  if (selected.label && theme.label) return selected.label === theme.label;
  if (selected.type === 'solid' && theme.type === 'solid') return selected.value === theme.value;
  return false;
}

export default function ThemeSelector({ selected, onChange }) {
  const customColor =
    selected?.type === 'solid' && !THEMES.some((t) => t.type === 'solid' && t.value === selected.value)
      ? selected.value
      : '#F5D06F';

  return (
    <div className="space-y-2">
      <p className="text-[10px] text-glint-text-tertiary">
        Background for the active store frame. Selected swatch is highlighted.
      </p>
      <div className="grid grid-cols-4 gap-1.5">
        {THEMES.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => onChange(t)}
            title={t.label}
            className={`group relative rounded-lg overflow-hidden border-2 transition-all aspect-square ${
              isSelected(selected, t)
                ? 'border-glint-accent ring-2 ring-glint-accent/30'
                : 'border-glint-border hover:border-glint-border-strong'
            }`}
          >
            <div className="w-full h-full" style={getSwatchStyle(t)} />
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 pt-1">
        <label className="text-[10px] text-glint-text-secondary shrink-0">Custom</label>
        <input
          type="color"
          value={selected?.type === 'solid' ? selected.value : customColor}
          onChange={(e) => onChange({ label: 'Custom', type: 'solid', value: e.target.value })}
          className="w-8 h-8 rounded cursor-pointer border border-glint-border bg-transparent p-0"
        />
        <input
          type="text"
          value={selected?.type === 'solid' ? selected.value : ''}
          placeholder="#1C1C1E"
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
              onChange({ label: 'Custom', type: 'solid', value: v });
            }
          }}
          className="flex-1 px-2 py-1.5 border border-glint-border rounded-lg text-[11px] font-mono bg-glint-surface text-glint-text"
        />
      </div>
    </div>
  );
}
