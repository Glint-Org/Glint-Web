const THEMES = [
  { label: 'Sunset', type: 'gradient', value: [{ offset: 0, color: '#ff7e5f' }, { offset: 1, color: '#feb47b' }] },
  { label: 'Ocean', type: 'gradient', value: [{ offset: 0, color: '#0f2027' }, { offset: 0.5, color: '#203a43' }, { offset: 1, color: '#2c5364' }] },
  { label: 'Purple', type: 'gradient', value: [{ offset: 0, color: '#667eea' }, { offset: 1, color: '#764ba2' }] },
  { label: 'Mint', type: 'gradient', value: [{ offset: 0, color: '#11998e' }, { offset: 1, color: '#38ef7d' }] },
  { label: 'Fire', type: 'gradient', value: [{ offset: 0, color: '#f12711' }, { offset: 1, color: '#f5af19' }] },
  { label: 'Candy', type: 'gradient', value: [{ offset: 0, color: '#fc5c7d' }, { offset: 1, color: '#6a82fb' }] },
  { label: 'Royal', type: 'gradient', value: [{ offset: 0, color: '#141e30' }, { offset: 1, color: '#243b55' }] },
  { label: 'Dark', type: 'solid', value: '#1a1a2e' },
  { label: 'Black', type: 'solid', value: '#0d0d0d' },
  { label: 'White', type: 'solid', value: '#ffffff' },
  { label: 'Light Gray', type: 'solid', value: '#f5f5f7' },
  { label: 'Charcoal', type: 'solid', value: '#2d2d2d' },
];

function getSwatchStyle(theme) {
  if (theme.type === 'gradient') {
    const stops = theme.value.map((s) => `${s.color} ${s.offset * 100}%`).join(', ');
    return { background: `linear-gradient(135deg, ${stops})` };
  }
  return { background: theme.value };
}

export default function ThemeSelector({ selected, onChange }) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-glint-text-secondary text-sm">Background</h3>
      <div className="grid grid-cols-4 gap-1.5">
        {THEMES.map((t) => (
          <button key={t.label} onClick={() => onChange(t)}
            className={`group relative rounded-lg overflow-hidden border-2 transition-all aspect-square ${selected?.label === t.label ? 'border-glint-accent ring-2 ring-glint-accent/30' : 'border-glint-border hover:border-glint-border-strong'}`}>
            <div className="w-full h-full" style={getSwatchStyle(t)} />
            <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[9px] py-0.5 text-center opacity-0 group-hover:opacity-100 transition-opacity">{t.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
