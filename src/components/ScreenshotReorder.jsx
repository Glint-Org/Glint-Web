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
      <h3 className="font-semibold text-gray-700">Screenshot Order</h3>
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {screenshots.map((url, i) => (
          <div key={url} className="flex items-center gap-2 text-sm">
            <img src={url} alt={`Screen ${i + 1}`} className="w-10 h-16 object-cover rounded border" />
            <span className="flex-1 text-gray-600">Screen {i + 1}</span>
            <button
              onClick={() => move(i, -1)}
              disabled={i === 0}
              className="px-2 py-1 border rounded disabled:opacity-30"
            >
              ↑
            </button>
            <button
              onClick={() => move(i, 1)}
              disabled={i === screenshots.length - 1}
              className="px-2 py-1 border rounded disabled:opacity-30"
            >
              ↓
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
