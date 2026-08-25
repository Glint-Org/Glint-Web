import { GRAPHICS } from '../utils/graphicsCatalog';

/**
 * Visual graphic picker — preview tiles instead of name-only dropdown.
 */
export default function GraphicPicker({ onInsert }) {
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-2 gap-1.5">
        {GRAPHICS.map((g) => (
          <button
            key={g.id}
            type="button"
            title={g.label}
            onClick={() => onInsert?.(g.src)}
            className="group relative aspect-[3/4] rounded-lg border border-glint-border bg-glint-surface-2 overflow-hidden hover:border-glint-accent hover:ring-1 hover:ring-glint-accent/30 transition-all"
          >
            <img
              src={`/graphics/${g.src}`}
              alt={g.label}
              className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none opacity-95 group-hover:opacity-100"
              draggable={false}
            />
            <span className="absolute inset-x-0 bottom-0 px-1 py-0.5 text-[9px] font-medium text-center text-white bg-black/45 truncate">
              {g.label}
            </span>
          </button>
        ))}
      </div>
      <p className="text-[10px] text-glint-text-tertiary">
        Click to insert at a default spot. Drag freely after. Select to recolor.
      </p>
    </div>
  );
}
