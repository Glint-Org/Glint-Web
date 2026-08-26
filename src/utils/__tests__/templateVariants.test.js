import { describe, expect, it } from 'vitest';
import { buildAllStoreVariants, buildStoreVariant } from '../templateVariants.js';

const baseTemplate = {
  id: 'demo',
  familyId: 'demo',
  name: 'Demo',
  description: 'Base play phone',
  canvas: { width: 1080, height: 1920 },
  preview: {
    art: [{ x: 100, y: 200, w: 50, h: 80 }],
  },
  slides: [
    {
      name: 'Hero',
      layers: [
        { type: 'text', left: 108, top: 192, fontSize: 40, width: 800 },
        { type: 'device', frame: 'pixel9', left: 200, top: 400, width: 600, height: 1200 },
      ],
    },
  ],
  layers: [],
};

describe('templateVariants', () => {
  it('scales play phone template to iPhone canvas', () => {
    const variant = buildStoreVariant(baseTemplate, 'ios/iphone');
    expect(variant.store).toBe('ios/iphone');
    expect(variant.canvas).toEqual({ width: 1290, height: 2796 });
    expect(variant.id).toBe('demo-ios');
    expect(variant.familyId).toBe('demo');

    const text = variant.slides[0].layers[0];
    expect(text.left).toBe(Math.round(108 * (1290 / 1080)));
    expect(text.top).toBe(Math.round(192 * (2796 / 1920)));
    expect(text.fontSize).toBeGreaterThan(40);

    const device = variant.slides[0].layers[1];
    expect(device.frame).toBe('iphone16-pro-max');
  });

  it('builds play + ios + ipad variants', () => {
    const all = buildAllStoreVariants(baseTemplate);
    expect(all.map((v) => v.store)).toEqual(['play/phone', 'ios/iphone', 'ios/ipad']);
    expect(all[0].canvas).toEqual({ width: 1080, height: 1920 });
    expect(all[0].slides[0].layers[1].frame).toBe('pixel9');
  });

  it('scales using STORE_TARGETS for wear and tv', () => {
    const wear = buildStoreVariant(baseTemplate, 'play/wear');
    expect(wear.store).toBe('play/wear');
    expect(wear.canvas).toEqual({ width: 450, height: 450 });
    expect(wear.id).toBe('demo-play-wear');

    const tv = buildStoreVariant(baseTemplate, 'play/tv');
    expect(tv.canvas).toEqual({ width: 1920, height: 1080 });
  });

  it('throws on unknown store keys', () => {
    expect(() => buildStoreVariant(baseTemplate, 'not/a-store')).toThrow(/Unknown store/);
  });
});
