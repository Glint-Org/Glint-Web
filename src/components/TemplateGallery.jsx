import { useEffect, useState } from 'react';
import {
  loadAllTemplates,
  STORE_FILTERS,
  filterTemplatesByStore,
} from '../utils/templateLoader';
import TemplateSetPreview from './TemplateSetPreview';

/**
 * Left sidebar — pick a store template pack (preview only).
 * Store size is chosen here via filters, not in Export.
 */
export default function TemplateGallery({ onChange, activeStore }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storeFilter, setStoreFilter] = useState(activeStore || 'all');

  useEffect(() => {
    loadAllTemplates().then(setTemplates).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeStore && STORE_FILTERS.some((f) => f.id === activeStore)) {
      setStoreFilter(activeStore);
    }
  }, [activeStore]);

  const filtered = filterTemplatesByStore(templates, storeFilter);

  if (loading) {
    return <p className="text-sm text-glint-text-tertiary">Loading templates…</p>;
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] text-glint-text-tertiary leading-relaxed">
        Filter by store, then pick a pack. Export uses that size.
      </p>
      <div className="flex flex-wrap gap-1">
        {STORE_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setStoreFilter(f.id)}
            className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
              storeFilter === f.id
                ? 'bg-glint-accent text-glint-text-on-accent'
                : 'bg-glint-surface-2 text-glint-text-secondary hover:text-glint-text'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className="text-xs text-glint-text-tertiary py-4 text-center">
          No templates for this store yet.
        </p>
      ) : (
        <div className="space-y-2 overflow-hidden">
          {filtered.map((t) => (
            <button
              key={t.id}
              type="button"
              title={t.name || t.id}
              onClick={() => onChange(t)}
              className="group w-full rounded-xl overflow-hidden border border-glint-border hover:border-glint-accent/50 hover:shadow-md transition-all bg-glint-surface focus:outline-none focus:ring-2 focus:ring-glint-accent/40"
            >
              <TemplateSetPreview template={t} compact />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
