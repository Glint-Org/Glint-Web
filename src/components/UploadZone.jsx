import { useCallback, useRef, useState } from 'react';
import { Image } from 'lucide-react';
import { ingestScreenshotFiles } from '../utils/screenshotStore';

/**
 * Drop / pick screenshots. Shows per-file % while reading into temp local storage.
 * onUpload(urls: string[]) after ingest completes.
 */
export default function UploadZone({ onUpload, compact = false }) {
  const inputRef = useRef(null);
  const [items, setItems] = useState([]); // { name, pct }[]

  const runIngest = useCallback(async (files) => {
    if (!files.length) return;
    setItems(files.map((f) => ({ name: f.name, pct: 0 })));
    try {
      const ingested = await ingestScreenshotFiles(files, (index, pct) => {
        setItems((prev) => prev.map((it, i) => (i === index ? { ...it, pct } : it)));
      });
      onUpload?.(ingested.map((x) => x.url));
    } finally {
      // brief beat so 100% is visible
      setTimeout(() => setItems([]), 400);
    }
  }, [onUpload]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith('image/'),
    );
    runIngest(files);
  }, [runIngest]);

  const handleChange = (e) => {
    const files = Array.from(e.target.files || []);
    runIngest(files);
    e.target.value = '';
  };

  const busy = items.length > 0;

  return (
    <div className="space-y-2">
      <div
        onDrop={busy ? undefined : handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={busy ? undefined : () => inputRef.current?.click()}
        className={`border-2 border-dashed border-glint-border-strong rounded-xl text-center transition-colors bg-glint-surface-2 ${
          busy ? 'opacity-70 cursor-wait' : 'cursor-pointer hover:border-glint-accent'
        } ${compact ? 'p-4' : 'p-12'}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleChange}
          className="hidden"
          disabled={busy}
        />
        <Image size={compact ? 22 : 32} className="mx-auto mb-2 text-glint-text-tertiary" />
        <p className={`text-glint-text-secondary font-medium ${compact ? 'text-xs' : ''}`}>
          {busy ? 'Saving…' : 'Drop screenshots here'}
        </p>
        {!busy && !compact && (
          <p className="text-glint-text-tertiary mt-1 text-sm">or click to browse</p>
        )}
      </div>

      {items.length > 0 && (
        <ul className="space-y-1.5">
          {items.map((it) => (
            <li key={it.name} className="space-y-0.5">
              <div className="flex justify-between gap-2 text-[10px] text-glint-text-secondary">
                <span className="truncate">{it.name}</span>
                <span className="tabular-nums shrink-0">{it.pct}%</span>
              </div>
              <div className="h-1 rounded-full bg-glint-border overflow-hidden">
                <div
                  className="h-full bg-glint-accent transition-[width] duration-100"
                  style={{ width: `${it.pct}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
