import { useEffect, useState } from 'react';
import {
  loadAllTemplates,
  filterVisibleTemplates,
  browseFilterId,
  getStoreTarget,
} from '../utils/templateLoader';
import TemplateSetPreview from './TemplateSetPreview';
import StoreBrowseFilters from './StoreBrowseFilters';

/**
 * Left sidebar — pick a store template pack (preview only).
 * Platform → device filters set the export size via the pack.
 */
export default function TemplateGallery({ onChange, activeStore }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState('all');
  const [device, setDevice] = useState('all');

  useEffect(() => {
    loadAllTemplates({ enabledOnly: true }).then(setTemplates).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeStore) return;
    const target = getStoreTarget(activeStore);
    setPlatform(target.platform);
    setDevice(target.id);
  }, [activeStore]);

  const filtered = filterVisibleTemplates(templates, browseFilterId(platform, device));

  if (loading) {
    return <p className="text-sm text-glint-text-tertiary">Loading templates…</p>;
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] text-glint-text-tertiary leading-relaxed">
        Pick a platform, then a device size. Export uses that canvas.
      </p>
      <StoreBrowseFilters
        platform={platform}
        device={device}
        onPlatformChange={setPlatform}
        onDeviceChange={setDevice}
        size="sm"
      />
      {filtered.length === 0 ? (
        <p className="text-xs text-glint-text-tertiary py-4 text-center">
          No templates for this size yet.
        </p>
      ) : (
        <div className="space-y-2 overflow-hidden">
          {filtered.map((t) => (
            <button
              key={t.id}
              type="button"
              data-template-id={t.id}
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
