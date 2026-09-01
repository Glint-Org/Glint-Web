import { useCallback, useRef, useState } from 'react';
import { Image } from 'lucide-react';
import { ingestScreenshotFiles } from '../utils/screenshotStore';

/**
 * Drop / pick screenshots. Shows per-file % while reading into temp local storage.
 * onUpload(ingested: { id, url, name }[]) after ingest completes.
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
      onUpload?.(ingested);
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
    <div className="space-y-3">
      <div
        onDrop={busy ? undefined : handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={busy ? undefined : () => inputRef.current?.click()}
        className={`group border border-dashed rounded-2xl text-center transition-all duration-300 bg-glint-surface/60 ${
          busy ? 'opacity-70 cursor-wait border-glint-accent/40' : 'cursor-pointer border-glint-border-strong hover:border-glint-accent/60 hover:bg-glint-accent/5'
        } ${compact ? 'p-5' : 'p-8'}`}
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
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-glint-accent/20 bg-glint-accent/10 text-glint-accent shadow-sm shadow-glint-accent/10">
          <Image size={compact ? 20 : 22} />
        </div>
        <p className={`font-semibold text-glint-text ${compact ? 'text-xs' : 'text-base'}`}>
          {busy ? 'Saving…' : 'Drop screenshots here'}
        </p>
        {!busy && !compact && (
          <p className="mt-1 text-sm text-glint-text-secondary">or click to browse</p>
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
              <div className="h-1.5 rounded-full bg-glint-border overflow-hidden">
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
