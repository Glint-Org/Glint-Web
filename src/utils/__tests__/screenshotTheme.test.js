import { describe, expect, it } from 'vitest';
import {
  brandScore,
  buildHarmonyFromPrimary,
  buildPaletteRemap,
  buildThemeFromCounts,
  clusterAccentsByHue,
  hueDistance,
  isNeutralRgb,
  mergeColorCounts,
  mixHex,
  pickClusterRepresentative,
  punchSaturation,
  rgbToHue,
} from '../screenshotTheme.js';

describe('screenshotTheme', () => {
  it('filters neutral pixels', () => {
    expect(isNeutralRgb(255, 255, 255)).toBe(true);
    expect(isNeutralRgb(10, 10, 10)).toBe(true);
    expect(isNeutralRgb(200, 50, 50)).toBe(false);
  });

  it('separates hue distance', () => {
    expect(hueDistance(rgbToHue(200, 50, 50), rgbToHue(50, 50, 200))).toBeGreaterThan(40);
    expect(hueDistance(rgbToHue(100, 30, 160), rgbToHue(110, 35, 170))).toBeLessThan(15);
  });

  it('prefers vivid mid-lum brand over dull large area', () => {
    const vividSmall = brandScore({ sat: 0.72, lum: 0.4, weight: 40 });
    const dullLarge = brandScore({ sat: 0.2, lum: 0.75, weight: 400 });
    expect(vividSmall).toBeGreaterThan(dullLarge);
  });

  it('picks brand primary hue and derives harmony (not 2nd histogram peak)', () => {
    // Large washed teal area + smaller vivid purple brand
    const accent = new Map([
      ['48,160,160', 400], // teal - many pixels, low brand quality
      ['96,32,160', 55], // purple brand
      ['112,40,184', 28],
    ]);
    const neutral = new Map([
      ['248,248,248', 500],
      ['48,160,160', 400],
    ]);
    const theme = buildThemeFromCounts(accent, neutral, [
      'primary',
      'secondary',
      'accent',
      'soft',
      'background',
    ]);
    // Primary should be in purple family, not teal
    const primaryHue = rgbToHue(
      parseInt(theme.primary.slice(1, 3), 16),
      parseInt(theme.primary.slice(3, 5), 16),
      parseInt(theme.primary.slice(5, 7), 16),
    );
    expect(hueDistance(primaryHue, 280)).toBeLessThan(40);
    expect(theme.background).toBe('#F8F8F8');
    // Secondary is a shade of primary (darker), not teal
    expect(theme.secondary).not.toMatch(/^#30A0/i);
    expect(theme.soft).toBeTruthy();
  });

  it('clusters accents by hue and picks vivid representative', () => {
    const entries = [
      { hex: '#6020A0', hue: 276, sat: 0.7, lum: 0.38, weight: 40, score: 10 },
      { hex: '#7030B0', hue: 280, sat: 0.55, lum: 0.5, weight: 20, score: 6 },
      { hex: '#20A080', hue: 164, sat: 0.75, lum: 0.45, weight: 15, score: 4 },
    ];
    const clusters = clusterAccentsByHue(entries, 24);
    expect(clusters[0].entries.length).toBeGreaterThanOrEqual(2);
    const rep = pickClusterRepresentative(clusters[0]);
    expect(rep.hex).toMatch(/^#/);
  });

  it('builds harmony palette from a primary', () => {
    const h = buildHarmonyFromPrimary('#611AB4', '#FFFFFF');
    expect(h.primary).toMatch(/^#/);
    expect(h.secondary).not.toBe(h.primary);
    expect(h.background).toBe('#FFFFFF');
  });

  it('punches saturation without changing neutrals much', () => {
    expect(punchSaturation('#808080', 0.2)).toBe('#808080');
    const punched = punchSaturation('#8020A0', 0.2);
    expect(punched).toMatch(/^#/);
    expect(punched).not.toBe('#8020A0');
  });

  it('merges histograms', () => {
    const a = new Map([['96,32,160', 3]]);
    const b = new Map([['96,32,160', 2], ['128,48,208', 1]]);
    const merged = mergeColorCounts([a, b]);
    expect(merged.get('96,32,160')).toBe(5);
  });

  it('maps theme by slot id', () => {
    const palette = [
      { id: 'primary', color: '#611AB4' },
      { id: 'background', color: '#FFFFFF' },
    ];
    const pairs = buildPaletteRemap(palette, { primary: '#FF0000', background: '#EEEEEE' });
    expect(pairs).toContainEqual(['#611AB4', '#FF0000']);
    expect(pairs).toContainEqual(['#FFFFFF', '#EEEEEE']);
  });

  it('mixes hex colors', () => {
    expect(mixHex('#000000', '#FFFFFF', 0.5)).toBe('#808080');
  });
});
