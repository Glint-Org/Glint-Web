import { useEffect, useState } from 'react';
import { GRAPHICS, ICONS } from '../utils/graphicsCatalog';

const ICON_INITIAL = 12;
const DECOR_INITIAL = 4;

const SVG_CACHE = new Map();

function useThemedSvg(src, themeColor) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!src || !themeColor) { setUrl(null); return; }
    const cacheKey = `${src}::${themeColor}`;
    if (SVG_CACHE.has(cacheKey)) { setUrl(SVG_CACHE.get(cacheKey)); return; }
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/graphics/${src}`);
        if (!res.ok) return;
        let svg = await res.text();
        svg = svg.replace(/#A10000/gi, themeColor);
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const blobUrl = URL.createObjectURL(blob);
        if (alive) {
          SVG_CACHE.set(cacheKey, blobUrl);
          setUrl(blobUrl);
        }
      } catch { /* silent */ }
    })();
    return () => { alive = false; };
  }, [src, themeColor]);

  return url;
}

function GraphicTile({ item, onInsert, isIcon, themeColor }) {
  const themedSrc = useThemedSvg(item.src, isIcon ? themeColor : null);
  return (
    <button
      type="button"
      title={item.label}
      onClick={() => onInsert?.(item.src, themeColor)}
      className={`group relative rounded-lg border border-glint-border bg-glint-surface-2 overflow-hidden hover:border-glint-accent hover:ring-1 hover:ring-glint-accent/30 transition-all ${isIcon ? 'aspect-square' : 'aspect-[3/4]'}`}
    >
      <img
        src={themedSrc || `/graphics/${item.src}`}
        alt={item.label}
        className="absolute inset-0 w-full h-full object-contain p-2 pointer-events-none opacity-95 group-hover:opacity-100"
        draggable={false}
      />
    </button>
  );
}

function ViewAllButton({ expanded, count, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full py-1.5 text-[10px] font-medium text-glint-accent hover:text-glint-accent/80 transition-colors"
    >
      {expanded ? 'Show less' : `View all (${count})`}
    </button>
  );
}

export default function GraphicPicker({ onInsert, themeColor }) {
  const [showAllIcons, setShowAllIcons] = useState(false);
  const [showAllDecor, setShowAllDecor] = useState(false);

  const visibleIcons = showAllIcons ? ICONS : ICONS.slice(0, ICON_INITIAL);
  const visibleDecor = showAllDecor ? GRAPHICS : GRAPHICS.slice(0, DECOR_INITIAL);
  const hiddenDecorCount = GRAPHICS.length - DECOR_INITIAL;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[10px] font-medium text-glint-text-secondary mb-1.5 uppercase tracking-wider">
          Icons
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {visibleIcons.map((g) => (
            <GraphicTile key={g.id} item={g} onInsert={onInsert} isIcon themeColor={themeColor} />
          ))}
        </div>
        {ICONS.length > ICON_INITIAL && (
          <ViewAllButton
            expanded={showAllIcons}
            count={ICONS.length}
            onToggle={() => setShowAllIcons(!showAllIcons)}
          />
        )}
      </div>

      {GRAPHICS.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-glint-text-secondary mb-1.5 uppercase tracking-wider">
            Decorative
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {visibleDecor.map((g) => (
              <GraphicTile key={g.id} item={g} onInsert={onInsert} themeColor={themeColor} />
            ))}
          </div>
          {hiddenDecorCount > 0 && (
            <ViewAllButton
              expanded={showAllDecor}
              count={GRAPHICS.length}
              onToggle={() => setShowAllDecor(!showAllDecor)}
            />
          )}
        </div>
      )}

      <p className="text-[10px] text-glint-text-tertiary">
        Click to insert. Drag freely after. Select to recolor.
      </p>
    </div>
  );
}
