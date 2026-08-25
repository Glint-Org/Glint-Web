/**
 * Pixel-matched Blink templates from Figma SVG measurements (1080x2400).
 * Run: node scripts/gen-blink.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../public/templates');

const TARGETS = {
  play: {
    store: 'play',
    canvas: { width: 1080, height: 2400 },
    frame: 'simple-dark',
    suffix: 'play',
    lockFrame: true,
  },
  ios: {
    store: 'ios',
    canvas: { width: 1290, height: 2796 },
    frame: 'iphone16-pro-max',
    suffix: 'ios',
    lockFrame: false,
  },
  'ios-tablet': {
    store: 'ios-tablet',
    canvas: { width: 2048, height: 2732 },
    frame: 'ipad-pro-13',
    suffix: 'tablet',
    lockFrame: false,
  },
};

const X_KEYS = new Set(['left', 'width', 'marginLeft', 'rx']);
const Y_KEYS = new Set(['top', 'height', 'marginTop', 'ry', 'radius']);

function scaleLayer(layer, sx, sy, sf, defaultFrame, lockFrame) {
  if (!layer || typeof layer !== 'object') return layer;
  const out = { ...layer };
  for (const [key, value] of Object.entries(out)) {
    if (typeof value !== 'number') {
      if (
        key === 'frame' &&
        defaultFrame &&
        !lockFrame &&
        (layer.type === 'device' || layer.type === 'device-frame')
      ) {
        out.frame = defaultFrame;
      }
      continue;
    }
    if (key === 'fontSize') out[key] = Math.round(value * sf);
    else if (key === 'angle' || key === 'scale' || key === 'opacity' || key === 'minCoverage') {
      /* keep */
    } else if (X_KEYS.has(key)) out[key] = Math.round(value * sx * 10) / 10;
    else if (Y_KEYS.has(key)) out[key] = Math.round(value * sy * 10) / 10;
  }
  return out;
}

/** Exact coords from template-refs/own/blink-android.svg */
const BLINK = {
  familyId: 'blink',
  name: 'Blink',
  description: 'Pixel-matched Blink Android store set from your Figma',
  canvas: { width: 1080, height: 2400 },
  preview: {
    bg: '#611AB4',
    textColor: '#FFFFFF',
    frame: 'simple-dark',
    art: [
      { kind: 'blob', color: '#D99BFA', x: '55%', y: '-5%', w: '60%', h: '35%' },
      { kind: 'circle', color: '#8030DD', x: '-10%', y: '70%', w: '40%', h: '25%' },
    ],
    headlines: [
      'BLINK',
      '100% Free',
      'Select & Share Instantly',
      'Scan & Download',
      'Download Securely',
    ],
  },
  layers: [{ type: 'background', color: '#FFFFFF' }],
  slides: [
    {
      name: 'Hero',
      layers: [
        { type: 'background', color: '#FFFFFF' },
        {
          type: 'headline',
          position: 'top',
          fontSize: 96,
          fontWeight: '800',
          color: '#611AB4',
          placeholder: 'BLINK',
          marginTop: 180,
        },
        {
          type: 'subheadline',
          position: 'top',
          fontSize: 36,
          fontWeight: '600',
          color: '#8030DD',
          placeholder: 'Share Files in a Flash',
          marginTop: 300,
        },
        {
          type: 'device',
          frame: 'simple-dark',
          slot: 0,
          scale: 0.903,
          minCoverage: 0.85,
          marginLeft: 52.5,
          marginTop: 822.5,
        },
      ],
    },
    {
      name: 'Free',
      layers: [
        { type: 'background', color: '#FFFFFF' },
        {
          type: 'device',
          frame: 'simple-dark',
          slot: 1,
          scale: 0.903,
          minCoverage: 0.85,
          marginLeft: 52.5,
          marginTop: 190.5,
        },
        {
          type: 'shape',
          shape: 'rect',
          left: -178.73,
          top: 1948.75,
          width: 1399.02,
          height: 844.931,
          fill: '#611AB4',
          angle: -16.7853,
        },
        {
          type: 'headline',
          position: 'left',
          fontSize: 72,
          fontWeight: '800',
          color: '#FFFFFF',
          placeholder: '100% Free',
          marginLeft: 145,
          marginTop: 1980,
        },
        {
          type: 'subheadline',
          position: 'left',
          fontSize: 40,
          fontWeight: '700',
          color: '#FFFFFF',
          placeholder: 'No Login. No Tracking',
          marginLeft: 145,
          marginTop: 2085,
        },
      ],
    },
    {
      name: 'Share',
      layers: [
        { type: 'background', color: '#FFFFFF' },
        {
          type: 'headline',
          position: 'top',
          fontSize: 52,
          fontWeight: '800',
          color: '#8A2BE2',
          placeholder: 'Select & Share Instantly',
          marginTop: 160,
        },
        {
          type: 'device',
          frame: 'simple-dark',
          slot: 2,
          scale: 0.903,
          minCoverage: 0.85,
          marginLeft: 52.5,
          marginTop: 507.5,
        },
      ],
    },
    {
      name: 'Scan',
      layers: [
        { type: 'background', color: '#D99BFA' },
        {
          type: 'headline',
          position: 'top',
          fontSize: 56,
          fontWeight: '800',
          color: '#FFFFFF',
          placeholder: 'Scan & Download',
          marginTop: 160,
        },
        {
          type: 'device',
          frame: 'simple-dark',
          slot: 3,
          scale: 0.903,
          minCoverage: 0.85,
          marginLeft: 52.5,
          marginTop: 499.5,
        },
      ],
    },
    {
      name: 'Secure',
      layers: [
        { type: 'background', color: '#611AB4' },
        {
          type: 'headline',
          position: 'top',
          fontSize: 56,
          fontWeight: '800',
          color: '#FFFFFF',
          placeholder: 'Download Securely',
          marginTop: 140,
        },
        {
          type: 'device',
          frame: 'simple-dark',
          slot: 4,
          scale: 0.903,
          minCoverage: 0.85,
          marginLeft: 52.5,
          marginTop: 587.5,
        },
      ],
    },
  ],
};

function buildVariant(storeKey) {
  const target = TARGETS[storeKey];
  const sx = target.canvas.width / BLINK.canvas.width;
  const sy = target.canvas.height / BLINK.canvas.height;
  const sf = (sx + sy) / 2;
  const id = `blink-${target.suffix}`;

  return {
    id,
    familyId: 'blink',
    name: 'Blink',
    description: `${BLINK.description} (${target.suffix})`,
    store: target.store,
    canvas: { ...target.canvas },
    preview: {
      ...BLINK.preview,
      frame: target.lockFrame ? 'simple-dark' : target.frame,
      ...(storeKey === 'ios-tablet' ? { tablet: true } : {}),
    },
    layers: BLINK.layers.map((l) =>
      scaleLayer(l, sx, sy, sf, target.frame, target.lockFrame),
    ),
    slides: BLINK.slides.map((slide, i) => ({
      id: `${id}-f${i + 1}`,
      name: slide.name,
      layers: slide.layers.map((l) =>
        scaleLayer(l, sx, sy, sf, target.frame, target.lockFrame),
      ),
    })),
  };
}

mkdirSync(OUT, { recursive: true });
for (const key of Object.keys(TARGETS)) {
  const tpl = buildVariant(key);
  writeFileSync(join(OUT, `${tpl.id}.json`), `${JSON.stringify(tpl, null, 2)}\n`);
  console.log('wrote', tpl.id, tpl.canvas);
}
