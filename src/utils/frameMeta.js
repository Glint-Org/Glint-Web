/**
 * Screen insets for curated device frames (`public/frames/*`).
 * Photo-real PNGs use native pixel sizes from device-frames-media template.json.
 * `ext`: asset extension. `rx`: screen corner radius in frame pixels.
 */
export const FRAME_INSETS = {
  pixel9: {
    ext: 'png',
    top: 142,
    right: 170,
    bottom: 138,
    left: 170,
    rx: 90,
    width: 1620,
    height: 3136,
  },
  'galaxy-s24': {
    ext: 'png',
    top: 200,
    right: 200,
    bottom: 200,
    left: 200,
    rx: 80,
    width: 1480,
    height: 2800,
  },
  'iphone16-pro': {
    ext: 'png',
    top: 100,
    right: 98,
    bottom: 100,
    left: 102,
    rx: 100,
    width: 1406,
    height: 2822,
  },
  'iphone16-pro-max': {
    ext: 'png',
    top: 100,
    right: 100,
    bottom: 100,
    left: 100,
    rx: 105,
    width: 1520,
    height: 3068,
  },
  'iphone13-pro': {
    ext: 'png',
    top: 155,
    right: 160,
    bottom: 155,
    left: 160,
    rx: 100,
    width: 1570,
    height: 2932,
  },
  'iphone13-pro-max': {
    ext: 'png',
    top: 155,
    right: 160,
    bottom: 160,
    left: 160,
    rx: 105,
    width: 1684,
    height: 3178,
  },
  'ipad-pro-13': {
    ext: 'png',
    top: 115,
    right: 115,
    bottom: 115,
    left: 115,
    rx: 55,
    width: 2448,
    height: 3132,
  },
  'ipad-pro': {
    ext: 'png',
    top: 116,
    right: 116,
    bottom: 116,
    left: 116,
    rx: 50,
    width: 2068,
    height: 2788,
  },
  'ipad-air-2020': {
    ext: 'png',
    top: 55,
    right: 55,
    bottom: 55,
    left: 55,
    rx: 45,
    width: 1940,
    height: 2660,
  },
  'galaxy-s21': {
    ext: 'png',
    top: 200,
    right: 200,
    bottom: 200,
    left: 200,
    rx: 80,
    width: 1480,
    height: 2800,
  },
  'galaxy-s21-ultra': {
    ext: 'png',
    top: 170,
    right: 170,
    bottom: 170,
    left: 170,
    rx: 90,
    width: 1840,
    height: 3600,
  },
  /** Landscape TV / monitor bezel for Play TV listings. */
  tv: {
    ext: 'svg',
    top: 40,
    right: 48,
    bottom: 176,
    left: 48,
    rx: 8,
    width: 1920,
    height: 1200,
  },
};

/**
 * Curated bezels tagged by store platform + form factor.
 * FrameSelector only offers options allowed for the active store target.
 */
export const DEVICE_FRAME_OPTIONS = [
  { id: null, label: 'None' },
  { id: 'pixel9', label: 'Pixel 9', platforms: ['play'], formFactors: ['phone'] },
  { id: 'galaxy-s24', label: 'Galaxy S24', platforms: ['play'], formFactors: ['phone'] },
  { id: 'galaxy-s21', label: 'Galaxy S21', platforms: ['play'], formFactors: ['phone'] },
  { id: 'galaxy-s21-ultra', label: 'Galaxy S21 Ultra', platforms: ['play'], formFactors: ['phone'] },
  { id: 'tv', label: 'TV', platforms: ['play'], formFactors: ['tv'] },
  { id: 'iphone16-pro-max', label: 'iPhone 16 Pro Max', platforms: ['ios'], formFactors: ['iphone'] },
  { id: 'iphone16-pro', label: 'iPhone 16 Pro', platforms: ['ios'], formFactors: ['iphone'] },
  { id: 'iphone13-pro-max', label: 'iPhone 13 Pro Max', platforms: ['ios'], formFactors: ['iphone'] },
  { id: 'iphone13-pro', label: 'iPhone 13 Pro', platforms: ['ios'], formFactors: ['iphone'] },
  { id: 'ipad-pro-13', label: 'iPad Pro 13"', platforms: ['ios', 'play'], formFactors: ['ipad', 'tablet', 'chromebook'] },
  { id: 'ipad-pro', label: 'iPad Pro 11"', platforms: ['ios', 'play'], formFactors: ['ipad', 'tablet'] },
  { id: 'ipad-air-2020', label: 'iPad Air', platforms: ['ios', 'play'], formFactors: ['ipad', 'tablet'] },
];

