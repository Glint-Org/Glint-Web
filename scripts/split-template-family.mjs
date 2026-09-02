/**
 * Split flat family templates into blink-style folders:
 *   public/templates/{family}/common.json
 *   public/templates/{family}/{play|ios|tablet|ipad}.json
 *
 * Usage: node scripts/split-template-family.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, unlinkSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../public/templates');

const LAYOUT_KEYS = new Set([
  'fontSize',
  'marginTop',
  'marginLeft',
  'marginBottom',
  'left',
  'top',
  'width',
  'height',
  'scale',
  'widthFraction',
  'angle',
  'frame',
  'rx',
  'ry',
  'radius',
  'minCoverage',
]);

/** Families: gallery id suffix → platform file name */
const FAMILIES = [
  {
    family: 'glint-gold',
    variants: [
      { id: 'glint-gold-play', file: 'play' },
      { id: 'glint-gold-ios', file: 'ios' },
      { id: 'glint-gold-ipad', file: 'ipad' },
    ],
  },
  {
    family: 'warm-glow',
    variants: [
      { id: 'warm-glow-play', file: 'play' },
      { id: 'warm-glow-ios', file: 'ios' },
      { id: 'warm-glow-tablet', file: 'tablet' },
    ],
  },
  {
    family: 'mint-tags',
    variants: [
      { id: 'mint-tags-play', file: 'play' },
      { id: 'mint-tags-ios', file: 'ios' },
      { id: 'mint-tags-tablet', file: 'tablet' },
    ],
  },
];

