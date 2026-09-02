/**
 * DEPRECATED — Blink lives in public/templates/blink/{common,play,ios,tablet}.json.
 * Do not regenerate flat blink-*.json from this script.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../public/templates');

const TARGETS = {
  play: {
    store: 'play/phone',
    canvas: { width: 1080, height: 1920 },
    frame: 'pixel9',
    suffix: 'play',
    lockFrame: true,
  },
  ios: {
    store: 'ios/iphone',
    canvas: { width: 1290, height: 2796 },
    frame: 'iphone16-pro-max',
    suffix: 'ios',
    lockFrame: false,
  },
  'ios-tablet': {
    store: 'ios/ipad',
    canvas: { width: 2048, height: 2732 },
    frame: 'ipad-pro-13',
    suffix: 'tablet',
    lockFrame: false,
  },
};

const X_KEYS = new Set(['left', 'width', 'marginLeft', 'rx']);
const Y_KEYS = new Set(['top', 'height', 'marginTop', 'ry', 'radius']);
const FONT = 'Montserrat';
/** Match Play Pixel width (~896/1080) across iPhone/iPad so devices aren't over-wide. */
const DEVICE_WIDTH_FRACTION = 0.83;

const BLINK_PALETTE = [
  { id: 'primary', label: 'Primary', color: '#611AB4' },
  { id: 'secondary', label: 'Secondary', color: '#8030DD' },
  { id: 'accent', label: 'Accent', color: '#8A2BE2' },
  { id: 'soft', label: 'Soft fill', color: '#D99BFA' },
  { id: 'surface', label: 'Surface', color: '#FFFFFF' },
];

function scaleShadow(shadow, sx, sy, sf) {
  if (!shadow || typeof shadow !== 'object') return shadow;
  return {
    ...shadow,
    blur: shadow.blur != null ? Math.round(shadow.blur * sf) : shadow.blur,
    offsetX: shadow.offsetX != null ? Math.round(shadow.offsetX * sx) : shadow.offsetX,
    offsetY: shadow.offsetY != null ? Math.round(shadow.offsetY * sy) : shadow.offsetY,
  };
}

function scaleLayer(layer, sx, sy, sf, defaultFrame, lockFrame) {
  if (!layer || typeof layer !== 'object') return layer;
  const out = { ...layer };
  for (const [key, value] of Object.entries(out)) {
    if (key === 'shadow') {
      out.shadow = scaleShadow(value, sx, sy, sf);
      continue;
    }
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
    else if (
      key === 'angle' ||
      key === 'scale' ||
      key === 'widthFraction' ||
      key === 'opacity' ||
      key === 'minCoverage' ||
      key === 'charSpacing' ||
      key === 'lineHeight'
    ) {
      /* keep */
    } else if (X_KEYS.has(key)) out[key] = Math.round(value * sx * 10) / 10;
    else if (Y_KEYS.has(key)) out[key] = Math.round(value * sy * 10) / 10;
  }
  return out;
}

const TEXT_SHADOW = { color: 'rgba(0,0,0,0.25)', blur: 5, offsetX: 10, offsetY: 10 };
const TEXT_SHADOW_HEAVY = { color: 'rgba(0,0,0,0.25)', blur: 10, offsetX: 20, offsetY: 20 };

/** Exact geometry from blink-android.svg panels (local 1080×2400). */
const BLINK = {
  familyId: 'blink',
  name: 'Blink',
  description: 'Pixel-matched Blink Android store set from your Figma',
  canvas: { width: 1080, height: 2400 },
  preview: {
    bg: '#611AB4',
    textColor: '#FFFFFF',
    frame: 'pixel9',
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
  palette: BLINK_PALETTE,
  layers: [{ type: 'background', color: '#FFFFFF' }],
  slides: [
    {
      name: 'Hero',
      layers: [
        { type: 'background', color: '#FFFFFF' },
        {
          type: 'headline',
          position: 'top',
          fontSize: 215,
          fontWeight: '800',
          fontFamily: FONT,
          charSpacing: 33,
          color: '#611AB4',
          placeholder: 'BLINK',
          marginTop: 221,
          shadow: TEXT_SHADOW,
        },
        {
          type: 'subheadline',
          position: 'top',
          fontSize: 97,
          fontWeight: '800',
          fontFamily: FONT,
          color: '#8030DD',
          placeholder: 'Share Files in a\nFlash',
          marginTop: 477,
          lineHeight: 1.16,
        },
        {
          type: 'device',
          frame: 'pixel9',
          widthFraction: DEVICE_WIDTH_FRACTION,
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
          frame: 'pixel9',
          widthFraction: DEVICE_WIDTH_FRACTION,
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
          position: 'top',
          fontSize: 146,
          fontWeight: '800',
          fontFamily: FONT,
          color: '#FFFFFF',
          placeholder: '100% Free',
          marginTop: 1891,
          shadow: TEXT_SHADOW_HEAVY,
        },
        {
          type: 'subheadline',
          position: 'top',
          fontSize: 86,
          fontWeight: '800',
          fontFamily: FONT,
          color: '#FFFFFF',
          placeholder: 'No Login. No Tracking',
          marginTop: 2073,
          shadow: TEXT_SHADOW,
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
          fontSize: 117,
          fontWeight: '800',
          fontFamily: FONT,
          color: '#8A2BE2',
          placeholder: 'Select & Share\nInstantly',
          marginTop: 140,
          lineHeight: 1.16,
          shadow: TEXT_SHADOW,
        },
        {
          type: 'device',
          frame: 'pixel9',
          widthFraction: DEVICE_WIDTH_FRACTION,
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
          fontSize: 118,
          fontWeight: '800',
          fontFamily: FONT,
          color: '#FFFFFF',
          placeholder: 'Scan &\nDownload',
          marginTop: 153,
          lineHeight: 1.16,
          shadow: TEXT_SHADOW,
        },
        {
          type: 'device',
          frame: 'pixel9',
          widthFraction: DEVICE_WIDTH_FRACTION,
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
          fontSize: 155,
          fontWeight: '800',
          fontFamily: FONT,
          color: '#FFFFFF',
          placeholder: 'Download\nSecurely',
          marginTop: 205,
          lineHeight: 1.16,
          shadow: TEXT_SHADOW,
        },
        {
          type: 'device',
          frame: 'pixel9',
          widthFraction: DEVICE_WIDTH_FRACTION,
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
    palette: BLINK_PALETTE.map((s) => ({ ...s })),
    preview: {
      ...BLINK.preview,
      frame: target.frame,
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
