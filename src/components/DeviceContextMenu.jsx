import { ImagePlus, Trash2 } from 'lucide-react';

/**
 * Right-click menu for a device frame on the canvas.
 */
export default function DeviceContextMenu({
  x,
  y,
  onImport,
  onClear,
  onClose,
}) {
  if (x == null || y == null) return null;

  const menuW = 180;
  const menuH = 80;
  const left = Math.min(x, window.innerWidth - menuW - 8);
  const top = Math.min(y, window.innerHeight - menuH - 8);

  return (
    <>
      <div
        className="fixed inset-0 z-[60]"
        onMouseDown={(e) => { if (e.button === 0) onClose?.(); }}
        onContextMenu={(e) => { e.preventDefault(); onClose?.(); }}
      />
      <div
        className="fixed z-[70] min-w-[160px] rounded-xl border border-glint-border bg-glint-surface shadow-2xl py-1 overflow-hidden"
        style={{ left: Math.max(8, left), top: Math.max(8, top) }}
        role="menu"
      >
        <MenuItem icon={<ImagePlus size={14} />} onClick={onImport}>
          Import screenshot
        </MenuItem>
        <MenuItem icon={<Trash2 size={14} />} onClick={onClear} danger>
          Clear
        </MenuItem>
      </div>
    </>
  );
}

function MenuItem({ children, icon, onClick, danger }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors ${
        danger
          ? 'text-red-500 hover:bg-red-500/10'
          : 'text-glint-text-secondary hover:bg-glint-surface-2 hover:text-glint-text'
      }`}
    >
      <span className="shrink-0 opacity-80">{icon}</span>
      {children}
    </button>
  );
}
