/**
 * Live network checks for Google Fonts metadata + CSS (run: vitest run fontLibrary.integration).
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  parseGoogleMetadata,
  searchGoogleFonts,
} from '../fontLibrary.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const CATALOG_PATH = join(ROOT, 'public/fonts/google-fonts-catalog.json');
const METADATA_URL = 'https://fonts.google.com/metadata/fonts';
const CSS_URL = (family) =>
  `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:wght@400;700&display=swap`;

describe('fontLibrary (live Google Fonts)', () => {
  it('bundled catalog lists 1000+ google font families', () => {
    const list = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
    expect(list.length).toBeGreaterThan(1000);
    expect(list.some((f) => f.name === 'Roboto')).toBe(true);
    expect(list.some((f) => f.name === 'Space Grotesk')).toBe(true);
  });

  it('fetches and parses the metadata catalog', async () => {
    const res = await fetch(METADATA_URL);
    expect(res.ok).toBe(true);
    const list = parseGoogleMetadata(await res.text());
    expect(list.length).toBeGreaterThan(1000);
    expect(list.some((f) => f.name === 'Roboto')).toBe(true);
  });

  it('search finds partial names in bundled catalog', () => {
    const list = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
    const hits = searchGoogleFonts(list, 'playfair');
    expect(hits.some((f) => f.name === 'Playfair Display')).toBe(true);
  });

  it('loads CSS for a google font family', async () => {
    const res = await fetch(CSS_URL('Roboto'));
    expect(res.ok).toBe(true);
    const css = await res.text();
    expect(css).toMatch(/Roboto/i);
    expect(css).toMatch(/url\(/);
  });
});
