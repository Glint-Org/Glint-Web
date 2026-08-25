/** Decorative SVGs in /public/graphics - recolor via #A10000 / #B10000 / #C10000 (a/b/c). */

/** Default insert placement on a 1080x1920 Play canvas (scaled by caller if needed). */
export const GRAPHICS = [
  {
    id: 'soft-blob',
    src: 'soft-blob.svg',
    label: 'Soft blob',
    defaultPlacement: { left: 420, top: 980, width: 520 },
  },
  {
    id: 'glow-ring',
    src: 'glow-ring.svg',
    label: 'Glow ring',
    defaultPlacement: { left: 280, top: 720, width: 520 },
  },
  {
    id: 'spark-mini',
    src: 'spark-mini.svg',
    label: 'Sparks',
    defaultPlacement: { left: 48, top: 120, width: 200 },
  },
  {
    id: 'wave-cap',
    src: 'wave-cap.svg',
    label: 'Wave cap',
    defaultPlacement: { left: 0, top: 1500, width: 1080 },
  },
  {
    id: 'curve-sweep',
    src: 'curve-sweep.svg',
    label: 'Curve sweep',
    defaultPlacement: { left: 360, top: -40, width: 720 },
  },
  {
    id: 'blob-cluster',
    src: 'blob-cluster.svg',
    label: 'Blobs',
    defaultPlacement: { left: 0, top: 0, width: 1080 },
  },
  {
    id: 'wave-layers',
    src: 'wave-layers.svg',
    label: 'Waves',
    defaultPlacement: { left: 0, top: 0, width: 1080 },
  },
  {
    id: 'rings',
    src: 'rings.svg',
    label: 'Rings',
    defaultPlacement: { left: 0, top: 0, width: 1080 },
  },
  {
    id: 'orb-cluster',
    src: 'orb-cluster.svg',
    label: 'Orbs',
    defaultPlacement: { left: 0, top: 0, width: 1080 },
  },
  {
    id: 'sparkles',
    src: 'sparkles.svg',
    label: 'Sparkles',
    defaultPlacement: { left: 0, top: 0, width: 1080 },
  },
  {
    id: 'confetti',
    src: 'confetti.svg',
    label: 'Confetti',
    defaultPlacement: { left: 0, top: 0, width: 1080 },
  },
  {
    id: 'arch',
    src: 'arch.svg',
    label: 'Arch',
    defaultPlacement: { left: 0, top: 0, width: 1080 },
  },
  {
    id: 'dots-grid',
    src: 'dots-grid.svg',
    label: 'Dots',
    defaultPlacement: { left: 0, top: 0, width: 1080 },
  },
  {
    id: 'leaf-flourish',
    src: 'leaf-flourish.svg',
    label: 'Flourish',
    defaultPlacement: { left: 0, top: 0, width: 1080 },
  },
  {
    id: 'diagonal-bars',
    src: 'diagonal-bars.svg',
    label: 'Bars',
    defaultPlacement: { left: 0, top: 0, width: 1080 },
  },
];

export const SLOT_COLORS = {
  a: '#00A',
  b: '#00B',
  c: '#00C',
};

export function getGraphicById(id) {
  return GRAPHICS.find((g) => g.id === id) || null;
}

export function getGraphicBySrc(src) {
  const file = (src || '').split('/').pop();
  return GRAPHICS.find((g) => g.src === file) || null;
}
