/**
 * Scale a Play-canonical template (1080x1920) to iOS phone or iPad store sizes.
 * X metrics use width ratio; Y metrics use height ratio; font uses avg.
 */

const STORES = {
  play: {
    store: 'play',
    canvas: { width: 1080, height: 1920 },
    frame: 'pixel9',
  },
  ios: {
    store: 'ios',
    canvas: { width: 1290, height: 2796 },
    frame: 'iphone16-pro-max',
  },
  'ios-tablet': {
    store: 'ios-tablet',
    canvas: { width: 2048, height: 2732 },
    frame: 'ipad-pro-13',
  },
};

const X_KEYS = new Set(['left', 'width', 'marginLeft', 'rx']);
const Y_KEYS = new Set(['top', 'height', 'marginTop', 'ry', 'radius']);
const FONT_KEYS = new Set(['fontSize']);

function scaleValue(key, value, sx, sy, sf) {
  if (typeof value !== 'number') return value;
  if (FONT_KEYS.has(key)) return Math.round(value * sf);
  if (X_KEYS.has(key)) return Math.round(value * sx);
  if (Y_KEYS.has(key)) return Math.round(value * sy);
  return value;
}

function scaleLayer(layer, sx, sy, sf, defaultFrame) {
  if (!layer || typeof layer !== 'object') return layer;
  const out = { ...layer };
  for (const [key, value] of Object.entries(out)) {
    if (key === 'layers' && Array.isArray(value)) {
      out.layers = value.map((l) => scaleLayer(l, sx, sy, sf, defaultFrame));
      continue;
    }
    if (key === 'frame' && defaultFrame && (layer.type === 'device' || layer.type === 'device-frame')) {
      out.frame = defaultFrame;
      continue;
    }
    out[key] = scaleValue(key, value, sx, sy, sf);
  }
  return out;
}

function scaleArt(art, sx, sy) {
  if (!Array.isArray(art)) return art;
  return art.map((item) => {
    // preview.art uses % strings — leave as-is
    if (typeof item?.x === 'string') return { ...item };
    return {
      ...item,
      x: typeof item.x === 'number' ? Math.round(item.x * sx) : item.x,
      y: typeof item.y === 'number' ? Math.round(item.y * sy) : item.y,
      w: typeof item.w === 'number' ? Math.round(item.w * sx) : item.w,
      h: typeof item.h === 'number' ? Math.round(item.h * sy) : item.h,
    };
  });
}

/**
 * @param {object} base - Play template with slides[]
 * @param {'play'|'ios'|'ios-tablet'} storeKey
 */
export function buildStoreVariant(base, storeKey) {
  const target = STORES[storeKey];
  if (!target) throw new Error(`Unknown store: ${storeKey}`);

  const baseW = base.canvas?.width || 1080;
  const baseH = base.canvas?.height || 1920;
  const sx = target.canvas.width / baseW;
  const sy = target.canvas.height / baseH;
  const sf = (sx + sy) / 2;

  const idSuffix = storeKey === 'ios-tablet' ? 'tablet' : storeKey;
  const id = base.familyId ? `${base.familyId}-${idSuffix}` : `${base.id}-${idSuffix}`;

  const slides = (base.slides || []).map((slide, i) => ({
    id: `${id}-f${i + 1}`,
    name: slide.name || `Frame ${i + 1}`,
    layers: (slide.layers || []).map((l) => scaleLayer(l, sx, sy, sf, target.frame)),
    preview: slide.preview || null,
  }));

  const layers = (base.layers || []).map((l) => scaleLayer(l, sx, sy, sf, target.frame));

  return {
    id,
    familyId: base.familyId || base.id,
    name: base.name,
    description: base.description,
    store: target.store,
    canvas: { ...target.canvas },
    preview: {
      ...(base.preview || {}),
      frame: target.frame,
      tablet: storeKey === 'ios-tablet' || undefined,
      art: scaleArt(base.preview?.art, sx, sy),
    },
    layers,
    slides,
  };
}

export function buildAllStoreVariants(base) {
  return ['play', 'ios', 'ios-tablet'].map((key) => buildStoreVariant(base, key));
}

export { STORES };
