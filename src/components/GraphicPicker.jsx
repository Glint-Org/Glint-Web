import { useState } from 'react';
import { GRAPHICS, ICONS } from '../utils/graphicsCatalog';

const ICON_INITIAL = 12;
const DECOR_INITIAL = 4;

function GraphicTile({ item, onInsert, isIcon, themeColor }) {
  return (
    <button
      type="button"
      title={isIcon ? `${item.label} — ${item.use}` : item.label}
      onClick={() => onInsert?.(item.src, themeColor)}
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

/**
 * Visual graphic picker — preview tiles instead of name-only dropdown.
 * Shows icons and decorative graphics in separate sections with "View All" toggles.
 * Icons default to template theme color (not hardcoded red).
 */
export default function GraphicPicker({ onInsert, themeColor }) {
  const [showAllIcons, setShowAllIcons] = useState(false);
  const [showAllDecor, setShowAllDecor] = useState(false);

  const visibleIcons = showAllIcons ? ICONS : ICONS.slice(0, ICON_INITIAL);
  const visibleDecor = showAllDecor ? GRAPHICS : GRAPHICS.slice(0, DECOR_INITIAL);
  const hiddenDecorCount = GRAPHICS.length - DECOR_INITIAL;

  return (
    <div className="space-y-3">
      {/* Icons section */}
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

      {/* Decorative graphics section */}
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
