import { useEffect, useState } from 'react';
import { Type, Trash2, AlignLeft, AlignCenter, AlignRight, Bold, Square } from 'lucide-react';
import ColorPicker from './ColorPicker';
import FontPicker from './FontPicker';
import ThemeSelector from './ThemeSelector';
import FrameSelector from './FrameSelector';
import { DEFAULT_SCREENSHOT_STYLE } from '../utils/frameMeta';
import { GRAPHICS } from '../utils/graphicsCatalog';
import { addGraphicLayer, recolorGraphic } from '../utils/graphicLayers';

const FONT_SIZES = [24, 32, 40, 48, 56, 64, 72, 80, 96, 120];
const WEIGHTS = [
  { value: '400', label: 'Regular' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semi' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Extra' },
];

function Section({ title, children }) {
  return (
    <section className="space-y-2.5">
      <h3 className="text-[10px] font-semibold text-glint-text-secondary uppercase tracking-wider">{title}</h3>
      {children}
    </section>
  );
}

function ColorField({ label, value, onChange }) {
  return <ColorPicker label={label} value={value} onChange={onChange} />;
}

/**
 * Right sidebar - Figma-style design properties only.
 * Left sidebar owns templates, assets, export.
 */
export default function PropertiesPanel({
  canvas,
  background,
  onBackgroundChange,
  frame,
  onFrameChange,
  screenshotStyle,
  onScreenshotStyleChange,
  fontFamily,
  onFontFamilyChange,
  onAddText,
  onDelete,
  templateActive = false,
}) {
  const [selection, setSelection] = useState(null);
  const [textProps, setTextProps] = useState({
    text: '',
    fontSize: 48,
    fill: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'Inter',
    textAlign: 'center',
  });

  useEffect(() => {
    if (!canvas) return;

    const sync = () => {
      const obj = canvas.getActiveObject();
      if (!obj) {
        setSelection(null);
        return;
      }
      const role = obj.glintRole;
      const isText = role === 'text' || obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'text';
      setSelection({ type: isText ? 'text' : role || obj.type, obj });
      if (isText) {
        setTextProps({
          text: obj.text || '',
          fontSize: Math.round(obj.fontSize || 48),
          fill: typeof obj.fill === 'string' ? obj.fill : '#FFFFFF',
          fontWeight: String(obj.fontWeight || '400'),
          fontFamily: (obj.fontFamily || 'Inter').replace(/,.*/, '').replace(/"/g, '').trim() || 'Inter',
          textAlign: obj.textAlign || 'center',
        });
      }
    };

    canvas.on('selection:created', sync);
    canvas.on('selection:updated', sync);
    canvas.on('selection:cleared', () => setSelection(null));
    canvas.on('object:modified', sync);

    return () => {
      canvas.off('selection:created', sync);
      canvas.off('selection:updated', sync);
      canvas.off('selection:cleared');
      canvas.off('object:modified', sync);
    };
  }, [canvas]);

  const applyToSelection = (patch) => {
    if (!canvas || !selection?.obj) return;
    const obj = selection.obj;
    obj.set(patch);
    if (patch.fontFamily) obj.set('fontFamily', `${patch.fontFamily}, sans-serif`);
    obj.setCoords();
    canvas.requestRenderAll();
    setTextProps((p) => ({ ...p, ...patch }));
  };

  const isText = selection?.type === 'text';
  const isGraphic = selection?.obj?.glintRole === 'graphic' || selection?.type === 'graphic';
  const graphicFills = selection?.obj?.glintFills || { a: '#FF6B4A', b: '#FFD166', c: '#FFFFFF' };
  const style = { ...DEFAULT_SCREENSHOT_STYLE, ...screenshotStyle };
  const showScreenshotStyle = !frame && !templateActive;

  const handleInsertGraphic = async (src) => {
    if (!canvas) return;
    await addGraphicLayer(canvas, {
      src,
      fill: '#FF6B4A',
      fill2: '#FFD166',
      fill3: '#FFFFFF',
      width: canvas.getWidth?.() || 1080,
    }, { selectable: true });
  };

  const handleGraphicFill = (slot, color) => {
    if (!canvas || !selection?.obj) return;
    recolorGraphic(selection.obj, { [slot]: color });
    canvas.requestRenderAll();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2.5 border-b border-glint-border shrink-0">
        <h2 className="text-[11px] font-semibold text-glint-text uppercase tracking-wider">Design</h2>
        <p className="text-[10px] text-glint-text-tertiary mt-0.5">
          {isText ? 'Text layer' : isGraphic ? 'Graphic' : selection ? 'Layer selected' : 'Canvas'}
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-5">
        {/* Actions - always visible */}
        <Section title="Insert">
          <div className="flex gap-1.5">
            <button
              onClick={onAddText}
              className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg bg-glint-accent text-glint-text-on-accent text-xs font-semibold hover:bg-glint-accent-hover"
            >
              <Type size={14} /> Text
            </button>
            <button
              onClick={onDelete}
              disabled={!selection}
              className="px-2.5 py-2 rounded-lg border border-glint-border text-glint-text-secondary hover:text-glint-danger hover:bg-glint-surface-2 disabled:opacity-40"
              title="Delete selected (Del)"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </Section>

        <Section title="Graphics">
          <select
            defaultValue=""
            onChange={(e) => {
              const src = e.target.value;
              if (src) handleInsertGraphic(src);
              e.target.value = '';
            }}
            className="w-full px-2 py-1.5 border border-glint-border rounded-lg text-xs bg-glint-surface text-glint-text"
          >
            <option value="" disabled>Insert graphic…</option>
            {GRAPHICS.map((g) => (
              <option key={g.id} value={g.src}>{g.label}</option>
            ))}
          </select>
          <p className="text-[10px] text-glint-text-tertiary">Select a graphic on the canvas to recolor it.</p>
        </Section>

        {isGraphic && (
          <Section title="Graphic colors">
            <ColorField label="Fill A" value={graphicFills.a || '#FF6B4A'} onChange={(v) => handleGraphicFill('a', v)} />
            <ColorField label="Fill B" value={graphicFills.b || '#FFD166'} onChange={(v) => handleGraphicFill('b', v)} />
            <ColorField label="Fill C" value={graphicFills.c || '#FFFFFF'} onChange={(v) => handleGraphicFill('c', v)} />
            <label className="space-y-1 block">
              <span className="text-[10px] text-glint-text-tertiary">Opacity</span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round((selection.obj.opacity ?? 1) * 100)}
                onChange={(e) => {
                  selection.obj.set('opacity', Number(e.target.value) / 100);
                  canvas.requestRenderAll();
                }}
                className="w-full accent-glint-accent"
              />
            </label>
            <p className="text-[10px] text-glint-text-tertiary">Drag on canvas to move or scale.</p>
          </Section>
        )}

        {/* Text - when text layer selected */}
        {isText && (
          <Section title="Typography">
            <textarea
              value={textProps.text}
              onChange={(e) => applyToSelection({ text: e.target.value })}
              rows={3}
              placeholder="Headline or caption"
              className="w-full px-2.5 py-2 border border-glint-border rounded-lg text-xs bg-glint-surface text-glint-text resize-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <span className="text-[10px] text-glint-text-tertiary">Size</span>
                <select
                  value={textProps.fontSize}
                  onChange={(e) => applyToSelection({ fontSize: Number(e.target.value) })}
                  className="w-full px-2 py-1.5 border border-glint-border rounded-lg text-xs bg-glint-surface text-glint-text"
                >
                  {!FONT_SIZES.includes(textProps.fontSize) && (
                    <option value={textProps.fontSize}>{textProps.fontSize}</option>
                  )}
                  {FONT_SIZES.map((s) => (
                    <option key={s} value={s}>{s}px</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-[10px] text-glint-text-tertiary">Weight</span>
                <select
                  value={textProps.fontWeight}
                  onChange={(e) => applyToSelection({ fontWeight: e.target.value })}
                  className="w-full px-2 py-1.5 border border-glint-border rounded-lg text-xs bg-glint-surface text-glint-text"
                >
                  {WEIGHTS.map((w) => (
                    <option key={w.value} value={w.value}>{w.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <ColorField
              label="Fill"
              value={textProps.fill}
              onChange={(v) => applyToSelection({ fill: v })}
            />
            <div className="flex gap-1">
              {[
                { id: 'left', Icon: AlignLeft },
                { id: 'center', Icon: AlignCenter },
                { id: 'right', Icon: AlignRight },
              ].map(({ id, Icon }) => (
                <button
                  key={id}
                  onClick={() => applyToSelection({
                    textAlign: id,
                    originX: id === 'left' ? 'left' : id === 'right' ? 'right' : 'center',
                  })}
                  className={`flex-1 flex justify-center py-1.5 rounded-lg border transition-colors ${
                    textProps.textAlign === id
                      ? 'border-glint-accent bg-glint-accent-muted text-glint-accent'
                      : 'border-glint-border text-glint-text-secondary hover:bg-glint-surface-2'
                  }`}
                >
                  <Icon size={14} />
                </button>
              ))}
              <button
                onClick={() => applyToSelection({
                  fontWeight: textProps.fontWeight === '700' || textProps.fontWeight === 'bold' ? '400' : '700',
                })}
                className={`flex-1 flex justify-center py-1.5 rounded-lg border transition-colors ${
                  textProps.fontWeight === '700' || textProps.fontWeight === 'bold'
                    ? 'border-glint-accent bg-glint-accent-muted text-glint-accent'
                    : 'border-glint-border text-glint-text-secondary hover:bg-glint-surface-2'
                }`}
              >
                <Bold size={14} />
              </button>
            </div>
            <FontPicker
              compact
              selected={textProps.fontFamily}
              onChange={(name) => {
                onFontFamilyChange?.(name);
                applyToSelection({ fontFamily: name });
              }}
            />
          </Section>
        )}

        {/* Default font when nothing text-selected */}
        {!isText && (
          <Section title="Default font">
            <FontPicker compact selected={fontFamily} onChange={onFontFamilyChange} />
            <p className="text-[10px] text-glint-text-tertiary">Used when you add new text layers.</p>
          </Section>
        )}

        {/* Canvas background */}
        <Section title="Canvas">
          <ThemeSelector selected={background} onChange={onBackgroundChange} />
        </Section>

        {/* Device frame */}
        {!templateActive && (
        <Section title="Device">
          <FrameSelector selected={frame} onChange={onFrameChange} compact />
          {frame && (
            <p className="text-[10px] text-glint-text-tertiary">
              Screenshot fills the screen area exactly - no gaps.
            </p>
          )}
        </Section>
        )}

        {/* Screenshot styling - only when no device frame */}
        {showScreenshotStyle && (
          <Section title="Screenshot">
            <div className="flex items-center gap-2 text-glint-text-secondary text-[10px] mb-1">
              <Square size={12} />
              <span>No device frame - style the raw screenshot</span>
            </div>
            <label className="space-y-1 block">
              <span className="text-[10px] text-glint-text-tertiary">Corner radius</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={80}
                  value={style.cornerRadius ?? style.cornerRadius ?? 0}
                  onChange={(e) => onScreenshotStyleChange?.({ cornerRadius: Number(e.target.value), cornerRadius: Number(e.target.value) })}
                  className="flex-1 accent-glint-accent"
                />
                <span className="text-[11px] tabular-nums w-8 text-glint-text-secondary">{style.cornerRadius ?? style.cornerRadius ?? 0}</span>
              </div>
            </label>
            <label className="space-y-1 block">
              <span className="text-[10px] text-glint-text-tertiary">Border width</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={12}
                  value={style.strokeWidth}
                  onChange={(e) => onScreenshotStyleChange?.({ strokeWidth: Number(e.target.value) })}
                  className="flex-1 accent-glint-accent"
                />
                <span className="text-[11px] tabular-nums w-8 text-glint-text-secondary">{style.strokeWidth}px</span>
              </div>
            </label>
            {style.strokeWidth > 0 && (
              <ColorField
                label="Border color"
                value={style.strokeColor}
                onChange={(v) => onScreenshotStyleChange?.({ strokeColor: v })}
              />
            )}
          </Section>
        )}
      </div>
    </div>
  );
}
