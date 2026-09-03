import { GRAPHICS, ICONS } from '../utils/graphicsCatalog';

function GraphicTile({ item, onInsert, isIcon }) {
  return (
    <button
      type="button"
      title={isIcon ? `${item.label} — ${item.use}` : item.label}
      onClick={() => onInsert?.(item.src)}
      className={`group relative rounded-lg border border-glint-border bg-glint-surface-2 overflow-hidden hover:border-glint-accent hover:ring-1 hover:ring-glint-accent/30 transition-all ${isIcon ? 'aspect-square' : 'aspect-[3/4]'}`}
    >
      <img
        src={`/graphics/${item.src}`}
        alt={item.label}
        className="absolute inset-0 w-full h-full object-contain p-2 pointer-events-none opacity-95 group-hover:opacity-100"
        draggable={false}
      />
      <span className="absolute inset-x-0 bottom-0 px-1 py-0.5 text-[9px] font-medium text-center text-white bg-black/45 truncate">
        {item.label}
      </span>
    </button>
  );
}

/**
 * Visual graphic picker — preview tiles instead of name-only dropdown.
 * Shows decorative graphics and functional icons in separate sections.
 */
export default function GraphicPicker({ onInsert }) {
  return (
    <div className="space-y-3">
      {/* Icons section */}
      <div>
        <p className="text-[10px] font-medium text-glint-text-secondary mb-1.5 uppercase tracking-wider">
          Icons
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {ICONS.map((g) => (
            <GraphicTile key={g.id} item={g} onInsert={onInsert} isIcon />
          ))}
        </div>
      </div>

      {/* Decorative graphics section */}
      <div>
        <p className="text-[10px] font-medium text-glint-text-secondary mb-1.5 uppercase tracking-wider">
          Decorative
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {GRAPHICS.map((g) => (
            <GraphicTile key={g.id} item={g} onInsert={onInsert} />
          ))}
        </div>
      </div>

      <p className="text-[10px] text-glint-text-tertiary">
        Click to insert. Drag freely after. Select to recolor with a/b/c slots.
      </p>
    </div>
  );
}
