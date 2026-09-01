import { describe, expect, it } from 'vitest';
import {
  cleanFontName,
  POPULAR_FONTS,
  searchGoogleFonts,
  parseGoogleMetadata,
} from '../fontLibrary.js';

describe('fontLibrary', () => {
  it('strips fabric font-family suffixes', () => {
    expect(cleanFontName('"Inter", sans-serif')).toBe('Inter');
    expect(cleanFontName('Space Grotesk, sans-serif')).toBe('Space Grotesk');
  });

  it('lists popular fonts with categories', () => {
    expect(POPULAR_FONTS.some((f) => f.name === 'Space Grotesk')).toBe(true);
    expect(POPULAR_FONTS.every((f) => f.category)).toBe(true);
  });

  it('searches google catalog by name', () => {
    const catalog = [
      { name: 'Roboto', category: 'sans' },
      { name: 'Roboto Mono', category: 'mono' },
      { name: 'Pacifico', category: 'script' },
    ];
    expect(searchGoogleFonts(catalog, 'rob').map((f) => f.name)).toEqual(['Roboto', 'Roboto Mono']);
  });

  it('parses google metadata prefix', () => {
    const raw = `)]}'\n{"familyMetadataList":[{"family":"ABeeZee","category":"Sans Serif"}]}`;
    expect(parseGoogleMetadata(raw)).toEqual([{ name: 'ABeeZee', category: 'sans' }]);
  });
});
