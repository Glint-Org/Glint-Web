/**
 * Theme from app screenshots → template palette slots.
 *
 * App UIs are mostly neutrals (chrome, cards, photos). “Most pixels” is the wrong
 * signal - we want the brand accent (CTA / logo / header tint), then build a
 * coherent harmony for secondary / accent / soft so remaps don’t turn templates
 * into a random multi-hue mess.
 */

import { normalizeHex } from './templatePalette';

/** Crop system chrome / home-indicator bands. */
const SKIP_TOP = 0.12;
const SKIP_BOTTOM = 0.14;
const SKIP_SIDE = 0.06;

const DEFAULT_SLOTS = ['primary', 'secondary', 'accent', 'soft', 'background'];
const HUE_BIN = 24;

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

/** RGB 0-255 → hue degrees 0-360 (−1 for near-neutrals). */
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

/** Skip near-white, near-black, and low-chroma greys. */
export function isNeutralRgb(r, g, b) {
  if (r > 245 && g > 245 && b > 245) return true;
  if (r < 18 && g < 18 && b < 18) return true;
  const sat = saturation(r, g, b);
  const lum = luminance(r, g, b);
  if (sat < 0.16 && lum > 0.1 && lum < 0.92) return true;
  return false;
}

/**
 * How “brand-like” a color is for store graphics.
 * Area still matters, but sublinearly - a purple CTA beats a huge washed tile.
 */
export function brandScore({ sat, lum, weight }) {
  const satScore = Math.pow(Math.max(0, sat), 1.35);
  // Peak around mid-dark brand fills (Material / iOS brand buttons).
  const lumScore = Math.max(0.12, 1 - Math.abs(lum - 0.42) * 1.55);
  const areaScore = Math.pow(Math.max(1, weight), 0.3);
  return satScore * lumScore * areaScore;
}

