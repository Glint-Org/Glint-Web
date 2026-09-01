/**
 * Google + user-uploaded fonts for the editor.
 * Google list: fonts.google.com/metadata (CSS loaded on demand, no API key).
 * Custom fonts persist in IndexedDB across sessions.
 */

const DB_NAME = 'glint-fonts';
const DB_VERSION = 1;
const STORE = 'fonts';
const CATALOG_CACHE_KEY = 'glint.googleFontsCatalog.v1';
const CATALOG_URL = '/fonts/google-fonts-catalog.json';

/** Shown when the catalog is loading or search is empty. */
export const POPULAR_FONTS = [
  { name: 'Space Grotesk', category: 'sans' },
  { name: 'Inter', category: 'sans' },
  { name: 'DM Sans', category: 'sans' },
  { name: 'Plus Jakarta Sans', category: 'sans' },
  { name: 'Outfit', category: 'sans' },
  { name: 'Montserrat', category: 'sans' },
  { name: 'Poppins', category: 'sans' },
  { name: 'Roboto', category: 'sans' },
  { name: 'Open Sans', category: 'sans' },
  { name: 'Lato', category: 'sans' },
  { name: 'Playfair Display', category: 'serif' },
  { name: 'Merriweather', category: 'serif' },
  { name: 'Bebas Neue', category: 'display' },
  { name: 'Oswald', category: 'display' },
];

/** @deprecated use POPULAR_FONTS */
export const GOOGLE_FONTS = POPULAR_FONTS;

export const FONT_CATEGORY_LABELS = {
  sans: 'Sans serif',
  serif: 'Serif',
  display: 'Display',
  script: 'Script',
  mono: 'Monospace',
};

const loadedGoogle = new Set(['Inter', 'Space Grotesk', 'Montserrat']);
const loadedCustom = new Set();
/** @type {Map<string, { name: string }>} */
const customCatalog = new Map();

/** @type {{ name: string, category: string }[] | null} */
let googleCatalog = null;
/** @type {Promise<{ name: string, category: string }[]> | null} */
let googleCatalogPromise = null;

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'name' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbReq(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function mapGoogleCategory(raw) {
  const c = String(raw || '').toLowerCase();
  if (c.includes('mono')) return 'mono';
  if (c.includes('hand')) return 'script';
  if (c.includes('display')) return 'display';
  if (c.includes('serif') && !c.includes('sans')) return 'serif';
  return 'sans';
}

export function parseGoogleMetadata(text) {
  const json = JSON.parse(text.replace(/^\)\]\}'\n?/, ''));
  return (json.familyMetadataList || []).map((f) => ({
    name: f.family,
    category: mapGoogleCategory(f.category),
  }));
}

/** Fetch ~1,900 Google Font families (bundled JSON + session cache). */
export async function fetchGoogleFontCatalog() {
  if (googleCatalog) return googleCatalog;
  if (googleCatalogPromise) return googleCatalogPromise;

  googleCatalogPromise = (async () => {
    try {
      const cached = sessionStorage.getItem(CATALOG_CACHE_KEY);
      if (cached) {
        googleCatalog = JSON.parse(cached);
        return googleCatalog;
      }
    } catch {
      /* ignore */
    }

    const res = await fetch(CATALOG_URL);
    if (!res.ok) throw new Error('Google Fonts catalog unavailable');
    const raw = await res.json();
    const list = (Array.isArray(raw) ? raw : []).map((f) => ({
      name: f.name,
      category: f.category || 'sans',
    }));
    if (!list.length) throw new Error('Google Fonts catalog empty');
    googleCatalog = list;
    try {
      sessionStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(list));
    } catch {
      /* quota */
    }
    return list;
  })();

  try {
    return await googleCatalogPromise;
  } catch (err) {
    googleCatalogPromise = null;
    throw err;
  }
}

export function searchGoogleFonts(catalog, query, limit = 80) {
  const q = query.trim().toLowerCase();
  if (!q || !catalog?.length) return [];
  const out = [];
  for (const f of catalog) {
    if (f.name.toLowerCase().includes(q)) {
      out.push(f);
      if (out.length >= limit) break;
    }
  }
  return out;
}