function loadFlat(id) {
  const path = join(ROOT, `${id}.json`);
  if (!existsSync(path)) throw new Error(`missing ${path}`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

function assignRoles(slides) {
  return slides.map((slide) => {
    const counts = {};
    const layers = (slide.layers || []).map((layer) => {
      const t = layer.type || 'layer';
      counts[t] = (counts[t] || 0) + 1;
      let role;
      if (t === 'background') role = 'bg';
      else if (t === 'headline') role = counts[t] === 1 ? 'title' : `title${counts[t]}`;
      else if (t === 'subheadline') role = counts[t] === 1 ? 'tagline' : `tagline${counts[t]}`;
      else if (t === 'device') role = counts[t] === 1 ? 'device' : `device${counts[t]}`;
      else if (t === 'shape') role = counts[t] === 1 ? 'banner' : `shape${counts[t]}`;
      else if (t === 'badge') role = `badge${counts[t]}`;
      else if (t === 'graphic') role = `graphic${counts[t]}`;
      else role = `${t}${counts[t]}`;
      return { ...layer, role };
    });
    return { ...slide, layers };
  });
}

function pickLayout(layer) {
  const out = {};
  for (const key of LAYOUT_KEYS) {
    if (layer[key] !== undefined) out[key] = layer[key];
  }
  return out;
}

function stripLayout(layer) {
  const out = { ...layer };
  for (const key of LAYOUT_KEYS) delete out[key];
  delete out.id;
  return out;
}

function collectPalette(tpl) {
  const colors = new Set();
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    for (const [k, v] of Object.entries(node)) {
      if ((k === 'color' || k === 'fill' || k === 'fill2' || k === 'fill3' || k === 'background' || k === 'bg' || k === 'textColor') && typeof v === 'string' && /^#[0-9A-Fa-f]{6}$/.test(v)) {
        colors.add(v.toUpperCase());
      } else walk(v);
    }
  };
  walk(tpl);
  const preferred = [];
  const rest = [];
  for (const c of colors) {
    if (c === '#FFFFFF' || c === '#000000') rest.push(c);
    else preferred.push(c);
  }
  preferred.sort();
  rest.sort();
  const ordered = [...preferred, ...rest].slice(0, 8);
  const labels = {
    '#FFFFFF': 'Background',
    '#000000': 'Black',
    '#0B0D10': 'Surface',
    '#151A21': 'Surface 2',
    '#F5D06F': 'Gold',
    '#C45C3E': 'Warm',
    '#0B3D2E': 'Mint',
  };
  return ordered.map((color, i) => ({
    id: i === ordered.length - 1 && color === '#FFFFFF' ? 'background' : `c${i}`,
    label: labels[color] || `Color ${i + 1}`,
    color,
  }));
}

function inferDevice(tpl) {
  const devices = [];
  for (const slide of tpl.slides || []) {
    for (const layer of slide.layers || []) {
      if (layer.type === 'device') devices.push(layer);
    }
  }
  if (!devices.length) return {};
  const frame = devices[0].frame;
  const scale = devices.every((d) => d.scale === devices[0].scale) ? devices[0].scale : undefined;
  const widthFraction = devices.every((d) => d.widthFraction === devices[0].widthFraction)
    ? devices[0].widthFraction
    : undefined;
  const position = devices.every((d) => d.position === devices[0].position) ? devices[0].position : undefined;
  const minCoverage = devices.every((d) => d.minCoverage === devices[0].minCoverage)
    ? devices[0].minCoverage
    : undefined;
  const out = {};
  if (frame) out.frame = frame;
  if (scale != null) out.scale = scale;
  if (widthFraction != null) out.widthFraction = widthFraction;
  if (position) out.position = position;
  if (minCoverage != null) out.minCoverage = minCoverage;
  return out;
}

function buildLayout(tpl) {
  const layout = {};
  for (const slide of tpl.slides || []) {
    const slideLayout = {};
    for (const layer of slide.layers || []) {
      const patch = pickLayout(layer);
      // If device defaults cover frame/scale, still keep marginTop etc.
      if (Object.keys(patch).length) slideLayout[layer.role] = patch;
    }
    if (Object.keys(slideLayout).length) layout[slide.name] = slideLayout;
  }
  return layout;
}

function splitFamily({ family, variants }) {
  const packs = variants.map((v) => {
    const raw = loadFlat(v.id);
    return { ...v, tpl: { ...raw, slides: assignRoles(raw.slides || []) } };
  });

  const base = packs.find((p) => p.file === 'play') || packs[0];
  const baseTpl = base.tpl;

  const commonSlides = (baseTpl.slides || []).map((slide) => ({
    name: slide.name,
    layers: (slide.layers || []).map(stripLayout),
  }));

  const preview = { ...(baseTpl.preview || {}) };
  delete preview.frame;
  delete preview.tablet;

  const common = {
    familyId: baseTpl.familyId || family,
    name: baseTpl.name,
    description: (baseTpl.description || '').replace(/\s*\((play|ios|tablet|ipad)\)\s*$/i, '').replace(/\s+for Google Play$/i, '').trim(),
    palette: collectPalette(baseTpl),
    style: {
      fontFamily: findCommonFont(baseTpl) || undefined,
    },
    device: {
      position: inferDevice(baseTpl).position,
      minCoverage: inferDevice(baseTpl).minCoverage,
    },
    preview,
    layers: baseTpl.layers || [{ type: 'background', color: '#FFFFFF' }],
    slides: commonSlides,
  };
  // clean undefined style/device
  if (!common.style.fontFamily) delete common.style;
  if (!common.device.position && common.device.minCoverage == null) delete common.device;

  const outDir = join(ROOT, family);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'common.json'), `${JSON.stringify(common, null, 2)}\n`);

  for (const pack of packs) {
    const device = inferDevice(pack.tpl);
    // Device defaults applied at merge — strip frame/scale from per-layer layout if uniform
    const layout = buildLayout(pack.tpl);
    if (device.frame || device.scale != null || device.widthFraction != null) {
      for (const slideName of Object.keys(layout)) {
        for (const role of Object.keys(layout[slideName])) {
          const patch = layout[slideName][role];
          if (device.frame && patch.frame === device.frame) delete patch.frame;
          if (device.scale != null && patch.scale === device.scale) delete patch.scale;
          if (device.widthFraction != null && patch.widthFraction === device.widthFraction) {
            delete patch.widthFraction;
          }
          if (device.position && patch.position === device.position) delete patch.position;
          if (device.minCoverage != null && patch.minCoverage === device.minCoverage) {
            delete patch.minCoverage;
          }
          if (!Object.keys(patch).length) delete layout[slideName][role];
        }
      }
    }

    const platform = {
      id: pack.id,
      extends: 'common',
      description: pack.tpl.description || `${common.name} — ${pack.file}`,
      store: pack.tpl.store,
      canvas: pack.tpl.canvas,
      device,
      preview: {
        ...(pack.tpl.preview?.frame ? { frame: pack.tpl.preview.frame } : {}),
        ...(pack.tpl.preview?.tablet ? { tablet: true } : {}),
      },
      layout,
    };
    if (!Object.keys(platform.preview).length) delete platform.preview;

    writeFileSync(join(outDir, `${pack.file}.json`), `${JSON.stringify(platform, null, 2)}\n`);
    console.log('wrote', family, pack.file);
  }

  for (const pack of packs) {
    const flat = join(ROOT, `${pack.id}.json`);
    if (existsSync(flat)) {
      unlinkSync(flat);
      console.log('removed', pack.id + '.json');
    }
  }
}

function findCommonFont(tpl) {
  const fonts = new Set();
  for (const slide of tpl.slides || []) {
    for (const layer of slide.layers || []) {
      if (layer.fontFamily) fonts.add(layer.fontFamily);
    }
  }
  return fonts.size === 1 ? [...fonts][0] : fonts.size > 1 ? [...fonts][0] : null;
}

for (const fam of FAMILIES) splitFamily(fam);
console.log('done');
