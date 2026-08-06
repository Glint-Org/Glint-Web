const THEME_CACHE = {};

export async function loadThemePresets() {
  if (Object.keys(THEME_CACHE).length > 0) return THEME_CACHE;
  const res = await fetch('/templates/config.json');
  const config = await res.json();
  Object.assign(THEME_CACHE, config.themes);
  return THEME_CACHE;
}

export async function loadExportPresets() {
  const res = await fetch('/templates/config.json');
  const config = await res.json();
  return config.exportPresets;
}

export function getTheme(themeId, themes) {
  return themes[themeId] || { type: 'solid', value: '#1a1a2e' };
}

export const TEMPLATE_IDS = [
  'viral-gradient-hero',
  'split-feature',
  'feature-callout',
  'dark-minimal',
  'ios-clean',
  'purple-viral',
  'tablet-showcase',
  'light-minimal',
  'gradient-badge',
  'neon-glow',
  'centered-hero',
  'dual-phone',
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