export function isGoogleFontLoaded(name) {
  return loadedGoogle.has(cleanFontName(name));
}

export function cleanFontName(family) {
  return (family || 'Space Grotesk').replace(/,.*/, '').replace(/"/g, '').trim() || 'Space Grotesk';
}

export function loadGoogleFont(fontName) {
  const name = cleanFontName(fontName);
  if (typeof document === 'undefined' || !name || loadedGoogle.has(name)) return Promise.resolve();
  loadGoogleFontSync(name);
  if (!document.fonts?.load) return Promise.resolve();
  return document.fonts.load(`400 16px "${name}"`).catch(() => {});
}

function loadGoogleFontSync(fontName) {
  const name = cleanFontName(fontName);
  if (typeof document === 'undefined' || !name || loadedGoogle.has(name)) return;
  const link = document.createElement('link');
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name).replace(/%20/g, '+')}:wght@400;500;600;700;800&display=swap`;
  link.rel = 'stylesheet';
  document.head.appendChild(link);
  loadedGoogle.add(name);
}

async function registerCustomFont(record) {
  if (!record?.blob || loadedCustom.has(record.name)) return;
  const url = URL.createObjectURL(record.blob);
  try {
    const face = new FontFace(record.name, `url(${url})`);
    await face.load();
    document.fonts.add(face);
    loadedCustom.add(record.name);
    customCatalog.set(record.name, { name: record.name });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function listCustomFonts() {
  if (typeof indexedDB === 'undefined') return [];
  const db = await openDb();
  try {
    const rows = await idbReq(db.transaction(STORE, 'readonly').objectStore(STORE).getAll());
    return (rows || []).map((r) => ({ name: r.name }));
  } finally {
    db.close();
  }
}

export async function restoreCustomFonts() {
  const list = await listCustomFonts();
  await Promise.all(list.map(async (row) => {
    const db = await openDb();
    try {
      const record = await idbReq(db.transaction(STORE, 'readonly').objectStore(STORE).get(row.name));
      if (record) await registerCustomFont(record);
    } finally {
      db.close();
    }
  }));
  return list;
}

function fontNameFromFile(file) {
  return (file?.name || 'Custom Font').replace(/\.(ttf|otf|woff2?|ttc)$/i, '').trim() || 'Custom Font';
}

async function uniqueCustomName(base) {
  const db = await openDb();
  try {
    let name = base.slice(0, 48);
    let n = 2;
    while (await idbReq(db.transaction(STORE, 'readonly').objectStore(STORE).get(name))) {
      name = `${base.slice(0, 44)} ${n}`;
      n += 1;
    }
    return name;
  } finally {
    db.close();
  }
}

export async function addCustomFont(file) {
  if (!file) throw new Error('No file');
  const base = fontNameFromFile(file);
  const name = await uniqueCustomName(base);
  const record = { name, blob: file, mime: file.type || 'font/ttf', updatedAt: Date.now() };
  const db = await openDb();
  try {
    await idbReq(db.transaction(STORE, 'readwrite').objectStore(STORE).put(record));
  } finally {
    db.close();
  }
  await registerCustomFont(record);
  return { name };
}

export function isCustomFont(name) {
  return customCatalog.has(cleanFontName(name));
}

export async function ensureFontReady(fontFamily, fontWeight = '700') {
  const name = cleanFontName(fontFamily);
  if (customCatalog.has(name)) {
    const db = await openDb();
    try {
      const record = await idbReq(db.transaction(STORE, 'readonly').objectStore(STORE).get(name));
      if (record) await registerCustomFont(record);
    } finally {
      db.close();
    }
  } else {
    await loadGoogleFont(name);
  }
  if (typeof document === 'undefined' || !document.fonts?.load) return;
  try {
    await document.fonts.load(`${fontWeight} 64px "${name}"`);
  } catch {
    /* system fallback */
  }
}
