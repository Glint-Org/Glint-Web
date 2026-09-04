import { useState } from 'react';
import { ICONS } from '../utils/graphicsCatalog';

const ICON_INITIAL = 12;

const SHAPES = [
  { id: 'shape-rect', label: 'Rectangle', shape: 'rect' },
  { id: 'shape-square', label: 'Square', shape: 'rect', width: 200, height: 200 },
  { id: 'shape-circle', label: 'Circle', shape: 'circle' },
  { id: 'shape-ellipse', label: 'Ellipse', shape: 'ellipse' },
  { id: 'shape-rounded', label: 'Rounded', shape: 'rect', rx: 40, ry: 40 },
  { id: 'shape-diamond', label: 'Diamond', shape: 'rect', angle: 45 },
];

const SHAPE_ICONS = {
  rect: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <rect x="3" y="5" width="18" height="14" rx="1" />
    </svg>
  ),
  square: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <rect x="4" y="4" width="16" height="16" rx="1" />
    </svg>
  ),
  circle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
  ellipse: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <ellipse cx="12" cy="12" rx="10" ry="6" />
    </svg>
  ),
  rounded: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <rect x="3" y="5" width="18" height="14" rx="5" />
    </svg>
  ),
  diamond: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <rect x="6" y="6" width="12" height="12" rx="1" transform="rotate(45 12 12)" />
    </svg>
  ),
};

function GraphicTile({ item, onInsert }) {
  return (
    <button
      type="button"
      title={item.label}
      onClick={() => onInsert?.(item.src)}
      className="graphic-tile group relative rounded-lg border border-glint-border bg-glint-surface-2 overflow-hidden hover:border-glint-accent hover:ring-1 hover:ring-glint-accent/30 transition-all aspect-square"
    >
      <img
        src={`/graphics/${item.src}`}
        alt={item.label}
        className="absolute inset-0 w-full h-full object-contain p-2 pointer-events-none opacity-95 group-hover:opacity-100"
        draggable={false}
      />
    </button>
  );
}

function ShapeTile({ shape, onInsert }) {
  return (
    <button
      type="button"
      title={shape.label}
      onClick={() => onInsert?.(shape)}
      className="graphic-tile group relative rounded-lg border border-glint-border bg-glint-surface-2 overflow-hidden hover:border-glint-accent hover:ring-1 hover:ring-glint-accent/30 transition-all aspect-square flex items-center justify-center"
    >
      <div className="graphic-tile text-glint-text-secondary group-hover:text-glint-accent transition-colors">
        {SHAPE_ICONS[shape.shape] || SHAPE_ICONS.rect}
      </div>
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

export default function GraphicPicker({ onInsert, onInsertShape }) {
  const [showAllIcons, setShowAllIcons] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredIcons = ICONS.filter((g) =>
    g.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const visibleIcons = showAllIcons ? filteredIcons : filteredIcons.slice(0, ICON_INITIAL);

  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <input
          type="text"
          placeholder="Search icons, brands..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="flex-1 rounded border border-glint-border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-glint-accent/30"
        />
      </div>

      <div className="flex space-x-2 mb-2">
        <button
          type="button"
          onClick={() => setShowAllIcons(false)}
          className={`px-3 py-1 rounded text-[10px] font-medium transition-colors ${!showAllIcons ? 'bg-glint-accent text-white' : 'text-glint-accent/30'}`}
        >
          Icons
        </button>
        <button
          type="button"
          onClick={() => setShowAllIcons(true)}
          className={`px-3 py-1 rounded text-[10px] font-medium transition-colors ${showAllIcons ? 'bg-glint-accent text-white' : 'text-glint-accent/30'}`}
        >
          Brands
        </button>
        <button
          type="button"
          onClick={() => setShowAllIcons(!showAllIcons)}
          className={`px-3 py-1 rounded text-[10px] font-medium transition-colors ${showAllIcons ? 'bg-glint-accent text-white' : 'text-glint-accent/30'}`}
        >
          Shapes
        </button>
      </div>

      {showAllIcons ? (
        <div>
          <p className="text-[10px] font-medium text-glint-text-secondary mb-1.5 uppercase tracking-wider">
            Icons
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {visibleIcons.map((g) => (
              <GraphicTile key={g.id} item={g} onInsert={onInsert} isIcon />
            ))}
          </div>
          {filteredIcons.length > ICON_INITIAL && (
            <ViewAllButton
              expanded={showAllIcons}
              count={filteredIcons.length}
              onToggle={() => setShowAllIcons(!showAllIcons)}
            />
          )}
        </div>
      ) : (
        <div>
          <p className="text-[10px] font-medium text-glint-text-secondary mb-1.5 uppercase tracking-wider">
            Icons
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {visibleIcons.map((g) => (
              <GraphicTile key={g.id} item={g} onInsert={onInsert} isIcon />
            ))}
          </div>
          {filteredIcons.length > ICON_INITIAL && (
            <ViewAllButton
              expanded={showAllIcons}
              count={filteredIcons.length}
              onToggle={() => setShowAllIcons(!showAllIcons)}
            />
          )}
        </div>
      )}

      <div>
        <p className="text-[10px] font-medium text-glint-text-secondary mb-1.5 uppercase tracking-wider">
          Shapes
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {SHAPES.map((s) => (
            <ShapeTile key={s.id} shape={s} onInsert={onInsertShape} />
          ))}
        </div>
      </div>

      <p className="text-[10px] text-glint-text-tertiary">
        Click to insert. Drag freely after. Select to recolor.
      </p>
    </div>
  );
};