export function bucketKey(r, g, b, bits = 5) {
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

function rgbToHsl(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return { h, s, l };
}

function hslToRgb(h, s, l) {
  if (s <= 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const hue2rgb = (p, q, t) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

/** Nudge saturation up for cleaner brand fills (keeps hue + luminance). */
export function punchSaturation(hex, amount = 0.12) {
  const raw = normalizeHex(hex).slice(1);
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  const hsl = rgbToHsl(r, g, b);
  if (hsl.s < 0.04) return rgbToHex(r, g, b);
  hsl.s = Math.min(1, hsl.s + amount * (1 - hsl.s));
  const [nr, ng, nb] = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(nr, ng, nb);
}

function countsToEntries(counts, { accentsOnly }) {
  return [...counts.entries()]
    .map(([key, weight]) => {
      const { r, g, b, hex } = parseKey(key);
      const sat = saturation(r, g, b);
      const lum = luminance(r, g, b);
      const hue = rgbToHue(r, g, b);
      if (accentsOnly && isNeutralRgb(r, g, b)) return null;
      if (accentsOnly && sat < 0.18) return null;
      const score = brandScore({ sat, lum, weight });
      return { r, g, b, hex, weight, sat, lum, hue, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);
}

/** Group accent entries into hue families; return clusters sorted by brand strength. */
export function clusterAccentsByHue(entries, binDeg = HUE_BIN) {
  const bins = new Map();
  for (const e of entries) {
    if (e.hue < 0) continue;
    const bin = (Math.round(e.hue / binDeg) * binDeg) % 360;
    const cur = bins.get(bin) || { hue: bin, entries: [], weight: 0, score: 0 };
    cur.entries.push(e);
    cur.weight += e.weight;
    cur.score += e.score;
    bins.set(bin, cur);
  }
  return [...bins.values()].sort((a, b) => b.score - a.score);
}

/** Best hex inside a hue cluster - vivid representative, not the muddiest average. */
export function pickClusterRepresentative(cluster) {
  if (!cluster?.entries?.length) return null;
  const ranked = [...cluster.entries].sort((a, b) => {
    const qa = a.sat * (1 - Math.abs(a.lum - 0.42)) * Math.pow(a.weight, 0.25);
    const qb = b.sat * (1 - Math.abs(b.lum - 0.42)) * Math.pow(b.weight, 0.25);
    return qb - qa;
  });
  return ranked[0];
}

function pickBackground(neutralEntries) {
  if (!neutralEntries.length) return '#FFFFFF';
  const total = neutralEntries.reduce((s, e) => s + e.weight, 0) || 1;
  const meanLum = neutralEntries.reduce((s, e) => s + e.lum * e.weight, 0) / total;

  if (meanLum >= 0.55) {
    const light = neutralEntries
      .filter((e) => e.lum >= 0.82 && e.sat < 0.12)
      .sort((a, b) => b.weight - a.weight);
    if (light.length) return light[0].hex;
    return '#FFFFFF';
  }

  const dark = neutralEntries
    .filter((e) => e.lum <= 0.22 && e.sat < 0.15)
    .sort((a, b) => b.weight - a.weight);
  if (dark.length) return dark[0].hex;
  return '#121212';
}

/**
 * Build a cohesive slot palette around one brand primary.
 * Secondary / accent / soft are harmony tints - not random 2nd/3rd histogram peaks
 * (those are often chart greens / error reds and wreck template remaps).
 */
export function buildHarmonyFromPrimary(primaryHex, backgroundHex) {
  const primary = punchSaturation(primaryHex, 0.1);
  const bg = backgroundHex || '#FFFFFF';
  const bgLum = (() => {
    const h = normalizeHex(bg).slice(1);
    return luminance(
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    );
  })();

  const secondary = mixHex(primary, '#000000', bgLum > 0.5 ? 0.2 : 0.12);
  const accent = mixHex(primary, '#FFFFFF', bgLum > 0.5 ? 0.22 : 0.3);
  const soft = mixHex(primary, bgLum > 0.5 ? '#FFFFFF' : bg, 0.62);

  return { primary, secondary, accent, soft, background: bg };
}

/** Build semantic theme colors from accent + neutral histograms. */
export function buildThemeFromCounts(accentCounts, neutralCounts, slotIds = DEFAULT_SLOTS) {
  const accents = countsToEntries(accentCounts, { accentsOnly: true });
  const neutrals = countsToEntries(neutralCounts, { accentsOnly: false });
  const background = pickBackground(neutrals);

  const clusters = clusterAccentsByHue(accents);
  const best = clusters[0] ? pickClusterRepresentative(clusters[0]) : accents[0];
  const primaryHex = best?.hex || '#611AB4';

  const harmony = buildHarmonyFromPrimary(primaryHex, background);

  // Optional: if a second hue cluster is nearly as strong and clearly chromatic,
  // use it as accent (co-brand). Keep secondary as a shade of primary.
  const runnerUp = clusters[1];
  if (
    runnerUp
    && clusters[0]
    && runnerUp.score >= clusters[0].score * 0.55
    && hueDistance(clusters[0].hue, runnerUp.hue) >= 36
  ) {
    const second = pickClusterRepresentative(runnerUp);
    if (second && second.sat >= 0.28) {
      harmony.accent = punchSaturation(second.hex, 0.08);
    }
  }

  const out = {};
  for (const id of slotIds) {
    out[id] = harmony[id] || harmony.primary;
  }
  return out;
}

/** @deprecated Use buildThemeFromCounts - kept for tests. */
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
  // Prefer upper-middle (headers / logos / primary CTAs) over edges and photo bottoms.
  const cx = width / 2;
  const cy = height * 0.38;
  const nx = (x - cx) / (width * 0.55);
  const ny = (y - cy) / (height * 0.55);
  const dist = Math.sqrt(nx * nx + ny * ny);
  return Math.max(0.2, 1.15 - dist * 0.95);
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
  const step = Math.max(1, Math.floor(Math.min(width, height) / 80));

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      if (!inContentRegion(x, y, width, height)) continue;
      const i = (y * width + x) * 4;
      const a = data[i + 3];
      if (a < 160) continue;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const w = sampleWeight(x, y, width, height);
      const key = bucketKey(r, g, b);
      const bucket = Math.max(1, Math.round(w * 12));
      neutralCounts.set(key, (neutralCounts.get(key) || 0) + bucket);
      if (!isNeutralRgb(r, g, b)) {
        accentCounts.set(key, (accentCounts.get(key) || 0) + bucket);
      }
    }
  }
  return { accentCounts, neutralCounts };
}

/** Sample one image URL (browser only). */
export function sampleImageColors(url, maxSide = 256) {
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
