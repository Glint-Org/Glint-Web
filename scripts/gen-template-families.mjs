/**
 * Generate Glint store template variants from Play-canonical family defs.
 * Run: node scripts/gen-template-families.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../public/templates');

const STORES = {
  play: { store: 'play', canvas: { width: 1080, height: 1920 }, frame: 'pixel9', suffix: 'play' },
  ios: { store: 'ios', canvas: { width: 1290, height: 2796 }, frame: 'iphone16-pro-max', suffix: 'ios' },
  'ios-tablet': {
    store: 'ios-tablet',
    canvas: { width: 2048, height: 2732 },
    frame: 'ipad-pro-13',
    suffix: 'tablet',
  },
};

const X_KEYS = new Set(['left', 'width', 'marginLeft', 'rx']);
const Y_KEYS = new Set(['top', 'height', 'marginTop', 'ry', 'radius']);

function scaleLayer(layer, sx, sy, sf, defaultFrame) {
  if (!layer || typeof layer !== 'object') return layer;
  const out = { ...layer };
  for (const [key, value] of Object.entries(out)) {
    if (typeof value !== 'number') {
      if (key === 'frame' && defaultFrame && (layer.type === 'device' || layer.type === 'device-frame')) {
        out.frame = defaultFrame;
      }
      continue;
    }
    if (key === 'fontSize') out[key] = Math.round(value * sf);
    else if (X_KEYS.has(key)) out[key] = Math.round(value * sx);
    else if (Y_KEYS.has(key)) out[key] = Math.round(value * sy);
  }
  return out;
}

function buildVariant(base, storeKey) {
  const target = STORES[storeKey];
  const sx = target.canvas.width / 1080;
  const sy = target.canvas.height / 1920;
  const sf = (sx + sy) / 2;
  const id = `${base.familyId}-${target.suffix}`;

  return {
    id,
    familyId: base.familyId,
    name: base.name,
    description: `${base.description} (${target.suffix})`,
    store: target.store,
    canvas: { ...target.canvas },
    preview: {
      ...base.preview,
      frame: target.frame,
      ...(storeKey === 'ios-tablet' ? { tablet: true } : {}),
    },
    layers: (base.layers || []).map((l) => scaleLayer(l, sx, sy, sf, target.frame)),
    slides: (base.slides || []).map((slide, i) => ({
      id: `${id}-f${i + 1}`,
      name: slide.name,
      layers: (slide.layers || []).map((l) => scaleLayer(l, sx, sy, sf, target.frame)),
    })),
  };
}

/** Ref: template-refs/phone/04-phone-warm-icons.png - solid warm, soft blob, centered device */
const WARM_GLOW = {
  familyId: 'warm-glow',
  name: 'Warm Glow',
  description: 'Solid warm field, soft blob, glow ring, centered device',
  preview: {
    bg: '#C45C3E',
    textColor: '#FFFFFF',
    frame: 'pixel9',
    art: [
      { kind: 'blob', color: '#F5D0C0', x: '20%', y: '48%', w: '70%', h: '40%' },
      { kind: 'circle', color: '#FFFFFF', x: '62%', y: '12%', w: '18%', h: '10%' },
    ],
    headlines: [
      'Ask anything',
      'Fast accurate answers',
      'Write think explore',
      'Chat that feels natural',
      'Switch modes freely',
    ],
  },
  layers: [{ type: 'background', color: '#C45C3E' }],
  slides: [
    {
      name: 'Hero',
      layers: [
        { type: 'background', color: '#C45C3E' },
        {
          type: 'graphic',
          src: 'spark-mini.svg',
          left: 80,
          top: 160,
          width: 180,
          fill: '#FFFFFF',
          fill2: '#F5D0C0',
          fill3: '#FFE8DC',
        },
        {
          type: 'graphic',
          src: 'spark-mini.svg',
          left: 820,
          top: 280,
          width: 140,
          fill: '#FFE8DC',
          fill2: '#FFFFFF',
          fill3: '#F5D0C0',
          angle: 25,
        },
        {
          type: 'graphic',
          src: 'soft-blob.svg',
          left: 200,
          top: 1100,
          width: 680,
          fill: '#E8A090',
          fill2: '#F5D0C0',
          fill3: '#FFFFFF',
          opacity: 0.55,
          sendToBack: true,
        },
        {
          type: 'headline',
          position: 'center',
          fontSize: 72,
          fontWeight: '800',
          color: '#FFFFFF',
          placeholder: 'Ask anything',
          marginTop: 520,
        },
        {
          type: 'shape',
          shape: 'rect',
          left: 290,
          top: 720,
          width: 500,
          height: 72,
          rx: 36,
          fill: '#FFFFFF',
          opacity: 0.18,
        },
      ],
    },
    {
      name: 'Feature',
      layers: [
        { type: 'background', color: '#C45C3E' },
        {
          type: 'graphic',
          src: 'glow-ring.svg',
          left: 220,
          top: 620,
          width: 640,
          fill: '#FFFFFF',
          fill2: '#F5D0C0',
          fill3: '#E8A090',
          opacity: 0.7,
          sendToBack: true,
        },
        {
          type: 'headline',
          position: 'top',
          fontSize: 52,
          fontWeight: '700',
          color: '#FFFFFF',
          placeholder: 'Fast accurate answers',
          marginTop: 120,
        },
        {
          type: 'device',
          frame: 'pixel9',
          slot: 0,
          scale: 0.58,
          position: 'center',
          marginTop: 420,
          angle: -6,
        },
      ],
    },
    {
      name: 'Device',
      layers: [
        { type: 'background', color: '#B85035' },
        {
          type: 'graphic',
          src: 'soft-blob.svg',
          left: 140,
          top: 780,
          width: 800,
          fill: '#F5D0C0',
          fill2: '#FFFFFF',
          fill3: '#E8A090',
          opacity: 0.5,
          sendToBack: true,
        },
        {
          type: 'headline',
          position: 'top',
          fontSize: 52,
          fontWeight: '700',
          color: '#FFFFFF',
          placeholder: 'Write think explore',
          marginTop: 120,
        },
        {
          type: 'device',
          frame: 'pixel9',
          slot: 1,
          scale: 0.6,
          position: 'center',
          marginTop: 400,
        },
      ],
    },
    {
      name: 'Chat',
      layers: [
        { type: 'background', color: '#C45C3E' },
        {
          type: 'graphic',
          src: 'curve-sweep.svg',
          left: 400,
          top: -20,
          width: 700,
          fill: '#A84830',
          fill2: '#E8A090',
          fill3: '#F5D0C0',
          opacity: 0.45,
          sendToBack: true,
        },
        {
          type: 'graphic',
          src: 'spark-mini.svg',
          left: 40,
          top: 200,
          width: 160,
          fill: '#FFFFFF',
          fill2: '#F5D0C0',
          fill3: '#FFE8DC',
        },
        {
          type: 'headline',
          position: 'top',
          fontSize: 52,
          fontWeight: '700',
          color: '#FFFFFF',
          placeholder: 'Chat that feels natural',
          marginTop: 120,
        },
        {
          type: 'device',
          frame: 'pixel9',
          slot: 2,
          scale: 0.6,
          position: 'center',
          marginTop: 400,
        },
      ],
    },
    {
      name: 'Modes',
      layers: [
        { type: 'background', color: '#A84830' },
        {
          type: 'graphic',
          src: 'wave-cap.svg',
          left: 0,
          top: 1480,
          width: 1080,
          fill: '#C45C3E',
          fill2: '#E8A090',
          fill3: '#F5D0C0',
          sendToBack: true,
        },
        {
          type: 'headline',
          position: 'top',
          fontSize: 52,
          fontWeight: '700',
          color: '#FFFFFF',
          placeholder: 'Switch modes freely',
          marginTop: 120,
        },
        {
          type: 'device',
          frame: 'pixel9',
          slot: 3,
          scale: 0.62,
          position: 'center',
          marginTop: 360,
        },
      ],
    },
  ],
};