/** Map store target device → form factor used by DEVICE_FRAME_OPTIONS. */
export const STORE_FORM_FACTOR = {
  phone: 'phone',
  'tablet-7': 'tablet',
  'tablet-10': 'tablet',
  tv: 'tv',
  wear: 'wear',
  chromebook: 'chromebook',
  iphone: 'iphone',
  ipad: 'ipad',
};

/** Fallback when an unknown frame id is requested. */
const DEFAULT_FRAME = 'pixel9';

/** Minimum device size as a fraction of the store frame (canvas). */
export const MIN_DEVICE_COVERAGE = 0.6;
export const MAX_DEVICE_COVERAGE = 0.92;

export function getFrameMeta(frameId) {
  return FRAME_INSETS[frameId] || FRAME_INSETS[DEFAULT_FRAME];
}

/**
 * Device bezels allowed for a store target (platform/device).
 * Always includes None (user can still clear chrome in Design).
 * Play tablets / Chromebook share iPad-class bezels; Wear uses Simple Dark.
 */
export function framesForStore(storeOrTarget) {
  let platform = null;
  let device = null;
  if (typeof storeOrTarget === 'string') {
    const [p, d] = storeOrTarget.split('/');
    platform = p;
    device = d;
  } else if (storeOrTarget && typeof storeOrTarget === 'object') {
    platform = storeOrTarget.platform;
    device = storeOrTarget.device;
  }

  const formFactor = STORE_FORM_FACTOR[device] || device || null;
  return DEVICE_FRAME_OPTIONS.filter((opt) => {
    if (opt.id == null) return true;
    if (!platform || !formFactor) return false;
    if (!opt.platforms?.includes(platform)) return false;
    return opt.formFactors?.includes(formFactor);
  });
}

/** Whether a bezel id (including null) is valid for the active store. */
export function isFrameAllowedForStore(frameId, storeOrTarget) {
  return framesForStore(storeOrTarget).some((f) => f.id === frameId);
}

/** Prefer store defaultFrame when allowed; otherwise None. */
export function resolveFrameForStore(frameId, storeOrTarget, preferredDefault = null) {
  if (isFrameAllowedForStore(frameId, storeOrTarget)) return frameId ?? null;
  if (preferredDefault != null && isFrameAllowedForStore(preferredDefault, storeOrTarget)) {
    return preferredDefault;
  }
  return null;
}

/** Public URL for a curated frame asset. */
export function getFrameSrc(frameId) {
  const meta = getFrameMeta(frameId);
  const ext = meta.ext || 'png';
  return `/frames/${frameId}.${ext}`;
}

/**
 * Convert canvas coverage (e.g. 0.6 = 60% of frame) into SVG/PNG unit scale.
 * Device keeps aspect ratio; size is limited by the tighter canvas axis.
 */
export function resolveDeviceScale(
  frameId,
  canvasW,
  canvasH,
  coverage = MIN_DEVICE_COVERAGE,
  { minCoverage = MIN_DEVICE_COVERAGE, maxCoverage = MAX_DEVICE_COVERAGE } = {},
) {
  const meta = getFrameMeta(frameId);
  const fraction = Math.min(
    maxCoverage,
    Math.max(minCoverage, coverage ?? minCoverage),
  );
  return Math.min((canvasW * fraction) / meta.width, (canvasH * fraction) / meta.height);
}

/** Default chrome for screenshots (no bezel) and drop shadow (any device). */
export const DEFAULT_SCREENSHOT_STYLE = {
  cornerRadius: 28,
  strokeWidth: 0,
  strokeColor: '#FFFFFF',
  scale: 0.58,
  /** Drop shadow — works on framed devices and bare screenshots. */
  shadowEnabled: true,
  shadowBlur: 36,
  shadowOffsetX: 0,
  shadowOffsetY: 22,
  shadowOpacity: 0.4,
  shadowColor: '#000000',
  /** Fake OS status bar: reserved top strip; shot fills the remaining hole. */
  statusBarEnabled: false,
  /** "dark" = light icons on dark strip; "light" = dark icons on light strip. */
  statusBarTheme: 'dark',
  /** Screenshot fit mode inside device frame: 'cover' | 'contain' | 'custom'. */
  fitMode: 'cover',
  /** Custom mode offset (-1 to 1, 0 = centered). */
  fitOffsetX: 0,
  fitOffsetY: 0,
};

export function computeFrameLayout(frameId, targetScale) {
  const meta = getFrameMeta(frameId);
  const frameW = meta.width * targetScale;
  const frameH = meta.height * targetScale;
  const insetL = meta.left * targetScale;
  const insetT = meta.top * targetScale;
  const insetR = meta.right * targetScale;
  const insetB = meta.bottom * targetScale;
  const screenW = frameW - insetL - insetR;
  const screenH = frameH - insetT - insetB;
  const rx = meta.rx * targetScale;
  return { meta, frameW, frameH, insetL, insetT, screenW, screenH, rx };
}
