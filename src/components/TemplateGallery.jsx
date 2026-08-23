import { useEffect, useState } from 'react';
import { loadAllTemplates } from '../utils/templateLoader';

const PREVIEW_COLORS = {
  'sunset-gradient': 'linear-gradient(135deg, #ff7e5f, #feb47b)',
  'ocean-gradient': 'linear-gradient(135deg, #0f2027, #2c5364)',
  'purple-gradient': 'linear-gradient(135deg, #667eea, #764ba2)',
  'mint-gradient': 'linear-gradient(135deg, #11998e, #38ef7d)',
  'dark-solid': '#1a1a2e',
  'dark-minimal': '#0d0d0d',
  'ios-light': '#f5f5f7',
  'light-solid': '#ffffff',
};

function getPreviewStyle(template) {
  const bg = template.layers?.find((l) => l.type === 'background');
  if (bg?.theme && PREVIEW_COLORS[bg.theme]) {
    const val = PREVIEW_COLORS[bg.theme];
    return typeof val === 'string' && val.startsWith('linear') ? { background: val } : { background: val };
  }
  return { background: 'linear-gradient(135deg, #667eea, #764ba2)' };
}

export default function TemplateGallery({ selected, onChange }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllTemplates().then(setTemplates).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-glint-text-tertiary">Loading templates...</p>;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-glint-text-secondary text-sm">Templates</h3>
      <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
        {templates.map((t) => (
          <button key={t.id} onClick={() => onChange(t)}
            className={`group rounded-xl overflow-hidden border transition-all ${selected?.id === t.id ? 'border-glint-accent ring-2 ring-glint-accent/30' : 'border-glint-border hover:border-glint-border-strong'}`}>
            <div className="aspect-[9/16] relative" style={getPreviewStyle(t)}>
              <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                {t.layers?.some((l) => l.type === 'device-frame') && (
                  <div className="w-8 h-14 rounded border border-white/30 bg-white/15 mb-1" />
                )}
                {t.layers?.filter((l) => l.type === 'headline').slice(0, 1).map((l, i) => (
                  <div key={i} className="text-white text-[8px] font-bold text-center px-1 drop-shadow">{l.placeholder || 'Headline'}</div>
                ))}
              </div>
            </div>
            <div className="p-2 bg-glint-surface">
              <div className="font-medium text-xs text-glint-text truncate">{t.name}</div>
              <div className="text-[10px] text-glint-text-secondary truncate">{t.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
