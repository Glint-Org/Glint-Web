import { useEffect, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { GLINT_SHOT_MIME } from '../utils/assetLibrary';

/**
 * All imported screenshots — drag onto a frame or pick "Add to frame N".
 */
export default function AssetLibraryPanel({
  assets = [],
  frameCount = 0,
  onAssign,
  onRemove,
}) {
  const [menuAssetId, setMenuAssetId] = useState(null);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!menuAssetId) return undefined;
    const close = (e) => {
      if (rootRef.current?.contains(e.target)) return;
      setMenuAssetId(null);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [menuAssetId]);

  if (!assets.length) {
    return (
      <div className="space-y-2">
        <h3 className="font-semibold text-glint-text-secondary text-[10px] uppercase tracking-wider">
          Screenshot library
        </h3>
        <p className="text-[11px] text-glint-text-tertiary leading-relaxed">
          Import screenshots above. Click one to add it to a frame, or drag it onto the board.
        </p>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-semibold text-glint-text-secondary text-[10px] uppercase tracking-wider">
          Screenshot library
        </h3>
        <span className="text-[10px] text-glint-text-tertiary tabular-nums">{assets.length}</span>
      </div>
      <p className="text-[10px] text-glint-text-tertiary -mt-1">
        Click → add to frame · drag onto board
      </p>
      <div className="grid grid-cols-3 gap-1.5">
        {assets.map((asset, i) => {
          const menuOpen = menuAssetId === asset.id;
          return (
            <div key={asset.id} className="relative">
              <div
                draggable
                onDragStart={(e) => {
                  setMenuAssetId(null);
                  e.dataTransfer.setData(GLINT_SHOT_MIME, asset.url);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                onClick={() => setMenuAssetId(menuOpen ? null : asset.id)}
                className={`group relative aspect-[9/16] rounded-lg border bg-white overflow-hidden cursor-pointer transition-all ${
                  menuOpen
                    ? 'border-glint-accent ring-2 ring-glint-accent/40'
                    : 'border-glint-border hover:border-glint-accent/60 hover:ring-1 hover:ring-glint-accent/30'
                }`}
                title={asset.name || `Screenshot ${i + 1}`}
              >
                <img
                  src={asset.url}
                  alt=""
                  className="w-full h-full object-cover pointer-events-none"
                  draggable={false}
                />
                <span className="absolute bottom-0 inset-x-0 bg-black/55 text-[9px] text-white text-center py-0.5 tabular-nums pointer-events-none">
                  {i + 1}
                </span>
                <button
                  type="button"
                  title="Remove from library"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuAssetId(null);
                    onRemove?.(asset.id);
                  }}
                  className="absolute top-0.5 right-0.5 p-0.5 rounded bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600/90 transition-opacity"
                >
                  <Trash2 size={10} />
                </button>
              </div>

              {menuOpen && frameCount > 0 ? (
                <div
                  className="absolute left-0 right-0 top-full z-20 mt-1 rounded-lg border border-glint-border bg-glint-surface shadow-xl p-1.5 space-y-1"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-glint-text-tertiary px-1">
                    Add to
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-0.5 hide-scrollbar">
                    {Array.from({ length: frameCount }, (_, fi) => (
                      <button
                        key={fi}
                        type="button"
                        onClick={() => {
                          onAssign?.(fi, asset.url);
                          setMenuAssetId(null);
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-md text-[11px] text-glint-text-secondary hover:bg-glint-accent/15 hover:text-glint-accent transition-colors"
                      >
                        Frame {fi + 1}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
