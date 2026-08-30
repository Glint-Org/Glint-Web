/**
 * Platform → device catalog for store screenshots.
 * Canonical session/template key: `{platform}/{device}` e.g. play/phone, ios/ipad.
 */

export const PLATFORMS = [
  { id: 'play', label: 'Play Store' },
  { id: 'ios', label: 'App Store' },
];

/** @type {Record<string, StoreTarget>} */
export const STORE_TARGETS = {
  'play/phone': {
    id: 'play/phone',
    platform: 'play',
    device: 'phone',
    label: 'Phone',
    fullLabel: 'Play Store · Phone',
    width: 1080,
    height: 1920,
    filename: 'screen',
    fastlaneFolder: 'phoneScreenshots',
    defaultFrame: 'pixel9',
  },
  'play/tablet-7': {
    id: 'play/tablet-7',
    platform: 'play',
    device: 'tablet-7',
    label: '7″ Tablet',
    fullLabel: 'Play Store · 7″ Tablet',
    width: 1200,
    height: 1920,
    filename: 'tablet7_screen',
    fastlaneFolder: 'sevenInchScreenshots',
    defaultFrame: 'ipad-pro',
  },
  'play/tablet-10': {
    id: 'play/tablet-10',
    platform: 'play',
    device: 'tablet-10',
    label: '10″ Tablet',
    fullLabel: 'Play Store · 10″ Tablet',
    width: 1600,
    height: 2560,
    filename: 'tablet10_screen',
    fastlaneFolder: 'tenInchScreenshots',
    defaultFrame: 'ipad-pro-13',
  },
  'play/tv': {
    id: 'play/tv',
    platform: 'play',
    device: 'tv',
    label: 'TV',
    fullLabel: 'Play Store · TV',
    width: 1920,
    height: 1080,
    filename: 'tv_screen',
    fastlaneFolder: 'tvScreenshots',
    defaultFrame: 'tv',
    landscape: true,
  },
  'play/wear': {
    id: 'play/wear',
    platform: 'play',
    device: 'wear',
    label: 'Wear OS',
    fullLabel: 'Play Store · Wear OS',
    width: 450,
    height: 450,
    filename: 'wear_screen',
    fastlaneFolder: 'wearOsScreenshots',
    defaultFrame: null,
    square: true,
  },
  'play/chromebook': {
    id: 'play/chromebook',
    platform: 'play',
    device: 'chromebook',
    label: 'Chromebook',
    fullLabel: 'Play Store · Chromebook',
    width: 1920,
    height: 1080,
    filename: 'chromebook_screen',
    fastlaneFolder: 'tenInchScreenshots',
    defaultFrame: 'ipad-pro-13',
    landscape: true,
  },
  'ios/iphone': {
    id: 'ios/iphone',
    platform: 'ios',
    device: 'iphone',
    label: 'iPhone',
    fullLabel: 'App Store · iPhone',
    width: 1290,
    height: 2796,
    filename: 'ios_screen',
    fastlaneFolder: 'phoneScreenshots',
    defaultFrame: 'iphone16-pro-max',
  },
  'ios/ipad': {
    id: 'ios/ipad',
    platform: 'ios',
    device: 'ipad',
    label: 'iPad',
    fullLabel: 'App Store · iPad',
    width: 2048,
    height: 2732,
    filename: 'ipad_screen',
    fastlaneFolder: 'tabletScreenshots',
    defaultFrame: 'ipad-pro-13',
  },
};

/** Legacy flat keys → canonical platform/device. */
export const LEGACY_STORE_ALIASES = {
  play: 'play/phone',
  android: 'play/phone',
  ios: 'ios/iphone',
  iphone: 'ios/iphone',
  'ios-tablet': 'ios/ipad',
  ipad: 'ios/ipad',
  feature: 'play/phone',
};

export const STORE_TARGET_IDS = Object.keys(STORE_TARGETS);

/** Device sizes shown in Home / TemplateGallery browse chips. */
export const BROWSE_STORE_IDS = ['play/phone', 'ios/iphone', 'ios/ipad'];

export function devicesForPlatform(platformId, { browse = false } = {}) {
  return STORE_TARGET_IDS.filter((id) => {
    if (STORE_TARGETS[id].platform !== platformId) return false;
    if (browse && !BROWSE_STORE_IDS.includes(id)) return false;
    return true;
  }).map((id) => STORE_TARGETS[id]);
}

/** Normalize any store string to a canonical catalog id. */
export function resolveStoreKey(store) {
  if (!store) return 'play/phone';
  if (STORE_TARGETS[store]) return store;
  if (LEGACY_STORE_ALIASES[store]) return LEGACY_STORE_ALIASES[store];
  // Platform-only → default device
  if (store === 'play') return 'play/phone';
  if (store === 'ios') return 'ios/iphone';
  return 'play/phone';
}

export function getStoreTarget(store) {
  return STORE_TARGETS[resolveStoreKey(store)] ?? STORE_TARGETS['play/phone'];
}

export function storeExportLabel(store, canvas) {
  const target = getStoreTarget(store);
  const w = canvas?.width ?? target.width;
  const h = canvas?.height ?? target.height;
  return `${target.fullLabel} · ${w}×${h}`;
}

/**
 * Gallery filter: `all` | platform id (`play`|`ios`) | full target id (`play/phone`).
 */
export function filterTemplatesByStore(templates, filter) {
  if (!filter || filter === 'all') return templates;
  if (filter === 'play' || filter === 'ios') {
    return templates.filter((t) => getStoreTarget(t.store).platform === filter);
  }
  const key = resolveStoreKey(filter);
  return templates.filter((t) => resolveStoreKey(t.store) === key);
}

/**
 * Two-level browse filters for Home / TemplateGallery.
 * platformFilter: 'all' | 'play' | 'ios'
 * deviceFilter: 'all' | target id
 */
export function browseFilterId(platformFilter, deviceFilter) {
  if (deviceFilter && deviceFilter !== 'all') return deviceFilter;
  if (platformFilter && platformFilter !== 'all') return platformFilter;
  return 'all';
}
