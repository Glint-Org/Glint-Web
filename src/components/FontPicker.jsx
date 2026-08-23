import { useState, useEffect, useRef } from 'react';

const GOOGLE_FONTS = [
  { name: 'Inter', category: 'sans-serif' },
  { name: 'Roboto', category: 'sans-serif' },
  { name: 'Open Sans', category: 'sans-serif' },
  { name: 'Lato', category: 'sans-serif' },
  { name: 'Montserrat', category: 'sans-serif' },
  { name: 'Poppins', category: 'sans-serif' },
  { name: 'Nunito', category: 'sans-serif' },
  { name: 'Raleway', category: 'sans-serif' },
  { name: 'Work Sans', category: 'sans-serif' },
  { name: 'Rubik', category: 'sans-serif' },
  { name: 'DM Sans', category: 'sans-serif' },
  { name: 'Sora', category: 'sans-serif' },
  { name: 'Outfit', category: 'sans-serif' },
  { name: 'Plus Jakarta Sans', category: 'sans-serif' },
  { name: 'Space Grotesk', category: 'sans-serif' },
  { name: 'Manrope', category: 'sans-serif' },
  { name: 'Lexend', category: 'sans-serif' },
  { name: 'Oswald', category: 'sans-serif' },
  { name: 'Bebas Neue', category: 'display' },
  { name: 'Anton', category: 'display' },
  { name: 'Playfair Display', category: 'serif' },
  { name: 'Merriweather', category: 'serif' },
  { name: 'Lora', category: 'serif' },
  { name: 'PT Serif', category: 'serif' },
  { name: 'Source Serif 4', category: 'serif' },
  { name: 'Caveat', category: 'handwriting' },
  { name: 'Dancing Script', category: 'handwriting' },
  { name: 'Pacifico', category: 'handwriting' },
  { name: 'JetBrains Mono', category: 'monospace' },
  { name: 'Fira Code', category: 'monospace' },
  { name: 'Space Mono', category: 'monospace' },
];

const loadedFonts = new Set(['Inter']);

function loadGoogleFont(fontName) {
  if (loadedFonts.has(fontName)) return;
  const link = document.createElement('link');
  link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@400;500;600;700;800&display=swap`;
  link.rel = 'stylesheet';
  document.head.appendChild(link);
  loadedFonts.add(fontName);
}

export default function FontPicker({ selected, onChange }) {
  const [search, setSearch] = useState('');
  const [customFonts, setCustomFonts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const fileInputRef = useRef(null);

  const allFonts = [...GOOGLE_FONTS, ...customFonts.map((f) => ({ name: f.name, category: 'custom' }))];

  const filtered = allFonts.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'all' || f.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCustomUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const name = file.name.replace(/\.(ttf|otf|woff|woff2)$/i, '');
      const url = URL.createObjectURL(file);
      const fontFace = new FontFace(name, `url(${url})`);
      fontFace.load().then((loaded) => {
        document.fonts.add(loaded);
        setCustomFonts((prev) => [...prev, { name, category: 'custom' }]);
        onChange(name);
      });
    });
    e.target.value = '';
  };

  useEffect(() => {
    if (selected) loadGoogleFont(selected);
  }, [selected]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-glint-text-secondary text-sm">Font</h3>
        <button onClick={() => fileInputRef.current?.click()} className="text-xs text-glint-accent hover:text-glint-accent-hover font-medium">+ Upload</button>
        <input ref={fileInputRef} type="file" accept=".ttf,.otf,.woff,.woff2" multiple onChange={handleCustomUpload} className="hidden" />
      </div>

      <input type="text" placeholder="Search fonts..." value={search} onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-1.5 border border-glint-border rounded-lg text-sm bg-glint-surface text-glint-text" />

      <div className="flex gap-1 flex-wrap">
        {['all', 'sans-serif', 'serif', 'display', 'monospace', 'handwriting', 'custom'].map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${activeCategory === cat ? 'bg-glint-accent-muted text-glint-accent' : 'text-glint-text-secondary hover:bg-glint-surface-2'}`}>
            {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
        {filtered.map((f) => (
          <button key={f.name} onClick={() => { loadGoogleFont(f.name); onChange(f.name); }}
            className={`text-left px-2 py-1.5 rounded text-xs transition-all ${selected === f.name ? 'bg-glint-accent-muted text-glint-accent font-semibold' : 'hover:bg-glint-surface-2 text-glint-text-secondary'}`}
            style={{ fontFamily: `"${f.name}", sans-serif` }}>
            {f.name}
          </button>
        ))}
      </div>

      {selected && (
        <div className="p-3 bg-glint-surface-2 rounded-lg">
          <div className="text-2xl font-bold text-glint-text" style={{ fontFamily: `"${selected}", sans-serif` }}>Aa</div>
          <div className="text-xs text-glint-text-secondary mt-1">{selected}</div>
        </div>
      )}
    </div>
  );
}