/** Ref: template-refs/phone/07-phone-mint-pills.png - headline + pill tags + centered device */
const MINT_TAGS = {
  familyId: 'mint-tags',
  name: 'Mint Tags',
  description: 'Color bands, pill tags, centered device',
  preview: {
    bg: '#0B3D2E',
    textColor: '#FFFFFF',
    frame: 'pixel9',
    art: [
      { kind: 'blob', color: '#B8E0D2', x: '0%', y: '70%', w: '100%', h: '40%' },
      { kind: 'circle', color: '#FFFFFF', x: '10%', y: '28%', w: '28%', h: '6%' },
    ],
    headlines: [
      'Monitor your daily intake',
      'Stay healthy simply',
      'Create healthy routines',
      'Achieve your goals',
      'Improve your habits',
    ],
  },
  layers: [{ type: 'background', color: '#0B3D2E' }],
  slides: [
    {
      name: 'Focus',
      layers: [
        { type: 'background', color: '#0B3D2E' },
        {
          type: 'headline',
          position: 'top',
          fontSize: 54,
          fontWeight: '800',
          color: '#FFFFFF',
          placeholder: 'Monitor your daily intake',
          marginTop: 100,
        },
        { type: 'badge', text: 'Focus', left: 72, top: 320, background: '#FFFFFF', color: '#0B3D2E', fontSize: 22 },
        { type: 'badge', text: 'Goals', left: 250, top: 320, background: '#FFFFFF', color: '#0B3D2E', fontSize: 22 },
        { type: 'badge', text: 'Habits', left: 430, top: 320, background: '#FFFFFF', color: '#0B3D2E', fontSize: 22 },
        {
          type: 'device',
          frame: 'pixel9',
          slot: 0,
          scale: 0.58,
          position: 'center',
          marginTop: 460,
        },
      ],
    },
    {
      name: 'Brand',
      layers: [
        { type: 'background', color: '#145C45' },
        {
          type: 'graphic',
          src: 'curve-sweep.svg',
          left: -40,
          top: 0,
          width: 640,
          fill: '#0B3D2E',
          fill2: '#1A7A5C',
          fill3: '#B8E0D2',
          opacity: 0.5,
          sendToBack: true,
        },
        {
          type: 'headline',
          position: 'top',
          fontSize: 64,
          fontWeight: '800',
          color: '#FFFFFF',
          placeholder: 'Stay healthy simply',
          marginTop: 140,
        },
        {
          type: 'device',
          frame: 'pixel9',
          slot: 1,
          scale: 0.56,
          position: 'center',
          marginTop: 480,
          angle: 8,
        },
      ],
    },
    {
      name: 'Routines',
      layers: [
        { type: 'background', color: '#C8EDE0' },
        {
          type: 'headline',
          position: 'top',
          fontSize: 52,
          fontWeight: '800',
          color: '#0B3D2E',
          placeholder: 'Create healthy routines',
          marginTop: 100,
        },
        { type: 'badge', text: 'Active', left: 72, top: 320, background: '#0B3D2E', color: '#FFFFFF', fontSize: 22 },
        { type: 'badge', text: 'Energy', left: 260, top: 320, background: '#0B3D2E', color: '#FFFFFF', fontSize: 22 },
        { type: 'badge', text: 'Fitness', left: 460, top: 320, background: '#0B3D2E', color: '#FFFFFF', fontSize: 22 },
        {
          type: 'device',
          frame: 'pixel9',
          slot: 2,
          scale: 0.58,
          position: 'center',
          marginTop: 460,
        },
      ],
    },
    {
      name: 'Goals',
      layers: [
        { type: 'background', color: '#A8D9C8' },
        {
          type: 'graphic',
          src: 'soft-blob.svg',
          left: 480,
          top: 1400,
          width: 520,
          fill: '#0B3D2E',
          fill2: '#145C45',
          fill3: '#FFFFFF',
          opacity: 0.2,
          sendToBack: true,
        },
        {
          type: 'headline',
          position: 'top',
          fontSize: 52,
          fontWeight: '800',
          color: '#0B3D2E',
          placeholder: 'Achieve your goals',
          marginTop: 100,
        },
        { type: 'badge', text: 'Train', left: 72, top: 320, background: '#0B3D2E', color: '#FFFFFF', fontSize: 22 },
        { type: 'badge', text: 'Health', left: 250, top: 320, background: '#0B3D2E', color: '#FFFFFF', fontSize: 22 },
        { type: 'badge', text: 'Thrive', left: 450, top: 320, background: '#0B3D2E', color: '#FFFFFF', fontSize: 22 },
        {
          type: 'device',
          frame: 'pixel9',
          slot: 3,
          scale: 0.58,
          position: 'center',
          marginTop: 460,
        },
      ],
    },
    {
      name: 'Habits',
      layers: [
        { type: 'background', color: '#D8F2E8' },
        {
          type: 'graphic',
          src: 'wave-cap.svg',
          left: 0,
          top: 1520,
          width: 1080,
          fill: '#0B3D2E',
          fill2: '#145C45',
          fill3: '#A8D9C8',
          opacity: 0.35,
          sendToBack: true,
        },
        {
          type: 'headline',
          position: 'top',
          fontSize: 52,
          fontWeight: '800',
          color: '#0B3D2E',
          placeholder: 'Improve your habits',
          marginTop: 100,
        },
        { type: 'badge', text: 'Strive', left: 72, top: 320, background: '#0B3D2E', color: '#FFFFFF', fontSize: 22 },
        { type: 'badge', text: 'Evolve', left: 270, top: 320, background: '#0B3D2E', color: '#FFFFFF', fontSize: 22 },
        {
          type: 'device',
          frame: 'pixel9',
          slot: 4,
          scale: 0.58,
          position: 'center',
          marginTop: 460,
        },
      ],
    },
  ],
};

const FAMILIES = [WARM_GLOW, MINT_TAGS];

mkdirSync(OUT, { recursive: true });
const written = [];
for (const family of FAMILIES) {
  for (const storeKey of Object.keys(STORES)) {
    const tpl = buildVariant(family, storeKey);
    const path = join(OUT, `${tpl.id}.json`);
    writeFileSync(path, `${JSON.stringify(tpl, null, 2)}\n`);
    written.push(tpl.id);
  }
}

console.log('Wrote templates:');
written.forEach((id) => console.log(`  ${id}`));
