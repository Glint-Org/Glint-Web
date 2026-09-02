/**
 * Template brand palette — remap major colors across designs + live canvases.
 */

const HEX_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export function normalizeHex(value) {
  if (!value || typeof value !== 'string') return '';
  const v = value.trim();
  if (!HEX_RE.test(v)) return '';
  if (v.length === 4) {
    const r = v[1];
    const g = v[2];
    const b = v[3];
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return v.toUpperCase();
}

const DEFAULT_LABELS = {
  '#611AB4': 'Primary',
  '#8030DD': 'Secondary',
  '#8A2BE2': 'Accent',
  '#D99BFA': 'Soft fill',
  '#FFFFFF': 'Background',
  '#000000': 'Black',
};

function collectHexFromValue(value, into) {
  const hex = normalizeHex(value);
  if (hex) into.add(hex);
}

function walkLayerColors(layer, into) {
  if (!layer || typeof layer !== 'object') return;
  collectHexFromValue(layer.color, into);
  collectHexFromValue(layer.fill, into);
  if (layer.shadow?.color?.startsWith?.('#')) collectHexFromValue(layer.shadow.color, into);
  if (Array.isArray(layer.layers)) layer.layers.forEach((l) => walkLayerColors(l, into));
}

/** Prefer authored palette; otherwise harvest unique fills from the template. */
export function getTemplatePalette(template) {
  if (!template) return [];
  if (Array.isArray(template.palette) && template.palette.length) {
    return template.palette
      .map((slot, i) => ({
        id: slot.id || `c${i}`,
        label: slot.label || DEFAULT_LABELS[normalizeHex(slot.color)] || `Color ${i + 1}`,
        color: normalizeHex(slot.color) || '#FFFFFF',
      }))
      .filter((s) => s.color);
  }

  const found = new Set();
  walkLayerColors(template, found);
  (template.slides || []).forEach((slide) => walkLayerColors(slide, found));
  (template.layers || []).forEach((l) => walkLayerColors(l, found));

  return [...found]
    .filter((c) => c !== '#000000')
    .sort((a, b) => a.localeCompare(b))
    .map((color, i) => ({
      id: `auto-${i}`,
      label: DEFAULT_LABELS[color] || `Color ${i + 1}`,
      color,
    }));
}

function remapHexString(value, from, to) {
  const hex = normalizeHex(value);
  if (hex && hex === from) return to;
  return value;
}

/** Deep-remap solid hex fills in a design/slide tree (immutable). */
export function remapDesignColors(node, fromColor, toColor) {
  const from = normalizeHex(fromColor);
  const to = normalizeHex(toColor);
  if (!node || !from || !to || from === to) return node;

  if (Array.isArray(node)) {
    return node.map((item) => remapDesignColors(item, from, to));
  }
  if (typeof node !== 'object') return node;

  const out = { ...node };
  for (const [key, value] of Object.entries(node)) {
    if (key === 'color' || key === 'fill') {
      out[key] = remapHexString(value, from, to);
    } else if (key === 'shadow' && value && typeof value === 'object') {
      out.shadow = {
        ...value,
        color: typeof value.color === 'string' && value.color.startsWith('#')
          ? remapHexString(value.color, from, to)
          : value.color,
      };
    } else if (key === 'layers' || key === 'slides' || key === 'palette') {
      out[key] = remapDesignColors(value, from, to);
    } else if (key === 'preview' && value && typeof value === 'object') {
      out.preview = {
        ...value,
        bg: remapHexString(value.bg, from, to),
        textColor: remapHexString(value.textColor, from, to),
        art: Array.isArray(value.art)
          ? value.art.map((a) => ({ ...a, color: remapHexString(a.color, from, to) }))
          : value.art,
      };
    }
  }
  if (Array.isArray(out.palette)) {
    out.palette = out.palette.map((slot) => ({
      ...slot,
      color: remapHexString(slot.color, from, to),
    }));
  }
  return out;
}

function walkFabric(obj, fn) {
  if (!obj) return;
  fn(obj);
  const kids = obj._objects || (typeof obj.getObjects === 'function' ? obj.getObjects() : null);
  if (kids) kids.forEach((child) => walkFabric(child, fn));
}

/** Remap solid fills on a live Fabric canvas (text, shapes, graphics). */
export function remapCanvasColors(canvas, fromColor, toColor) {
  const from = normalizeHex(fromColor);
  const to = normalizeHex(toColor);
  if (!canvas || !from || !to || from === to) return false;

  let changed = false;
  walkFabric(canvas, (node) => {
    if (node.glintRole === 'framed-screenshot' || node.glintRole === 'screenshot') return;
    const fill = normalizeHex(typeof node.fill === 'string' ? node.fill : '');
    if (fill === from) {
      node.set('fill', to);
      changed = true;
    }
    const stroke = normalizeHex(typeof node.stroke === 'string' ? node.stroke : '');
    if (stroke === from) {
      node.set('stroke', to);
      changed = true;
    }
    const shadow = node.shadow;
    if (shadow?.color && typeof shadow.color === 'string' && shadow.color.startsWith('#')) {
      if (normalizeHex(shadow.color) === from) {
        shadow.color = to;
        node.set('shadow', shadow);
        changed = true;
      }
    }
  });

  // Background rect / canvas bg
  const bg = canvas.backgroundColor;
  if (typeof bg === 'string' && normalizeHex(bg) === from) {
    canvas.backgroundColor = to;
    changed = true;
  }

  if (changed) canvas.requestRenderAll?.();
  return changed;
}
