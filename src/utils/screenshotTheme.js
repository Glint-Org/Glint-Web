/**
 * Sample dominant colors from screenshots and map them onto template palette slots.
 */

import { normalizeHex } from './templatePalette';

const SKIP_TOP = 0.1;
const SKIP_BOTTOM = 0.12;
const SKIP_SIDE = 0.08;

const DEFAULT_SLOTS = ['primary', 'secondary', 'accent', 'soft', 'background'];

function rgbToHex(r, g, b) {
  const h = (n) => n.toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase();
}

function parseKey(key) {
  const [r, g, b] = key.split(',').map(Number);
  return { r, g, b, hex: rgbToHex(r, g, b) };
}

export function saturation(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === 0) return 0;
  return (max - min) / max;
}

export function luminance(r, g, b) {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** RGB 0–255 → hue degrees 0–360 (0 for neutrals). */
export function rgbToHue(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  if (d < 0.01) return -1;
  let h;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return Math.round(((h * 60) + 360) % 360);
}

export function hueDistance(a, b) {
  if (a < 0 || b < 0) return 180;
  const d = Math.abs(a - b);
  return Math.min(d, 360 - d);
}

/** Skip near-white, near-black, and low-saturation grays (for accent sampling). */
export function isNeutralRgb(r, g, b) {
  if (r > 248 && g > 248 && b > 248) return true;
  if (r < 20 && g < 20 && b < 20) return true;
  if (saturation(r, g, b) < 0.14 && luminance(r, g, b) > 0.12 && luminance(r, g, b) < 0.9) return true;
  return false;
}

export function bucketKey(r, g, b, bits = 4) {
  const shift = 8 - bits;
  const q = (v) => (v >> shift) << shift;
  return `${q(r)},${q(g)},${q(b)}`;
}

export function mergeColorCounts(lists) {
  const merged = new Map();
  for (const list of lists) {
    if (!list) continue;
    for (const [key, count] of list) {
      merged.set(key, (merged.get(key) || 0) + count);
    }
  }
  return merged;
}

/** Mix two hex colors; t=0 → a, t=1 → b. */
export function mixHex(a, b, t) {
  const parse = (hex) => {
    const h = normalizeHex(hex).slice(1);
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  };
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  const lerp = (x, y) => Math.round(x + (y - x) * t);
  return rgbToHex(lerp(r1, r2), lerp(g1, g2), lerp(b1, b2));
}

function countsToEntries(counts, { accentsOnly }) {
  return [...counts.entries()]
    .map(([key, weight]) => {
      const { r, g, b, hex } = parseKey(key);
      const sat = saturation(r, g, b);
      const lum = luminance(r, g, b);
      const hue = rgbToHue(r, g, b);
      if (accentsOnly && isNeutralRgb(r, g, b)) return null;
      const score = weight * (accentsOnly ? 0.35 + sat * 0.65 : 0.5 + lum * 0.5);
      return { r, g, b, hex, weight, sat, lum, hue, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);
}

function pickDistinct(entries, used, minHue = 22) {
  for (const entry of entries) {
    if (used.some((u) => u.hex === entry.hex)) continue;
    if (used.length && entry.hue >= 0 && used.every((u) => u.hue >= 0 && hueDistance(u.hue, entry.hue) < minHue)) {
      continue;
    }
    return entry;
  }
  return null;
}

function pickBackground(neutralEntries) {
  const light = neutralEntries
    .filter((e) => e.lum >= 0.78)
    .sort((a, b) => b.weight - a.weight);
  if (light.length) return light[0].hex;
  const any = [...neutralEntries].sort((a, b) => b.weight - a.weight);
  if (any.length && any[0].lum >= 0.55) return any[0].hex;
  return '#FFFFFF';
}

/** Build semantic theme colors from accent + neutral histograms. */
export function buildThemeFromCounts(accentCounts, neutralCounts, slotIds = DEFAULT_SLOTS) {
  const accents = countsToEntries(accentCounts, { accentsOnly: true });
  const neutrals = countsToEntries(neutralCounts, { accentsOnly: false });

  const primary = pickDistinct(accents, [], 0)?.hex || accents[0]?.hex || '#611AB4';
  const pRgb = parseKey(
    [...accentCounts.keys()].find((k) => parseKey(k).hex === primary) || '97,26,180',
  );
  const primaryEntry = accents.find((e) => e.hex === primary) || {
    hex: primary,
    hue: rgbToHue(pRgb.r, pRgb.g, pRgb.b),
  };
  const used = [primaryEntry];

  let secondary = pickDistinct(accents, used, 22)?.hex;
  if (secondary) used.push(accents.find((e) => e.hex === secondary));

  let accent = pickDistinct(accents, used, 18)?.hex;
  if (!secondary) secondary = mixHex(primary, '#000000', 0.22);
  if (!accent) accent = mixHex(primary, '#FFFFFF', 0.28);

  const soft = mixHex(primary, '#FFFFFF', 0.58);
  const background = pickBackground(neutrals);

  const theme = { primary, secondary, accent, soft, background };
  const out = {};
  for (const id of slotIds) {
    out[id] = theme[id] || theme.primary;
  }
  return out;
}

/** @deprecated Use buildThemeFromCounts — kept for tests. */
export function pickThemeColors(counts, maxColors = 5) {
  const theme = buildThemeFromCounts(counts, counts, DEFAULT_SLOTS.slice(0, maxColors));
  return DEFAULT_SLOTS.slice(0, maxColors).map((id) => theme[id]);
}

/** Map extracted theme onto template palette by slot id. */
export function buildPaletteRemap(templatePalette, themeColors) {
  if (!templatePalette?.length || !themeColors) return [];

  const lookup = Array.isArray(themeColors)
    ? Object.fromEntries(
        templatePalette.map((slot, i) => [slot.id || `c${i}`, normalizeHex(themeColors[i])]),
      )
    : themeColors;

  const pairs = [];
  for (const slot of templatePalette) {
    const from = normalizeHex(slot.color);
    const to = normalizeHex(lookup[slot.id]);
    if (from && to && from !== to) pairs.push([from, to]);
  }
  return pairs;
}

function sampleWeight(x, y, width, height) {
  const cx = width / 2;
  const cy = height / 2;
  const nx = (x - cx) / cx;
  const ny = (y - cy) / cy;
  const dist = Math.sqrt(nx * nx + ny * ny);
  return Math.max(0.15, 1 - dist * 0.85);
}

function inContentRegion(x, y, width, height) {
  const left = width * SKIP_SIDE;
  const right = width * (1 - SKIP_SIDE);
  const top = height * SKIP_TOP;
  const bottom = height * (1 - SKIP_BOTTOM);
  return x >= left && x <= right && y >= top && y <= bottom;
}

function sampleCanvasPixels(ctx, width, height) {
  const data = ctx.getImageData(0, 0, width, height).data;
  const accentCounts = new Map();
  const neutralCounts = new Map();
  const step = Math.max(1, Math.floor(Math.min(width, height) / 64));

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      if (!inContentRegion(x, y, width, height)) continue;
      const i = (y * width + x) * 4;
      const a = data[i + 3];
      if (a < 140) continue;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const w = sampleWeight(x, y, width, height);
      const key = bucketKey(r, g, b);
      const bucket = Math.max(1, Math.round(w * 10));
      neutralCounts.set(key, (neutralCounts.get(key) || 0) + bucket);
      if (!isNeutralRgb(r, g, b)) {
        accentCounts.set(key, (accentCounts.get(key) || 0) + bucket);
      }
    }
  }
  return { accentCounts, neutralCounts };
}

/** Sample one image URL (browser only). */
export function sampleImageColors(url, maxSide = 200) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, w, h);
        resolve(sampleCanvasPixels(ctx, w, h));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

/** Aggregate theme from screenshot URLs; returns slot-id → hex map. */
export async function extractThemeFromUrls(urls, templatePalette = null) {
  const slotIds = templatePalette?.map((s) => s.id) || DEFAULT_SLOTS;
  const samples = await Promise.all(
    urls.filter(Boolean).map((url) => sampleImageColors(url).catch(() => null)),
  );
  const valid = samples.filter(Boolean);
  if (!valid.length) return {};

  const accentCounts = mergeColorCounts(valid.map((s) => s.accentCounts));
  const neutralCounts = mergeColorCounts(valid.map((s) => s.neutralCounts));
  return buildThemeFromCounts(accentCounts, neutralCounts, slotIds);
}
