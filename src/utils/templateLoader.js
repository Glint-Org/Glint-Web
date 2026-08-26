const THEME_CACHE = {};

export async function loadThemePresets() {
  if (Object.keys(THEME_CACHE).length > 0) return THEME_CACHE;
  try {
    const res = await fetch('/templates/config.json');
    if (!res.ok) return THEME_CACHE;
    const config = await res.json();
    if (config.themes) Object.assign(THEME_CACHE, config.themes);
  } catch {
    // Return empty cache on network error
  }
  return THEME_CACHE;
}

export async function loadExportPresets() {
  const res = await fetch('/templates/config.json');
  const config = await res.json();
  return config.exportPresets;
}

export function getTheme(themeId, themes) {
  return themes[themeId] || { type: 'solid', value: '#1C1C1E' };
}

export {
  PLATFORMS,
  STORE_TARGETS,
  STORE_TARGET_IDS,
  filterTemplatesByStore,
  browseFilterId,
  resolveStoreKey,
  getStoreTarget,
  devicesForPlatform,
} from './storeCatalog';

/** Curated store templates — phone / tablet packs + form-factor sets. */
export const TEMPLATE_IDS = [
  // Flagship Glint brand
  'glint-gold-play',
  'glint-gold-ios',
  'glint-gold-ipad',
  // Pixel-matched Figma packs
  'blink-play',
  'blink-ios',
  'blink-tablet',
  // Families (play phone / ios iphone / ios ipad)
  'warm-glow-play',
  'warm-glow-ios',
  'warm-glow-tablet',
  'mint-tags-play',
  'mint-tags-ios',
  'mint-tags-tablet',
  // Legacy curated packs — Play phone
  'play-hero',
  'play-pop',
  'play-feature',
  'play-dual',
  'play-minimal',
  // App Store iPhone
  'ios-clean',
  'ios-wave',
  'ios-dark',
  // App Store iPad
  'tablet-showcase',
  // Play form-factor 5-slide sets
  'play-tablet-7',
  'play-tablet-10',
  'play-tv',
  'play-wear',
  'play-chromebook',
];

export async function loadTemplate(templateId) {
  const res = await fetch(`/templates/${templateId}.json`);
  if (!res.ok) throw new Error(`Template not found: ${templateId}`);
  return res.json();
}

export async function loadAllTemplates() {
  const templates = await Promise.all(
    TEMPLATE_IDS.map(async (id) => {
      try {
        return await loadTemplate(id);
      } catch {
        return null;
      }
    }),
  );
  return templates.filter(Boolean);
}
