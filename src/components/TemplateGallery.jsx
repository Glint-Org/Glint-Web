import { useEffect, useState } from 'react';
import { loadAllTemplates } from '../utils/templateLoader';

export default function TemplateGallery({ selected, onChange }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllTemplates()
      .then(setTemplates)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-sm text-gray-400">Loading templates...</p>;
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-gray-700">Viral Templates</h3>
      <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t)}
            className={`text-left px-3 py-2 rounded-lg border transition-all ${
              selected?.id === t.id
                ? 'border-purple-500 ring-2 ring-purple-200 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-sm text-gray-900">{t.name}</div>
            <div className="text-xs text-gray-500">{t.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
