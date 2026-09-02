import { describe, expect, it } from 'vitest';
import {
  buildPaletteRemap,
  buildThemeFromCounts,
  hueDistance,
  isNeutralRgb,
  mergeColorCounts,
  mixHex,
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

  it('builds semantic theme from histograms', () => {
    const accent = new Map([
      ['96,32,160', 80],
      ['128,48,208', 30],
    ]);
    const neutral = new Map([
      ['248,248,248', 200],
      ['96,32,160', 80],
    ]);
    const theme = buildThemeFromCounts(accent, neutral, ['primary', 'secondary', 'background']);
    expect(theme.primary).toBe('#6020A0');
    expect(theme.background).toBe('#F8F8F8');
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
