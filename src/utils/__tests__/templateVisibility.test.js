import { describe, expect, it } from 'vitest';
import {
  TEMPLATE_ENABLED,
  isTemplateEnabled,
} from '../templateLoader.js';

describe('template visibility', () => {
  it('enables only the six gallery packs', () => {
    const on = Object.entries(TEMPLATE_ENABLED)
      .filter(([, v]) => v)
      .map(([id]) => id)
      .sort();
    expect(on).toEqual([
      'blink-ios',
      'blink-play',
      'blink-tablet',
      'glint-gold-ios',
      'glint-gold-ipad',
      'glint-gold-play',
    ]);
  });

  it('defaults unknown ids to hidden', () => {
    expect(isTemplateEnabled('warm-glow-play')).toBe(false);
    expect(isTemplateEnabled('play-tv')).toBe(false);
    expect(isTemplateEnabled('glint-gold-play')).toBe(true);
  });

  it('lets JSON enabled override the map', () => {
    expect(isTemplateEnabled({ id: 'warm-glow-play', enabled: true })).toBe(true);
    expect(isTemplateEnabled({ id: 'glint-gold-play', enabled: false })).toBe(false);
  });
});
