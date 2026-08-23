import { ChevronUp, ChevronDown } from 'lucide-react';

export default function ScreenshotReorder({ screenshots, onReorder }) {
  if (screenshots.length < 2) return null;

  const move = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= screenshots.length) return;
    const next = [...screenshots];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    onReorder(next);
  };

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-glint-text-secondary">Screenshot Order</h3>
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {screenshots.map((url, i) => (
          <div key={url} className="flex items-center gap-2 text-sm">
            <img src={url} alt={`Screen ${i + 1}`} className="w-10 h-16 object-cover rounded border border-glint-border" />
            <span className="flex-1 text-glint-text-secondary">Screen {i + 1}</span>
            <button
              onClick={() => move(i, -1)}
              disabled={i === 0}
              className="p-1 border border-glint-border rounded disabled:opacity-30 hover:bg-glint-surface-2 text-glint-text-secondary"
            >
              <ChevronUp size={14} />
            </button>
            <button
              onClick={() => move(i, 1)}
              disabled={i === screenshots.length - 1}
              className="p-1 border border-glint-border rounded disabled:opacity-30 hover:bg-glint-surface-2 text-glint-text-secondary"
            >
              <ChevronDown size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
