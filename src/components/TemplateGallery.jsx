import { useEffect, useState } from 'react';
import { loadAllTemplates } from '../utils/templateLoader';
import TemplateSetPreview from './TemplateSetPreview';

export default function TemplateGallery({ onChange }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllTemplates().then(setTemplates).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-glint-text-tertiary">Loading…</p>;

  return (
    <div className="space-y-2.5">
      {templates.map((t, i) => (
        <button
          key={t.id}
          onClick={() => onChange(t)}
          aria-label={`Template ${i + 1}`}
          className="group w-full rounded-xl overflow-hidden border border-glint-border hover:border-glint-border-strong hover:shadow-md transition-all"
        >
          <div className="aspect-[5/1.2] relative">
            <TemplateSetPreview template={t} compact />
          </div>
        </button>
      ))}
    </div>
  );
}
