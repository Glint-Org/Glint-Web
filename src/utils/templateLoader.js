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

/** Filters for home + editor template gallery (matches template.store). */
export const STORE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'play', label: 'Play Store' },
  { id: 'ios', label: 'App Store' },
  { id: 'ios-tablet', label: 'iPad' },
];

export function filterTemplatesByStore(templates, storeFilter) {
  if (!storeFilter || storeFilter === 'all') return templates;
  return templates.filter((t) => t.store === storeFilter);
}

/** Curated store-only templates - simple, premium, few. */
export const TEMPLATE_IDS = [
  // Pixel-matched Figma packs
  'blink-play',
  'blink-ios',
  'blink-tablet',
  // New families (play / ios / tablet variants)
  'warm-glow-play',
  'warm-glow-ios',
  'warm-glow-tablet',
  'mint-tags-play',
  'mint-tags-ios',
  'mint-tags-tablet',
  // Legacy curated packs
  'play-hero',
  'play-pop',
  'play-feature',
  'play-dual',
  'play-minimal',
  'ios-clean',
  'ios-wave',
  'ios-dark',
  'tablet-showcase',
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
