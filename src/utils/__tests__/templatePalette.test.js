import { describe, expect, it } from 'vitest';
import {
  getTemplatePalette,
  normalizeHex,
  remapDesignColors,
} from '../templatePalette.js';

const blinkish = {
  palette: [
    { id: 'primary', label: 'Primary', color: '#611AB4' },
    { id: 'secondary', label: 'Secondary', color: '#8030DD' },
  ],
  slides: [
    {
      layers: [
        { type: 'background', color: '#FFFFFF' },
        { type: 'headline', color: '#611AB4', placeholder: 'BLINK' },
        { type: 'shape', fill: '#611AB4' },
      ],
    },
  ],
};

describe('templatePalette', () => {
  it('normalizes short hex', () => {
    expect(normalizeHex('#abc')).toBe('#AABBCC');
  });

  it('reads authored palette', () => {
    const p = getTemplatePalette(blinkish);
    expect(p).toHaveLength(2);
    expect(p[0].label).toBe('Primary');
    expect(p[0].color).toBe('#611AB4');
  });

  it('remaps design tree colors', () => {
    const next = remapDesignColors(blinkish, '#611AB4', '#FF0000');
    expect(next.slides[0].layers[1].color).toBe('#FF0000');
    expect(next.slides[0].layers[2].fill).toBe('#FF0000');
    expect(next.palette[0].color).toBe('#FF0000');
    expect(next.slides[0].layers[0].color).toBe('#FFFFFF');
  });
});
