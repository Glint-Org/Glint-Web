import { describe, expect, it } from 'vitest';
import { ensureSlideHasDevice, resolveTemplateFrame, bindSlideToFrameShot } from '../templateDevices.js';

describe('templateDevices', () => {
  it('resolves frame from preview then store default', () => {
    expect(resolveTemplateFrame({ preview: { frame: 'pixel9' } })).toBe('pixel9');
    expect(resolveTemplateFrame({ store: 'ios/iphone' })).toBe('iphone16-pro-max');
    expect(resolveTemplateFrame({ store: 'play/tv' })).toBe('tv');
  });

  it('adds a device when the slide has none', () => {
    const next = ensureSlideHasDevice(
      { id: 'f1', layers: [{ type: 'background', color: '#000' }] },
      'pixel9',
      { height: 1920 },
    );
    expect(next.layers.some((l) => l.type === 'device' && l.frame === 'pixel9')).toBe(true);
  });

  it('upgrades screenshot layers to device bezels', () => {
    const next = ensureSlideHasDevice(
      {
        layers: [
          { type: 'background', color: '#111' },
          { type: 'screenshot', slot: 2, left: 10, top: 20, width: 100, height: 200 },
        ],
      },
      'tv',
      { height: 1080 },
    );
    const device = next.layers.find((l) => l.type === 'device');
    expect(device).toMatchObject({ frame: 'tv', slot: 2 });
    expect(next.layers.some((l) => l.type === 'screenshot')).toBe(false);
  });

  it('fills missing frame ids on existing device layers', () => {
    const next = ensureSlideHasDevice(
      { layers: [{ type: 'device', slot: 0, scale: 0.5 }] },
      'iphone16-pro-max',
    );
    expect(next.layers[0].frame).toBe('iphone16-pro-max');
  });

  it('remaps pack slots so a board frame paints from screenshot[0]', () => {
    const next = bindSlideToFrameShot({
      layers: [
        { type: 'headline', placeholder: 'Hi' },
        { type: 'device', frame: 'pixel9', slot: 3 },
      ],
    });
    expect(next.layers[1].slot).toBe(0);
  });
});
