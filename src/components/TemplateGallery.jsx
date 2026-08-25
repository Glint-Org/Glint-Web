import { useEffect, useState } from 'react';
import { loadAllTemplates } from '../utils/templateLoader';
import TemplateSetPreview from './TemplateSetPreview';

/**
 * Left sidebar — pick a store template pack (preview only, no name/badge).
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
    <div className="space-y-2">
      <p className="text-[10px] text-glint-text-tertiary leading-relaxed">
        Pick a pack to load on the board.
      </p>
      {templates.map((t) => (
        <button
          key={t.id}
          type="button"
          title={t.name || t.id}
          onClick={() => onChange(t)}
          className="group w-full rounded-xl overflow-hidden border border-glint-border hover:border-glint-accent/50 hover:shadow-md transition-all bg-glint-surface focus:outline-none focus:ring-2 focus:ring-glint-accent/40"
        >
          <div className="aspect-[5/1.35] relative">
            <TemplateSetPreview template={t} compact />
          </div>
        </button>
      ))}
    </div>
  );
}
