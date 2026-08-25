import { useEffect, useState } from 'react';
import { loadAllTemplates } from '../utils/templateLoader';
import TemplateSetPreview from './TemplateSetPreview';

const STORE_LABEL = {
  play: 'Play Store',
  ios: 'App Store',
  'ios-tablet': 'iPad',
};

/**
 * Left sidebar — pick a store template pack.
 */
export default function TemplateGallery({ onChange }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllTemplates().then(setTemplates).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-sm text-glint-text-tertiary">Loading templates…</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] text-glint-text-tertiary leading-relaxed">
        Pick a pack to load frames on the board. Design tools stay on the right.
      </p>
      {templates.map((t) => {
        const store = STORE_LABEL[t.store] || t.store || 'Store';
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t)}
            className="group w-full text-left rounded-xl overflow-hidden border border-glint-border hover:border-glint-accent/50 hover:shadow-md transition-all bg-glint-surface"
          >
            <div className="aspect-[5/1.35] relative">
              <TemplateSetPreview template={t} compact />
            </div>
            <div className="flex items-center justify-between gap-2 px-2.5 py-2 border-t border-glint-border">
              <span className="text-xs font-semibold text-glint-text truncate">
                {t.name || t.id}
              </span>
              <span className="shrink-0 text-[9px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded bg-glint-surface-2 text-glint-text-secondary">
                {store}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
